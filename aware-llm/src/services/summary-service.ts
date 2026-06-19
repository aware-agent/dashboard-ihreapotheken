import {
	PutCommand,
	QueryCommand,
	UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { awareHealthAgent } from "../agents/aware-health-agent.js";
import { runAgent } from "../agents/runner.js";
import type { AgentContext } from "../agents/types.js";
import { CHAT_TABLE_NAME, getDocumentClient } from "../db/dynamodb-client.js";
import type { MessageEntity, SummaryEntity } from "../db/entities.js";
import {
	conversationPk,
	createSummaryEntity,
	nowIso,
	summarySk,
} from "../db/keys.js";
import { logger } from "../utils/logger.js";
import { estimateTokensForMessages } from "../utils/token-counter.js";

const docClient = getDocumentClient();

export interface ConversationSummaryData {
	content: string;
	tokenCount: number;
	version: number;
	coversMessagesFrom: string;
	coversMessagesTo: string;
	messagesCoveredCount: number;
}

export interface SummarizationConfig {
	MAX_UNSUMMARIZED_TOKENS: number;
	MAX_UNSUMMARIZED_MESSAGES: number;
	TIME_THRESHOLD_MS: number;
	MIN_MESSAGES_FOR_TIME_TRIGGER: number;
}

const DEFAULT_SUMMARIZATION_CONFIG: SummarizationConfig = {
	MAX_UNSUMMARIZED_TOKENS: 4000,
	MAX_UNSUMMARIZED_MESSAGES: 15,
	TIME_THRESHOLD_MS: 60 * 60 * 1000,
	MIN_MESSAGES_FOR_TIME_TRIGGER: 8,
};

export async function getLatestSummary(
	conversationId: string,
): Promise<ConversationSummaryData | null> {
	const result = await docClient.send(
		new QueryCommand({
			TableName: CHAT_TABLE_NAME,
			KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
			ExpressionAttributeValues: {
				":pk": conversationPk(conversationId),
				":skPrefix": "SUMMARY#",
			},
			ScanIndexForward: false,
			Limit: 1,
		}),
	);

	const item = (result.Items?.[0] as SummaryEntity | undefined) ?? null;
	if (!item) return null;

	return {
		content: item.content,
		tokenCount: item.tokenCount,
		version: item.version,
		coversMessagesFrom: item.coversMessagesFrom,
		coversMessagesTo: item.coversMessagesTo,
		messagesCoveredCount: item.messagesCoveredCount,
	};
}

export async function shouldSummarizeConversation(
	conversationId: string,
	config: SummarizationConfig = DEFAULT_SUMMARIZATION_CONFIG,
): Promise<boolean> {
	const result = await docClient.send(
		new QueryCommand({
			TableName: CHAT_TABLE_NAME,
			KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
			ExpressionAttributeValues: {
				":pk": conversationPk(conversationId),
				":skPrefix": "MSG#",
			},
			ScanIndexForward: true,
		}),
	);

	const messages = (result.Items ?? []) as MessageEntity[];
	if (messages.length === 0) return false;

	const unsummarized = messages.filter((m) => !m.summarized);
	if (unsummarized.length === 0) return false;

	const approximateTokens = estimateTokensForMessages(
		unsummarized.map((m) => ({ role: m.role, content: m.content })),
	);

	if (approximateTokens > config.MAX_UNSUMMARIZED_TOKENS) {
		return true;
	}

	if (unsummarized.length > config.MAX_UNSUMMARIZED_MESSAGES) {
		return true;
	}

	const first = unsummarized[0];
	const firstTimestamp =
		first.createdAt ??
		new Date(first.SK.split("#")[1] ?? nowIso()).toISOString();
	const ageMs = Date.now() - new Date(firstTimestamp).getTime();

	if (
		ageMs > config.TIME_THRESHOLD_MS &&
		unsummarized.length >= config.MIN_MESSAGES_FOR_TIME_TRIGGER
	) {
		return true;
	}

	return false;
}

export async function createOrUpdateSummary(options: {
	conversationId: string;
	existingSummary?: ConversationSummaryData | null;
}): Promise<ConversationSummaryData | null> {
	const { conversationId } = options;

	const result = await docClient.send(
		new QueryCommand({
			TableName: CHAT_TABLE_NAME,
			KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
			ExpressionAttributeValues: {
				":pk": conversationPk(conversationId),
				":skPrefix": "MSG#",
			},
			ScanIndexForward: true,
		}),
	);

	const messages = (result.Items ?? []) as MessageEntity[];
	if (messages.length === 0) return null;

	const unsummarized = messages.filter((m) => !m.summarized);
	if (unsummarized.length === 0) return options.existingSummary ?? null;

	const historyText = unsummarized
		.map((m) => {
			const [, iso] = m.SK.split("#", 2);
			const ts = iso ?? m.createdAt;
			const speaker = m.role === "assistant" ? "Assistant" : "User";
			return `[${ts}] ${speaker}: ${m.content}`;
		})
		.join("\n");

	const summarizationPrompt = `Summarize the following conversation between a user and a health assistant.

Requirements:
- Capture key health topics discussed (biomarkers, conditions, concerns)
- Note any specific values or thresholds mentioned
- Preserve user preferences or stated goals
- Keep actionable advice that was given
- Be concise but complete (target: 200-300 words)

Conversation to summarize:
${historyText}

Summary:`;

	const agent = awareHealthAgent as unknown as {
		name: string;
	};

	const start = Date.now();
	const resultAgent = await runAgent(
		agent as never,
		[
			{
				type: "message",
				role: "user",
				content: summarizationPrompt,
			},
		] as never,
		{
			context: {} as AgentContext,
			maxTurns: 1,
		} as never,
	);
	const latencyMs = Date.now() - start;

	const summaryText =
		resultAgent.finalOutput ??
		"Summary unavailable due to an internal error while summarizing.";

	const tokenCount = estimateTokensForMessages([
		{ role: "assistant", content: summaryText },
	]);

	const firstSk = unsummarized[0]?.SK ?? summarySk(1);
	const lastSk = unsummarized[unsummarized.length - 1]?.SK ?? summarySk(1);

	const existing =
		options.existingSummary ?? (await getLatestSummary(conversationId));
	const newVersion = existing ? existing.version + 1 : 1;

	const entity = createSummaryEntity({
		conversationId,
		version: newVersion,
		content: summaryText,
		tokenCount,
		coversMessagesFrom: firstSk,
		coversMessagesTo: lastSk,
		messagesCoveredCount: unsummarized.length,
	});

	await docClient.send(
		new PutCommand({
			TableName: CHAT_TABLE_NAME,
			Item: entity,
		}),
	);

	await Promise.all(
		unsummarized.map((m) =>
			docClient.send(
				new UpdateCommand({
					TableName: CHAT_TABLE_NAME,
					Key: { PK: m.PK, SK: m.SK },
					UpdateExpression:
						"SET summarized = :summarized, updatedAt = :updatedAt",
					ExpressionAttributeValues: {
						":summarized": true,
						":updatedAt": nowIso(),
					},
				}),
			),
		),
	);

	logger.info("Conversation summarized", {
		conversationId,
		version: newVersion,
		messagesCovered: unsummarized.length,
		latencyMs,
	});

	return {
		content: summaryText,
		tokenCount,
		version: newVersion,
		coversMessagesFrom: firstSk,
		coversMessagesTo: lastSk,
		messagesCoveredCount: unsummarized.length,
	};
}

