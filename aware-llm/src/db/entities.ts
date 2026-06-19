export type EntityType = "CONVERSATION" | "MESSAGE" | "SUMMARY" | "AGENT_LOG";

/**
 * Base shape for all items stored in the chat DynamoDB table.
 * PK/SK enforce the single-table design; `entityType` is used as a discriminator.
 */
export interface BaseEntity {
	PK: string;
	SK: string;
	entityType: EntityType;
	createdAt: string; // ISO timestamp
	updatedAt: string; // ISO timestamp
}

export type ConversationStatus = "ACTIVE" | "ARCHIVED";

export interface ConversationEntity extends BaseEntity {
	entityType: "CONVERSATION";
	conversationId: string;
	userId: string;
	title: string;
	status: ConversationStatus;
	messageCount: number;
	lastMessageAt: string;
	contextType?: "healthZone" | "biomarker" | "general" | "bioAge";
	GSI1PK: string;
	GSI1SK: string;
	ttl?: number;
}

export type MessageRole = "user" | "assistant" | "system";

export interface MessageEntity extends BaseEntity {
	entityType: "MESSAGE";
	messageId: string;
	conversationId: string;
	role: MessageRole;
	content: string;
	tokenCount: number;
	contextSnapshot?: {
		type: string;
		name?: string;
	};
	modelUsed?: string;
	summarized: boolean;
}

export interface SummaryEntity extends BaseEntity {
	entityType: "SUMMARY";
	conversationId: string;
	version: number;
	content: string;
	tokenCount: number;
	coversMessagesFrom: string;
	coversMessagesTo: string;
	messagesCoveredCount: number;
}

export type AgentLogStatus =
	| "SUCCESS"
	| "ERROR"
	| "GUARDRAIL_BLOCKED"
	| "TIMEOUT"
	| "RATE_LIMITED"
	| "PENDING";

export interface AgentLogEntity extends BaseEntity {
	entityType: "AGENT_LOG";
	logId: string;
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
	response?: {
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
	error?: {
		code: string;
		message: string;
		stack?: string;
		retryCount: number;
		guardrailTriggered?: string;
	};
	status: AgentLogStatus;
	GSI1PK: string;
	GSI1SK: string;
	ttl: number;
}

