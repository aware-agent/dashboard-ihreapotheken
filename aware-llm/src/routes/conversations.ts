import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { HTTP_STATUS } from "../lib/constants.js";
import { createRouter } from "../lib/create-app.js";
import type { ConversationSummary } from "../services/conversation-service.js";
import { createUserConversation, getUserConversation, listConversations } from "../services/conversation-service.js";
import { getMessages } from "../services/message-service.js";

const app = createRouter();

const ConversationSummarySchema = z.object({
	id: z.string(),
	title: z.string(),
	status: z.enum(["ACTIVE", "ARCHIVED"]),
	messageCount: z.number(),
	lastMessageAt: z.string(),
	contextType: z
		.enum(["healthZone", "biomarker", "general", "bioAge"])
		.optional(),
});

const ListConversationsResponseSchema = z.object({
	conversations: z.array(ConversationSummarySchema),
	nextCursor: z.string().optional(),
});

const CreateConversationRequestSchema = z.object({
	contextType: z
		.enum(["healthZone", "biomarker", "general", "bioAge"])
		.optional(),
	title: z.string().min(1).max(200).optional(),
});

const CreateConversationResponseSchema = z.object({
	id: z.string(),
	title: z.string(),
	createdAt: z.string(),
});

const MessageResponseSchema = z.object({
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

function mapSummaryToResponse(
	summary: ConversationSummary,
): z.infer<typeof ConversationSummarySchema> {
	return {
		id: summary.id,
		title: summary.title,
		status: summary.status,
		messageCount: summary.messageCount,
		lastMessageAt: summary.lastMessageAt,
		contextType: summary.contextType,
	};
}

app.get(
	"/",
	describeRoute({
		tags: ["Conversations"],
		summary: "List conversations for current user",
		description:
			"Returns a paginated list of conversations for the authenticated user.",
		responses: {
			[HTTP_STATUS.OK]: {
				description: "List of conversations",
				content: {
					"application/json": {
						schema: resolver(ListConversationsResponseSchema),
					},
				},
			},
		},
	}),
	async (c) => {
		const userId = c.req.header("x-user-id");
		if (!userId) {
			return c.json(
				{ error: "Missing x-user-id header" },
				HTTP_STATUS.UNAUTHORIZED,
			);
		}

		const cursor = c.req.query("cursor") ?? undefined;
		const limitParam = c.req.query("limit");
		const limit = limitParam ? Number.parseInt(limitParam, 10) || 20 : 20;

		const result = await listConversations(userId, {
			limit,
			cursor,
		});

		return c.json(
			{
				conversations: result.conversations.map(mapSummaryToResponse),
				nextCursor: result.nextCursor,
			},
			HTTP_STATUS.OK,
		);
	},
);

app.post(
	"/",
	describeRoute({
		tags: ["Conversations"],
		summary: "Create a new conversation",
		description:
			"Creates a new conversation for the authenticated user. Optionally sets an initial context type and custom title.",
		responses: {
			[HTTP_STATUS.OK]: {
				description: "Created conversation",
				content: {
					"application/json": {
						schema: resolver(CreateConversationResponseSchema),
					},
				},
			},
			[HTTP_STATUS.BAD_REQUEST]: { description: "Invalid request" },
		},
	}),
	async (c) => {
		const userId = c.req.header("x-user-id");
		if (!userId) {
			return c.json(
				{ error: "Missing x-user-id header" },
				HTTP_STATUS.UNAUTHORIZED,
			);
		}

		const body = await c.req.json().catch(() => null);
		const parsed = CreateConversationRequestSchema.safeParse(body);
		if (!parsed.success) {
			return c.json(
				{ error: "Invalid request body" },
				HTTP_STATUS.BAD_REQUEST,
			);
		}

		const created = await createUserConversation({
			userId,
			contextType: parsed.data.contextType,
			title: parsed.data.title,
		});

		return c.json(
			{
				id: created.id,
				title: created.title,
				createdAt: created.lastMessageAt,
			},
			HTTP_STATUS.OK,
		);
	},
);

/**
 * GET /:conversationId/messages - Get messages for a conversation (user must own the conversation)
 */
app.get(
	"/:conversationId/messages",
	describeRoute({
		tags: ["Conversations"],
		summary: "Get messages for a conversation",
		description:
			"Returns messages for the given conversation. Requires x-user-id header; conversation must belong to that user.",
		responses: {
			[HTTP_STATUS.OK]: {
				description: "List of messages (oldest first)",
				content: {
					"application/json": {
						schema: resolver(z.array(MessageResponseSchema)),
					},
				},
			},
			[HTTP_STATUS.UNAUTHORIZED]: { description: "Missing x-user-id" },
			[HTTP_STATUS.NOT_FOUND]: { description: "Conversation not found or not owned by user" },
		},
	}),
	async (c) => {
		const userId = c.req.header("x-user-id");
		if (!userId) {
			return c.json(
				{ error: "Missing x-user-id header" },
				HTTP_STATUS.UNAUTHORIZED,
			);
		}

		const conversationId = c.req.param("conversationId");
		const limitParam = c.req.query("limit");
		const limit = limitParam ? Number.parseInt(limitParam, 10) || 100 : 100;
		if (Number.isNaN(limit) || limit < 1 || limit > 500) {
			return c.json(
				{ error: "Limit must be between 1 and 500" },
				HTTP_STATUS.BAD_REQUEST,
			);
		}

		const conversation = await getUserConversation({ userId, conversationId });
		if (!conversation) {
			return c.json(
				{ error: "Conversation not found" },
				HTTP_STATUS.NOT_FOUND,
			);
		}

		const messages = await getMessages(conversationId, { limit });
		return c.json(messages, HTTP_STATUS.OK);
	},
);

export default app;

