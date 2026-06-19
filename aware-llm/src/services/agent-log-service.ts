import { randomUUID } from "node:crypto";
import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { CHAT_TABLE_NAME, getDocumentClient } from "../db/dynamodb-client.js";
import type { AgentLogEntity } from "../db/entities.js";
import { createAgentLogEntity, nowIso } from "../db/keys.js";
import { logger } from "../utils/logger.js";

const docClient = getDocumentClient();

const LOG_CONFIG = {
	TTL_DAYS: 30,
	ERROR_TTL_DAYS: 90,
	MAX_MESSAGE_CONTENT_LENGTH: 10_000,
	MAX_TOOL_RESULT_LENGTH: 5_000,
	MAX_STACK_TRACE_LENGTH: 2_000,
} as const;

export interface AgentRequestLogInput {
	conversationId: string;
	messageId: string;
	userId: string;
	request: {
		model: string;
		messages: Array<{ role: string; content: string }>;
		tools?: string[];
		temperature?: number;
		maxTokens?: number;
	};
}

export interface AgentLogKey {
	logId: string;
	pk: string;
	sk: string;
}

export interface AgentResponseLogInput {
	logId: string;
	pk: string;
	sk: string;
	response: {
		content: string;
		finishReason: string;
		toolCalls?: Array<{
			name: string;
			arguments: string;
			result?: string;
		}>;
	};
	metrics: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
		latencyMs: number;
		agentTurns: number;
	};
}

export interface AgentErrorLogInput {
	logId: string;
	pk: string;
	sk: string;
	error: {
		code: string;
		message: string;
		stack?: string;
		retryCount: number;
		guardrailTriggered?: string;
	};
	metrics: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
		latencyMs: number;
		agentTurns: number;
	};
}

function truncate(str: string, max: number): string {
	if (str.length <= max) return str;
	return `${str.slice(0, max)}…[truncated]`;
}

export async function logAgentRequest(
	input: AgentRequestLogInput,
): Promise<AgentLogKey> {
	const logId = randomUUID();
	const timestamp = nowIso();

	const sanitizedMessages = input.request.messages.map((m) => ({
		role: m.role,
		content: truncate(m.content, LOG_CONFIG.MAX_MESSAGE_CONTENT_LENGTH),
	}));

	const entity: AgentLogEntity = createAgentLogEntity({
		logId,
		conversationId: input.conversationId,
		messageId: input.messageId,
		userId: input.userId,
		status: "PENDING",
		request: {
			model: input.request.model,
			messages: sanitizedMessages,
			tools: input.request.tools,
			temperature: input.request.temperature,
			maxTokens: input.request.maxTokens,
		},
		metrics: {
			promptTokens: 0,
			completionTokens: 0,
			totalTokens: 0,
			latencyMs: 0,
			agentTurns: 0,
		},
		error: undefined,
		timestamp,
		ttlDays: LOG_CONFIG.TTL_DAYS,
	});

	await docClient.send(
		new PutCommand({
			TableName: CHAT_TABLE_NAME,
			Item: entity,
		}),
	);

	return {
		logId,
		pk: entity.PK,
		sk: entity.SK,
	};
}

export async function logAgentResponse(
	input: AgentResponseLogInput,
): Promise<void> {
	const { logId, pk, sk, response, metrics } = input;

	await docClient.send(
		new UpdateCommand({
			TableName: CHAT_TABLE_NAME,
			Key: {
				PK: pk,
				SK: sk,
			},
			UpdateExpression:
				"SET #response = :response, #metrics = :metrics, #status = :status, updatedAt = :updatedAt",
			ExpressionAttributeNames: {
				"#response": "response",
				"#metrics": "metrics",
				"#status": "status",
			},
			ExpressionAttributeValues: {
				":response": {
					content: truncate(
						response.content,
						LOG_CONFIG.MAX_MESSAGE_CONTENT_LENGTH,
					),
					finishReason: response.finishReason,
					toolCalls: response.toolCalls?.map((tc) => ({
						name: tc.name,
						arguments: truncate(
							tc.arguments,
							LOG_CONFIG.MAX_TOOL_RESULT_LENGTH,
						),
						result: tc.result
							? truncate(tc.result, LOG_CONFIG.MAX_TOOL_RESULT_LENGTH)
							: undefined,
					})),
				},
				":metrics": metrics,
				":status": "SUCCESS",
				":updatedAt": nowIso(),
			},
		}),
	);

	logger.debug("Agent response logged", {
		logId,
		pk,
		sk,
		finishReason: response.finishReason,
		metrics,
	});
}

export async function logAgentError(
	input: AgentErrorLogInput,
): Promise<void> {
	const { logId, pk, sk, error, metrics } = input;

	const errorTtlSeconds = Math.floor(
		(Date.now() + LOG_CONFIG.ERROR_TTL_DAYS * 24 * 60 * 60 * 1000) / 1000,
	);

	await docClient.send(
		new UpdateCommand({
			TableName: CHAT_TABLE_NAME,
			Key: {
				PK: pk,
				SK: sk,
			},
			UpdateExpression:
				"SET #error = :error, #metrics = :metrics, #status = :status, #ttl = :ttl, updatedAt = :updatedAt",
			ExpressionAttributeNames: {
				"#error": "error",
				"#metrics": "metrics",
				"#status": "status",
				"#ttl": "ttl",
			},
			ExpressionAttributeValues: {
				":error": {
					code: error.code,
					message: truncate(
						error.message,
						LOG_CONFIG.MAX_MESSAGE_CONTENT_LENGTH,
					),
					stack: error.stack
						? truncate(error.stack, LOG_CONFIG.MAX_STACK_TRACE_LENGTH)
						: undefined,
					retryCount: error.retryCount,
					guardrailTriggered: error.guardrailTriggered,
				},
				":metrics": metrics,
				":status": "ERROR",
				":ttl": errorTtlSeconds,
				":updatedAt": nowIso(),
			},
		}),
	);

	logger.error("Agent error logged", {
		logId,
		pk,
		sk,
		code: error.code,
		message: truncate(error.message, LOG_CONFIG.MAX_MESSAGE_CONTENT_LENGTH),
		metrics,
	});
}

export async function getLogsForConversation(
	conversationId: string,
	limit = 50,
): Promise<AgentLogEntity[]> {
	const result = await docClient.send(
		new QueryCommand({
			TableName: CHAT_TABLE_NAME,
			KeyConditionExpression: "PK = :pk AND begins_with(SK, :skPrefix)",
			ExpressionAttributeValues: {
				":pk": `CONV#${conversationId}`,
				":skPrefix": "LOG#",
			},
			ScanIndexForward: false,
			Limit: limit,
		}),
	);

	return (result.Items ?? []) as AgentLogEntity[];
}

