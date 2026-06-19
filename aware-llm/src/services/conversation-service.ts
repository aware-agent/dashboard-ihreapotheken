import { randomUUID } from "node:crypto";
import { PutCommand, QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { OpenAI } from "openai";
import { CHAT_TABLE_NAME, getDocumentClient } from "../db/dynamodb-client.js";
import type { ConversationEntity } from "../db/entities.js";
import {
	conversationSk,
	createConversationEntity,
	gsiConversationSk,
	nowIso,
	userPk,
} from "../db/keys.js";
import { env } from "../env/index.js";
import { logger } from "../utils/logger.js";

const docClient = getDocumentClient();

/**
 * Conversation storage interface for OpenAI Conversations API
 * (legacy, in-memory; kept for backwards compatibility).
 *
 * Conversation storage interface
 * Maps user sessions to OpenAI conversation IDs
 */
interface ConversationEntry {
	conversationId: string;
	createdAt: number;
	lastUsedAt: number;
}

/**
 * In-memory conversation store
 * For production, replace with Redis or database
 */
const conversationStore = new Map<string, ConversationEntry>();

/**
 * Conversation expiry time (24 hours in milliseconds)
 */
const CONVERSATION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * OpenAI client instance for conversation management
 */
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
	if (!openaiClient) {
		openaiClient = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
			baseURL: env.OPENAI_BASE_URL,
		});
	}
	return openaiClient;
}

/**
 * Create a new server-managed conversation
 */
export async function createConversation(userId: string): Promise<string> {
	try {
		const client = getOpenAIClient();
		const conversation = await client.conversations.create({});

		const entry: ConversationEntry = {
			conversationId: conversation.id,
			createdAt: Date.now(),
			lastUsedAt: Date.now(),
		};

		conversationStore.set(userId, entry);

		logger.debug("Created new conversation", {
			userId,
			conversationId: conversation.id,
		});

		return conversation.id;
	} catch (error) {
		logger.error("Failed to create conversation", { userId, error });
		throw error;
	}
}

/**
 * Get existing conversation ID for a user
 */
export function getConversationId(userId: string): string | null {
	const entry = conversationStore.get(userId);

	if (!entry) {
		return null;
	}

	// Check if conversation has expired
	if (Date.now() - entry.lastUsedAt > CONVERSATION_TTL_MS) {
		conversationStore.delete(userId);
		return null;
	}

	// Update last used time
	entry.lastUsedAt = Date.now();
	conversationStore.set(userId, entry);

	return entry.conversationId;
}

/**
 * Get or create a conversation for a user
 */
export async function getOrCreateConversation(userId: string): Promise<string> {
	const existingId = getConversationId(userId);
	if (existingId) {
		return existingId;
	}
	return createConversation(userId);
}

/**
 * Clear a user's conversation
 */
export function clearConversation(userId: string): void {
	conversationStore.delete(userId);
	logger.debug("Cleared conversation", { userId });
}

/**
 * Cleanup expired conversations
 * Call periodically to prevent memory leaks
 */
export function cleanupExpiredConversations(): number {
	const now = Date.now();
	let cleanedCount = 0;

	for (const [userId, entry] of conversationStore.entries()) {
		if (now - entry.lastUsedAt > CONVERSATION_TTL_MS) {
			conversationStore.delete(userId);
			cleanedCount++;
		}
	}

	if (cleanedCount > 0) {
		logger.info("Cleaned up expired conversations", { count: cleanedCount });
	}

	return cleanedCount;
}

/**
 * Response ID storage for simpler chaining
 * Maps user sessions to their last response ID
 */
const responseIdStore = new Map<
	string,
	{ responseId: string; timestamp: number }
>();

/**
 * Store the last response ID for a user
 */
export function storeLastResponseId(userId: string, responseId: string): void {
	responseIdStore.set(userId, {
		responseId,
		timestamp: Date.now(),
	});
}

/**
 * Get the last response ID for a user
 */
export function getLastResponseId(userId: string): string | null {
	const entry = responseIdStore.get(userId);

	if (!entry) {
		return null;
	}

	// Expire after 1 hour for response ID chaining
	if (Date.now() - entry.timestamp > 60 * 60 * 1000) {
		responseIdStore.delete(userId);
		return null;
	}

	return entry.responseId;
}

/**
 * Clear the last response ID for a user
 */
export function clearLastResponseId(userId: string): void {
	responseIdStore.delete(userId);
}

// ---------------------------------------------------------------------------
// Persistent conversation storage
// ---------------------------------------------------------------------------

export interface ConversationSummary {
	id: string;
	title: string;
	status: ConversationEntity["status"];
	messageCount: number;
	lastMessageAt: string;
	contextType?: ConversationEntity["contextType"];
}

export interface ListConversationsResult {
	conversations: ConversationSummary[];
	nextCursor?: string;
}

/**
 * Create a new logical conversation for a user in DynamoDB.
 */
export async function createUserConversation(input: {
	userId: string;
	contextType?: ConversationEntity["contextType"];
	title?: string;
	conversationId?: string;
}): Promise<ConversationSummary> {
	const conversationId = input.conversationId || randomUUID();
	const title =
		input.title && input.title.trim().length > 0
			? input.title.trim()
			: "New conversation";

	const entity = createConversationEntity({
		conversationId,
		userId: input.userId,
		title,
		contextType: input.contextType,
	});

	await docClient.send(
		new PutCommand({
			TableName: CHAT_TABLE_NAME,
			Item: entity,
		}),
	);

	logger.debug("Created user conversation", {
		userId: input.userId,
		conversationId,
		contextType: input.contextType,
	});

	return {
		id: conversationId,
		title,
		status: entity.status,
		messageCount: entity.messageCount,
		lastMessageAt: entity.lastMessageAt,
		contextType: entity.contextType,
	};
}

export async function getUserConversation(input: {
	userId: string;
	conversationId: string;
}): Promise<ConversationSummary | null> {
	const result = await docClient.send(
		new QueryCommand({
			TableName: CHAT_TABLE_NAME,
			KeyConditionExpression: "PK = :pk AND SK = :sk",
			ExpressionAttributeValues: {
				":pk": userPk(input.userId),
				":sk": conversationSk(input.conversationId),
			},
			Limit: 1,
		}),
	);

	const item = (result.Items?.[0] as ConversationEntity | undefined) ?? null;
	if (!item) return null;

	return {
		id: item.conversationId,
		title: item.title,
		status: item.status,
		messageCount: item.messageCount,
		lastMessageAt: item.lastMessageAt,
		contextType: item.contextType,
	};
}

export interface ListConversationsOptions {
	limit?: number;
	cursor?: string;
}

export async function listConversations(
	userId: string,
	options: ListConversationsOptions = {},
): Promise<ListConversationsResult> {
	const limit = options.limit ?? 20;

	const params: QueryCommand["input"] = {
		TableName: CHAT_TABLE_NAME,
		IndexName: "GSI1",
		KeyConditionExpression: "GSI1PK = :gsiPk AND begins_with(GSI1SK, :skPrefix)",
		ExpressionAttributeValues: {
			":gsiPk": userPk(userId),
			":skPrefix": "CONV#",
		},
		ScanIndexForward: false, // newest first
		Limit: limit,
	};

	if (options.cursor) {
		// Cursor is the GSI1SK of the last evaluated item
		params.ExclusiveStartKey = {
			GSI1PK: userPk(userId),
			GSI1SK: options.cursor,
			PK: userPk(userId),
			SK: conversationSk(options.cursor.replace("CONV#", "")),
		};
	}

	const result = await docClient.send(new QueryCommand(params));
	const items = (result.Items ?? []) as ConversationEntity[];

	const conversations: ConversationSummary[] = items.map((item) => ({
		id: item.conversationId,
		title: item.title,
		status: item.status,
		messageCount: item.messageCount,
		lastMessageAt: item.lastMessageAt,
		contextType: item.contextType,
	}));

	const last = items[items.length - 1];
	const nextCursor = last ? last.GSI1SK : undefined;

	return { conversations, nextCursor };
}

export async function archiveConversationForUser(input: {
	userId: string;
	conversationId: string;
}): Promise<void> {
	const now = nowIso();
	await docClient.send(
		new UpdateCommand({
			TableName: CHAT_TABLE_NAME,
			Key: {
				PK: userPk(input.userId),
				SK: conversationSk(input.conversationId),
			},
			UpdateExpression:
				"SET #status = :status, updatedAt = :updatedAt, GSI1SK = :gsi1sk",
			ExpressionAttributeNames: {
				"#status": "status",
			},
			ExpressionAttributeValues: {
				":status": "ARCHIVED",
				":updatedAt": now,
				":gsi1sk": gsiConversationSk(now),
			},
		}),
	);

	logger.debug("Archived conversation", {
		userId: input.userId,
		conversationId: input.conversationId,
	});
}

/**
 * Update conversation metadata when a new message is appended.
 * This is kept separate so the message service can remain focused on message items.
 */
export async function touchConversationOnNewMessage(input: {
	userId: string;
	conversationId: string;
}): Promise<void> {
	const now = nowIso();
	await docClient.send(
		new UpdateCommand({
			TableName: CHAT_TABLE_NAME,
			Key: {
				PK: userPk(input.userId),
				SK: conversationSk(input.conversationId),
			},
			UpdateExpression:
				"SET messageCount = if_not_exists(messageCount, :zero) + :inc, lastMessageAt = :lastMessageAt, updatedAt = :updatedAt, GSI1SK = :gsi1sk",
			ExpressionAttributeValues: {
				":zero": 0,
				":inc": 1,
				":lastMessageAt": now,
				":updatedAt": now,
				":gsi1sk": gsiConversationSk(now),
			},
		}),
	);
}

/**
 * Update the title of a conversation (e.g. after agent-generated title).
 */
export async function updateConversationTitle(input: {
	userId: string;
	conversationId: string;
	title: string;
}): Promise<void> {
	const title = input.title.trim();
	if (title.length === 0) return;

	const now = nowIso();
	await docClient.send(
		new UpdateCommand({
			TableName: CHAT_TABLE_NAME,
			Key: {
				PK: userPk(input.userId),
				SK: conversationSk(input.conversationId),
			},
			UpdateExpression: "SET #title = :title, updatedAt = :updatedAt",
			ExpressionAttributeNames: { "#title": "title" },
			ExpressionAttributeValues: {
				":title": title,
				":updatedAt": now,
			},
		}),
	);

	logger.debug("Updated conversation title", {
		userId: input.userId,
		conversationId: input.conversationId,
		title,
	});
}

const DEFAULT_CONVERSATION_TITLE = "New conversation";

/**
 * Generate a short conversation title using the LLM from the first user message
 * and optionally the start of the assistant reply.
 */
export async function generateConversationTitle(input: {
	userMessage: string;
	assistantPreview?: string;
}): Promise<string> {
	const { userMessage, assistantPreview } = input;
	const client = getOpenAIClient();

	const userContent =
		assistantPreview != null && assistantPreview.length > 0
			? `User message: ${userMessage}\n\nAssistant reply (start): ${assistantPreview.slice(0, 300)}`
			: `User message: ${userMessage}`;

	logger.debug("Generating title with input", {
		userMessageLength: userMessage.length,
		assistantPreviewLength: assistantPreview?.length,
		model: env.OPENAI_MODEL,
	});

	try {
		const isReasoningModel = env.OPENAI_MODEL.includes("gpt-5") || env.OPENAI_MODEL.includes("o1") || env.OPENAI_MODEL.includes("o3");
		
		const instructions = "You are a helpful assistant that generates short, descriptive titles for a health conversation. Use the user message and assistant reply provided. Be very brief (under 6 words). Return ONLY the title text, no quotes, no punctuation.";
		const combinedContent = `${instructions}\n\n${userContent}`;

		const response = await client.chat.completions.create({
			model: env.OPENAI_MODEL,
			messages: [
				{
					role: isReasoningModel ? "user" : "system",
					content: isReasoningModel ? combinedContent : instructions,
				},
				...(isReasoningModel ? [] : [{ role: "user" as const, content: userContent }]),
			],
			// Use max_completion_tokens for reasoning models, max_tokens for others
			// IMPORTANT: Reasoning models like gpt-5-mini use completion_tokens for internal reasoning.
			// Set a high enough limit to allow for both reasoning and the final output.
			...(isReasoningModel 
				? { max_completion_tokens: 500 } 
				: { max_tokens: 100 }),
		});

		const raw = response.choices?.[0]?.message?.content?.trim() ?? "";
		const title = raw.replace(/^["']|["']$/g, "").slice(0, 80).trim();

		logger.debug("OpenAI Title generation result", {
			raw,
			final: title || DEFAULT_CONVERSATION_TITLE,
		});

		return title || DEFAULT_CONVERSATION_TITLE;
	} catch (error) {
		logger.error("OpenAI title generation failed", {
			error: error instanceof Error ? error.message : String(error),
		});
		return DEFAULT_CONVERSATION_TITLE;
	}
}