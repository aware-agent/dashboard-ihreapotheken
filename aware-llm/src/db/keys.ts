import type {
	AgentLogEntity,
	ConversationEntity,
	MessageEntity,
	SummaryEntity,
} from "./entities.js";

/**
 * Helpers for composing partition/sort keys according to the single-table design.
 */

export function userPk(userId: string): string {
	return `USER#${userId}`;
}

export function conversationSk(conversationId: string): string {
	return `CONV#${conversationId}`;
}

export function conversationPk(conversationId: string): string {
	return `CONV#${conversationId}`;
}

export function messageSk(timestampIso: string, messageId: string): string {
	return `MSG#${timestampIso}#${messageId}`;
}

export function summarySk(version: number): string {
	return `SUMMARY#${version}`;
}

export function agentLogSk(timestampIso: string, logId: string): string {
	return `LOG#${timestampIso}#${logId}`;
}

export function gsiConversationSk(createdAtIso: string): string {
	return `CONV#${createdAtIso}`;
}

export function gsiLogSk(timestampIso: string): string {
	return `LOG#${timestampIso}`;
}

export function nowIso(): string {
	return new Date().toISOString();
}

export function addTtl(days: number): number {
	const ms = days * 24 * 60 * 60 * 1000;
	return Math.floor((Date.now() + ms) / 1000);
}

/**
 * Small helpers to create strongly-typed entities.
 */

export function createConversationEntity(input: {
	conversationId: string;
	userId: string;
	title: string;
	contextType?: ConversationEntity["contextType"];
	status?: ConversationEntity["status"];
}): ConversationEntity {
	const now = nowIso();
	return {
		PK: userPk(input.userId),
		SK: conversationSk(input.conversationId),
		entityType: "CONVERSATION",
		conversationId: input.conversationId,
		userId: input.userId,
		title: input.title,
		status: input.status ?? "ACTIVE",
		messageCount: 0,
		lastMessageAt: now,
		contextType: input.contextType,
		GSI1PK: userPk(input.userId),
		GSI1SK: gsiConversationSk(now),
		createdAt: now,
		updatedAt: now,
	};
}

export function createMessageEntity(input: {
	conversationId: string;
	messageId: string;
	role: MessageEntity["role"];
	content: string;
	tokenCount: number;
	contextSnapshot?: MessageEntity["contextSnapshot"];
	modelUsed?: string;
	timestamp?: string;
}): MessageEntity {
	const createdAt = input.timestamp ?? nowIso();
	return {
		PK: conversationPk(input.conversationId),
		SK: messageSk(createdAt, input.messageId),
		entityType: "MESSAGE",
		conversationId: input.conversationId,
		messageId: input.messageId,
		role: input.role,
		content: input.content,
		tokenCount: input.tokenCount,
		contextSnapshot: input.contextSnapshot,
		modelUsed: input.modelUsed,
		summarized: false,
		createdAt,
		updatedAt: createdAt,
	};
}

export function createSummaryEntity(input: {
	conversationId: string;
	version: number;
	content: string;
	tokenCount: number;
	coversMessagesFrom: string;
	coversMessagesTo: string;
	messagesCoveredCount: number;
}): SummaryEntity {
	const now = nowIso();
	return {
		PK: conversationPk(input.conversationId),
		SK: summarySk(input.version),
		entityType: "SUMMARY",
		conversationId: input.conversationId,
		version: input.version,
		content: input.content,
		tokenCount: input.tokenCount,
		coversMessagesFrom: input.coversMessagesFrom,
		coversMessagesTo: input.coversMessagesTo,
		messagesCoveredCount: input.messagesCoveredCount,
		createdAt: now,
		updatedAt: now,
	};
}

export function createAgentLogEntity(input: {
	logId: string;
	conversationId: string;
	messageId: string;
	userId: string;
	status: AgentLogEntity["status"];
	request: AgentLogEntity["request"];
	metrics: AgentLogEntity["metrics"];
	error?: AgentLogEntity["error"];
	timestamp?: string;
	ttlDays: number;
}): AgentLogEntity {
	const createdAt = input.timestamp ?? nowIso();
	const ttl = addTtl(input.ttlDays);
	return {
		PK: conversationPk(input.conversationId),
		SK: agentLogSk(createdAt, input.logId),
		entityType: "AGENT_LOG",
		logId: input.logId,
		conversationId: input.conversationId,
		messageId: input.messageId,
		userId: input.userId,
		request: input.request,
		response: undefined,
		metrics: input.metrics,
		error: input.error,
		status: input.status,
		GSI1PK: userPk(input.userId),
		GSI1SK: gsiLogSk(createdAt),
		ttl,
		createdAt,
		updatedAt: createdAt,
	};
}

