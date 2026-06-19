import { randomUUID } from "node:crypto";
import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { CHAT_TABLE_NAME, getDocumentClient } from "../db/dynamodb-client.js";
import type { MessageEntity, MessageRole } from "../db/entities.js";
import {
	conversationPk,
	createMessageEntity,
	messageSk,
	nowIso,
} from "../db/keys.js";
import { logger } from "../utils/logger.js";
import { estimateTokens } from "../utils/token-counter.js";

export interface AppendMessageInput {
	conversationId: string;
	role: MessageRole;
	content: string;
	contextSnapshot?: MessageEntity["contextSnapshot"];
	modelUsed?: string;
	timestamp?: string;
}

export interface StoredMessage {
	id: string;
	conversationId: string;
	role: MessageRole;
	content: string;
	timestamp: string;
	contextSnapshot?: MessageEntity["contextSnapshot"];
	summarized: boolean;
}

const docClient = getDocumentClient();

export async function appendMessage(
	input: AppendMessageInput,
): Promise<StoredMessage> {
	const messageId = randomUUID();
	const timestamp = input.timestamp ?? nowIso();
	const tokenCount = estimateTokens(input.content);

	const entity = createMessageEntity({
		conversationId: input.conversationId,
		messageId,
		role: input.role,
		content: input.content,
		tokenCount,
		contextSnapshot: input.contextSnapshot,
		modelUsed: input.modelUsed,
		timestamp,
	});

	await docClient.send(
		new PutCommand({
			TableName: CHAT_TABLE_NAME,
			Item: entity,
		}),
	);

	logger.debug("Stored chat message", {
		conversationId: input.conversationId,
		messageId,
		role: input.role,
		tokenCount,
	});

	return {
		id: messageId,
		conversationId: input.conversationId,
		role: input.role,
		content: input.content,
		timestamp,
		contextSnapshot: input.contextSnapshot,
		summarized: false,
	};
}

export interface GetMessagesOptions {
	limit?: number;
	beforeSk?: string;
}

export async function getMessages(
	conversationId: string,
	options: GetMessagesOptions = {},
): Promise<StoredMessage[]> {
	const { limit, beforeSk } = options;

	const params: QueryCommand["input"] = {
		TableName: CHAT_TABLE_NAME,
		KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
		ExpressionAttributeValues: {
			":pk": conversationPk(conversationId),
			":skPrefix": "MSG#",
		},
		ScanIndexForward: false, // newest first
		...(limit ? { Limit: limit } : {}),
	};

	if (beforeSk) {
		params.KeyConditionExpression =
			"PK = :pk AND SK < :beforeSk AND begins_with(SK, :skPrefix)";
		params.ExpressionAttributeValues = {
			...params.ExpressionAttributeValues,
			":beforeSk": beforeSk,
		};
	}

	const result = await docClient.send(new QueryCommand(params));

	const items = (result.Items ?? []) as MessageEntity[];

	return items
		.map((item) => {
			const [, iso] = item.SK.split("#", 2);
			return {
				id: item.messageId,
				conversationId: item.conversationId,
				role: item.role,
				content: item.content,
				timestamp: iso ?? item.createdAt,
				contextSnapshot: item.contextSnapshot,
				summarized: item.summarized,
			} satisfies StoredMessage;
		})
		.reverse(); // return oldest-first for UI
}

export async function getRecentMessages(
	conversationId: string,
	limit: number,
): Promise<StoredMessage[]> {
	const result = await docClient.send(
		new QueryCommand({
			TableName: CHAT_TABLE_NAME,
			KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
			ExpressionAttributeValues: {
				":pk": conversationPk(conversationId),
				":skPrefix": "MSG#",
			},
			ScanIndexForward: false, // newest first
			Limit: limit,
		}),
	);

	const items = (result.Items ?? []) as MessageEntity[];

	return items
		.map((item) => {
			const [, iso] = item.SK.split("#", 2);
			return {
				id: item.messageId,
				conversationId: item.conversationId,
				role: item.role,
				content: item.content,
				timestamp: iso ?? item.createdAt,
				contextSnapshot: item.contextSnapshot,
				summarized: item.summarized,
			} satisfies StoredMessage;
		})
		.reverse();
}

export async function markMessagesSummarized(
	conversationId: string,
	messageIds: string[],
): Promise<void> {
	if (messageIds.length === 0) return;

	const result = await docClient.send(
		new QueryCommand({
			TableName: CHAT_TABLE_NAME,
			KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
			ExpressionAttributeValues: {
				":pk": conversationPk(conversationId),
				":skPrefix": "MSG#",
			},
		}),
	);

	const items = (result.Items ?? []) as MessageEntity[];
	const toUpdate = items.filter((item) =>
		messageIds.includes(item.messageId),
	);

	await Promise.all(
		toUpdate.map((item) =>
			docClient.send(
				new UpdateCommand({
					TableName: CHAT_TABLE_NAME,
					Key: { PK: item.PK, SK: item.SK },
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

	logger.debug("Marked messages as summarized", {
		conversationId,
		count: toUpdate.length,
	});
}

/**
 * Helper to compute the sort key for a message, useful when paginating
 * with the `beforeSk` parameter.
 */
export function buildMessageSortKey(
	timestampIso: string,
	messageId: string,
): string {
	return messageSk(timestampIso, messageId);
}

