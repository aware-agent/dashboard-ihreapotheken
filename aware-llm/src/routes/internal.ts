import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { HTTP_STATUS } from "../lib/constants.js";
import { createRouter } from "../lib/create-app.js";
import { getLogsForConversation } from "../services/agent-log-service.js";
import { getUserConversation } from "../services/conversation-service.js";
import { getMessages } from "../services/message-service.js";

const app = createRouter();

const AgentLogSchema = z.object({
	logId: z.string(),
	conversationId: z.string(),
	messageId: z.string(),
	userId: z.string(),
	status: z.enum([
		"SUCCESS",
		"ERROR",
		"GUARDRAIL_BLOCKED",
		"TIMEOUT",
		"RATE_LIMITED",
		"PENDING",
	]),
	request: z.object({
		model: z.string(),
		messages: z.array(
			z.object({
				role: z.string(),
				content: z.string(),
			}),
		),
		tools: z.array(z.string()).optional(),
		temperature: z.number().optional(),
		maxTokens: z.number().optional(),
	}),
	response: z
		.object({
			content: z.string(),
			finishReason: z.string(),
			toolCalls: z
				.array(
					z.object({
						name: z.string(),
						arguments: z.string(),
						result: z.string().optional(),
					}),
				)
				.optional(),
		})
		.optional(),
	error: z
		.object({
			code: z.string(),
			message: z.string(),
			stack: z.string().optional(),
			retryCount: z.number(),
			guardrailTriggered: z.string().optional(),
		})
		.optional(),
	metrics: z.object({
		promptTokens: z.number(),
		completionTokens: z.number(),
		totalTokens: z.number(),
		latencyMs: z.number(),
		agentTurns: z.number(),
	}),
	timestamp: z.string(),
	createdAt: z.string(),
	updatedAt: z.string(),
});

const ConversationDetailSchema = z.object({
	id: z.string(),
	title: z.string(),
	status: z.enum(["ACTIVE", "ARCHIVED"]),
	messageCount: z.number(),
	lastMessageAt: z.string(),
	contextType: z
		.enum(["healthZone", "biomarker", "general", "bioAge"])
		.optional(),
});

const MessageSchema = z.object({
	id: z.string(),
	conversationId: z.string(),
	role: z.enum(["user", "assistant", "system"]),
	content: z.string(),
	timestamp: z.string(),
	contextSnapshot: z
		.object({
			type: z.string(),
			name: z.string().optional(),
		})
		.optional(),
	summarized: z.boolean(),
});

/**
 * GET /internal/logs/:conversationId - Get agent logs for a conversation
 */
app.get(
	"/logs/:conversationId",
	describeRoute({
		tags: ["Internal"],
		summary: "Get agent logs for a conversation",
		description:
			"Retrieves agent request/response logs for debugging. Protected by Basic Auth.",
		responses: {
			[HTTP_STATUS.OK]: {
				description: "List of agent logs",
				content: {
					"application/json": {
						schema: resolver(z.array(AgentLogSchema)),
					},
				},
			},
			[HTTP_STATUS.NOT_FOUND]: {
				description: "Conversation not found",
			},
		},
	}),
	async (c) => {
		const conversationId = c.req.param("conversationId");
		const limitParam = c.req.query("limit");
		const limit = limitParam ? Number.parseInt(limitParam, 10) : 50;

		if (Number.isNaN(limit) || limit < 1 || limit > 100) {
			return c.json(
				{ error: "Limit must be between 1 and 100" },
				HTTP_STATUS.BAD_REQUEST,
			);
		}

		const logs = await getLogsForConversation(conversationId, limit);
		return c.json(logs, HTTP_STATUS.OK);
	},
);

/**
 * GET /internal/conversation/:conversationId - Get conversation details
 */
app.get(
	"/conversation/:conversationId",
	describeRoute({
		tags: ["Internal"],
		summary: "Get conversation details",
		description:
			"Retrieves conversation metadata. Protected by Basic Auth.",
		responses: {
			[HTTP_STATUS.OK]: {
				description: "Conversation details",
				content: {
					"application/json": {
						schema: resolver(ConversationDetailSchema),
					},
				},
			},
			[HTTP_STATUS.NOT_FOUND]: {
				description: "Conversation not found",
			},
		},
	}),
	async (c) => {
		const conversationId = c.req.param("conversationId");
		const userId = c.req.query("userId");

		if (!userId) {
			return c.json(
				{ error: "userId query parameter is required" },
				HTTP_STATUS.BAD_REQUEST,
			);
		}

		const conversation = await getUserConversation({
			userId,
			conversationId,
		});

		if (!conversation) {
			return c.json(
				{ error: "Conversation not found" },
				HTTP_STATUS.NOT_FOUND,
			);
		}

		return c.json(conversation, HTTP_STATUS.OK);
	},
);

/**
 * GET /internal/conversation/:conversationId/messages - Get messages for a conversation
 */
app.get(
	"/conversation/:conversationId/messages",
	describeRoute({
		tags: ["Internal"],
		summary: "Get messages for a conversation",
		description:
			"Retrieves all messages in a conversation. Protected by Basic Auth.",
		responses: {
			[HTTP_STATUS.OK]: {
				description: "List of messages",
				content: {
					"application/json": {
						schema: resolver(z.array(MessageSchema)),
					},
				},
			},
		},
	}),
	async (c) => {
		const conversationId = c.req.param("conversationId");
		const limitParam = c.req.query("limit");
		const limit = limitParam ? Number.parseInt(limitParam, 10) : 100;

		if (Number.isNaN(limit) || limit < 1 || limit > 500) {
			return c.json(
				{ error: "Limit must be between 1 and 500" },
				HTTP_STATUS.BAD_REQUEST,
			);
		}

		const messages = await getMessages(conversationId, { limit });
		return c.json(messages, HTTP_STATUS.OK);
	},
);

export default app;
