import { withTrace } from "@openai/agents";
import type { AgentInputItem } from "@openai/agents-core";
import { streamSSE } from "hono/streaming";
import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import {
	createContextAwareAgent,
	enhanceMessageWithContext,
} from "../agents/aware-health-agent.js";
import {
	type RunnerRunInput,
	type RunnerRunOptions,
	runAgent,
} from "../agents/runner.js";
import type { AgentContext } from "../agents/types.js";
import { type ChatMessage, ChatRequestSchema } from "../agents/types.js";
import {
	createTraceMetadata,
	createWorkflowName,
	tracingConfig,
} from "../config/tracing.js";
import { env } from "../env/index.js";
import { HTTP_STATUS } from "../lib/constants.js";
import { createRouter } from "../lib/create-app.js";
import {
	createUserConversation,
	generateConversationTitle,
	getUserConversation,
	storeLastResponseId,
	touchConversationOnNewMessage,
	updateConversationTitle,
} from "../services/conversation-service.js";
import { appendMessage } from "../services/message-service.js";
import {
	formatErrorForSSE,
	handleAgentError,
} from "../utils/agent-error-handler.js";
import { logger } from "../utils/logger.js";
import {
	shouldIncludeMedicalDisclaimer,
	stripNonEssentialDisclaimers,
} from "../utils/medical-disclaimer.js";
import { classifyQueryScope } from "../utils/scope-classifier.js";
import {
	normalizeAssistantText,
	stripFollowUpStructure,
} from "../utils/text-normalization.js";
import { getUserIdFromToken } from "../utils/user-id.js";

const app = createRouter();

const AGENT_MAX_TURNS = env.AGENT_MAX_TURNS ?? (env.USE_NESTED_AGENTS ? 5 : 2);

const STREAM_SUPPRESS_PATTERNS: RegExp[] = [
	/\bwhen to talk to (a|your) medical professional\b/i,
	/\bwhen to see (a|your) medical professional\b/i,
	/\bwhen to talk to (a|your) clinician\b/i,
	/\bwhen to see (a|your) clinician\b/i,
	/\bwhen to talk to (a|your) doctor\b/i,
	/\bwhen to see (a|your) doctor\b/i,
];

function findSuppressStartIndex(text: string): number | null {
	for (const pattern of STREAM_SUPPRESS_PATTERNS) {
		const match = pattern.exec(text);
		if (match?.index !== undefined) return match.index;
	}
	return null;
}

type ParsedRequest = z.infer<typeof ExtendedChatRequestSchema>;

function validateChatRequest(body: unknown): ParsedRequest {
	const parsed = ExtendedChatRequestSchema.safeParse(body);
	if (!parsed.success) {
		throw new Error(`Invalid request: ${JSON.stringify(parsed.error.format())}`);
	}
	return parsed.data;
}

function validateAccessToken(userProfile?: { accessToken?: string }): void {
	if (!userProfile?.accessToken || userProfile.accessToken.length < 10) {
		throw new Error("Invalid or missing access token");
	}
}

function buildMessages(
	conversationHistory?: Array<{ role: "user" | "assistant"; content: string }>,
	enhancedMessage?: string,
	previousResponseId?: string,
): AgentInputItem[] {
	const messages: AgentInputItem[] = [];


	if (conversationHistory && !previousResponseId) {
		for (const msg of conversationHistory) {
			let content: string;
			if (typeof msg.content === "string") {
				content = msg.content;
			} else if (Array.isArray(msg.content)) {
				content = (msg.content as unknown[])
					.map((item: unknown) => (typeof item === "string" ? item : JSON.stringify(item)))
					.join(" ");
			} else {
				content = String(msg.content);
			}

			if (msg.role === "assistant") {
				// The Responses API expects assistant message content as structured output parts.
				messages.push({
					type: "message",
					role: "assistant",
					status: "completed",
					content: [{ type: "output_text", text: content }],
				});
			} else {
				// User messages can be plain strings.
				messages.push({ type: "message", role: "user", content });
			}
		}
	}

	if (enhancedMessage) {
		messages.push({ type: "message", role: "user", content: enhancedMessage });
	}

	return messages;
}

function createAgentForContext(
	context?: { type?: "healthZone" | "biomarker" | "general" | "bioAge" },
	hasContextData?: boolean,
	responseMode?: "first_turn" | "follow_up",
) {
	// Always prefer context-aware agent so we can adapt instructions for follow-ups.
	// If nested agents are enabled, createContextAwareAgent will return the shared main agent.
	return createContextAwareAgent(context?.type, hasContextData, responseMode);
}

function buildRunOptions(
	userProfile: { accessToken: string; age?: number; sex?: "MALE" | "FEMALE" | "OTHER" },
	previousResponseId?: string,
	stream?: boolean,
): RunnerRunOptions {

	return {
		...(stream && { stream: true as const }),
		context: {
			accessToken: userProfile.accessToken,
			userAge: userProfile.age,
			userSex: userProfile.sex,
		} satisfies AgentContext,
		maxTurns: AGENT_MAX_TURNS,
		tracing: tracingConfig,
		...(previousResponseId && { previousResponseId }),
	} as RunnerRunOptions;
}

/** Persistence: use the given conversation if valid, otherwise create a new one (new chat). */
async function getOrCreateActiveConversation(
	userId: string,
	existingConversationId?: string,
): Promise<{ id: string }> {
	if (existingConversationId) {
		const existing = await getUserConversation({
			userId,
			conversationId: existingConversationId,
		});
		if (existing && existing.status === "ACTIVE") {
			logger.debug("Using existing conversation", {
				userId,
				conversationId: existing.id,
			});
			return { id: existing.id };
		}
		// Conversation doesn't exist yet - create it with the provided ID (from frontend)
		logger.debug("Creating new conversation with provided ID", {
			userId,
			providedConversationId: existingConversationId,
		});
		const created = await createUserConversation({
			userId,
			conversationId: existingConversationId,
		});
		logger.debug("Created conversation with provided ID", {
			userId,
			requestedId: existingConversationId,
			createdId: created.id,
		});
		return { id: created.id };
	}
	// No conversation id provided - create a new one with backend-generated ID
	logger.debug("Creating new conversation without provided ID", {
		userId,
	});
	const created = await createUserConversation({
		userId,
		conversationId: undefined,
	});
	return { id: created.id };
}

/**
 * Response schema for non-streaming chat
 */
const ChatResponseSchema = z.object({
	message: z.object({
		role: z.literal("assistant"),
		content: z.string(),
		timestamp: z.string(),
		context: z
			.object({
				type: z.enum(["healthZone", "biomarker", "general", "bioAge"]),
				name: z.string().optional(),
			})
			.optional(),
	}),
	lastResponseId: z.string().optional(),
});

/**
 * Extended request schema with conversation persistence options
 */
const ExtendedChatRequestSchema = ChatRequestSchema.extend({
	conversationId: z.string().optional(),
	previousResponseId: z.string().optional(),
	sessionId: z.string().optional(),
});

/**
 * POST /chat - Non-streaming chat endpoint
 */
app.post(
	"/",
	describeRoute({
		tags: ["Chat"],
		summary: "Send a chat message",
		description:
			"Send a message to the Aware Health Companion and receive a response",
		responses: {
			[HTTP_STATUS.OK]: {
				description: "Chat response",
				content: {
					"application/json": {
						schema: resolver(ChatResponseSchema),
					},
				},
			},
			[HTTP_STATUS.BAD_REQUEST]: {
				description: "Invalid request",
			},
		},
	}),
	async (c) => {
		try {
			const body = await c.req.json();
			let parsedData: ParsedRequest;

			try {
				parsedData = validateChatRequest(body);
			} catch (error) {
				return c.json(
					{ error: error instanceof Error ? error.message : "Invalid request" },
					HTTP_STATUS.BAD_REQUEST,
				);
			}

			const {
				message,
				context,
				conversationHistory,
				userProfile,
				conversationId,
				previousResponseId,
				sessionId,
			} = parsedData;

			const hasContextData = !!context?.data;

			// Detect follow-up: if there's any prior assistant message in history, it's a follow-up

			const hasAssistantHistory =
				conversationHistory?.some((msg) => msg.role === "assistant") ?? false;
			const isFollowUp = !!previousResponseId || hasAssistantHistory;
			const responseMode: "first_turn" | "follow_up" = isFollowUp
				? "follow_up"
				: "first_turn";
			const keepDisclaimer = shouldIncludeMedicalDisclaimer(message);

			logger.debug("Conversation mode detection (non-streaming)", {
				isFollowUp,
				responseMode,
				hasConversationId: !!conversationId,
				hasPreviousResponseId: !!previousResponseId,
				historyLength: conversationHistory?.length ?? 0,
				hasAssistantHistory,
			});

			// Early scope check – short-circuit clearly non-medical questions
			const scope = classifyQueryScope(message);
			if (scope === "non_medical") {
				logger.debug("Non-medical query detected, returning scope reminder", {
					messagePreview: message.slice(0, 80),
				});

				const response: ChatMessage = {
					role: "assistant",
					content:
						"I’m here to help you understand your lab results and biomarkers in this app. I can’t answer that kind of question, but I’m happy to explain any of your results or help you prepare questions for your medical professional.",
					timestamp: new Date().toISOString(),
					context: undefined,
				};

				return c.json(
					{
						message: response,
					},
					HTTP_STATUS.OK,
				);
			}

			try {
				validateAccessToken(userProfile);
			} catch (error) {
				logger.error("Invalid or missing access token in request");
				return c.json(
					{ error: error instanceof Error ? error.message : "Invalid or missing access token" },
					HTTP_STATUS.UNAUTHORIZED,
				);
			}

			logger.debug("Processing chat request", {
				hasContext: !!context,
				contextType: context?.type,
				tokenPrefix: `${userProfile.accessToken.substring(0, 20)}...`,
			});

			// On follow-ups, do not re-inject large context.data; rely on conversationHistory.
			const contextForPrompt =
				responseMode === "follow_up" && context
					? { ...context, data: undefined }
					: context;

			const enhancedMessage = enhanceMessageWithContext(message, contextForPrompt, {
				age: userProfile.age,
				sex: userProfile.sex,
			});

			const messages = buildMessages(
				conversationHistory,
				enhancedMessage,
				previousResponseId,
			);

			let persistenceConv: { id: string } | null = null;
			if (env.USE_PERSISTENT_STORAGE) {
				try {
					const userId = getUserIdFromToken(userProfile.accessToken);
					persistenceConv = await getOrCreateActiveConversation(
						userId,
						conversationId,
					);
					await appendMessage({
						conversationId: persistenceConv.id,
						role: "user",
						content: message,
						contextSnapshot: context
							? { type: context.type, name: context.name }
							: undefined,
					});
					await touchConversationOnNewMessage({
						userId,
						conversationId: persistenceConv.id,
					});
				} catch (persistErr) {
					logger.warn("Failed to persist user message", {
						error: persistErr instanceof Error ? persistErr.message : String(persistErr),
					});
					persistenceConv = null;
				}
			}

			try {
				// For follow-ups we want short, direct answers and we do NOT want extra tool calls.
				// Disabling tools for follow-ups also prevents accidental multi-turn loops.
				const hasContextDataForAgent =
					responseMode === "follow_up" ? true : hasContextData;

				const agent = createAgentForContext(
					context,
					hasContextDataForAgent,
					responseMode,
				);
				const runOptions = buildRunOptions(
					userProfile,
					previousResponseId,
					false,
				);

				let result: Awaited<ReturnType<typeof runAgent>>;

				try {
					result = await withTrace(
						createWorkflowName("aware-companion-chat", context?.type),
						async () => runAgent(agent, messages, runOptions),
						{
							metadata: createTraceMetadata({
								contextType: context?.type,
								hasUserProfile: !!(userProfile.age || userProfile.sex),
							}),
						},
					);
				} catch (error) {
					const errorResponse = handleAgentError(error);

					// Automatic retry for guardrail-related errors when we have saved state.
					if (errorResponse.shouldRetry && errorResponse.state) {
						try {
							const retryResult = await withTrace(
								createWorkflowName(
									"aware-companion-chat-retry",
									context?.type,
								),
								async () =>
									runAgent(
										agent,
										errorResponse.state as RunnerRunInput,
									),
								{
									metadata: createTraceMetadata({
										contextType: context?.type,
										hasUserProfile: !!(
											userProfile.age || userProfile.sex
										),
									}),
								},
							);

							if (sessionId && retryResult.lastResponseId) {
								storeLastResponseId(
									sessionId,
									retryResult.lastResponseId,
								);
							}

							const retryChatResponse: ChatMessage = {
								role: "assistant",
								content: normalizeAssistantText(
									retryResult.finalOutput ||
										"I apologize, but I couldn't generate a response. Please try again.",
								),
								timestamp: new Date().toISOString(),
								context: context
									? { type: context.type, name: context.name }
									: undefined,
							};

							if (persistenceConv) {
								try {
									await appendMessage({
										conversationId: persistenceConv.id,
										role: "assistant",
										content: retryChatResponse.content,
									});
								} catch (e) {
									logger.warn("Failed to persist assistant message (retry)", {
										error: e instanceof Error ? e.message : String(e),
									});
								}
							}

							return c.json(
								{
									message: retryChatResponse,
									lastResponseId: retryResult.lastResponseId,
								},
								HTTP_STATUS.OK,
							);
						} catch (retryError) {
							const retryErrorResponse =
								handleAgentError(retryError);

							const fallbackResponse: ChatMessage = {
								role: "assistant",
								content:
									retryErrorResponse.userFriendlyMessage,
								timestamp: new Date().toISOString(),
								context: context
									? {
											type: context.type,
											name: context.name,
									  }
									: undefined,
							};

							return c.json(
								{ message: fallbackResponse },
								retryErrorResponse.statusCode as
									200 | 400 | 500 | 502,
							);
						}
					}

					const response: ChatMessage = {
						role: "assistant",
						content: errorResponse.userFriendlyMessage,
						timestamp: new Date().toISOString(),
						context: context
							? { type: context.type, name: context.name }
							: undefined,
					};

					return c.json(
						{ message: response },
						errorResponse.statusCode as 200 | 400 | 500 | 502,
					);
				}

				if (sessionId && result.lastResponseId) {
					storeLastResponseId(sessionId, result.lastResponseId);
				}

				const response: ChatMessage = {
					role: "assistant",
					content: (() => {
						const normalized = normalizeAssistantText(
							result.finalOutput ||
								"I apologize, but I couldn't generate a response. Please try again.",
						);
						const stripped = keepDisclaimer
							? normalized
							: stripNonEssentialDisclaimers(normalized);
						return responseMode === "follow_up"
							? stripFollowUpStructure(stripped)
							: stripped;
					})(),
					timestamp: new Date().toISOString(),
					context: context
						? { type: context.type, name: context.name }
						: undefined,
				};

				if (persistenceConv) {
					try {
						await appendMessage({
							conversationId: persistenceConv.id,
							role: "assistant",
							content: response.content,
						});
					} catch (e) {
						logger.warn("Failed to persist assistant message", {
							error: e instanceof Error ? e.message : String(e),
						});
					}
					// Fire-and-forget: generate conversation title if still default
					const userIdForTitle = getUserIdFromToken(userProfile.accessToken);
					const convIdForTitle = persistenceConv.id;
					void (async () => {
						try {
							const conv = await getUserConversation({
								userId: userIdForTitle,
								conversationId: convIdForTitle,
							});
							if (conv?.title === "New conversation") {
								const title = await generateConversationTitle({
									userMessage: message,
									assistantPreview: response.content,
								});
								await updateConversationTitle({
									userId: userIdForTitle,
									conversationId: convIdForTitle,
									title,
								});
							}
						} catch (err) {
							logger.warn("Failed to generate conversation title", {
								error: err instanceof Error ? err.message : String(err),
							});
						}
					})();
				}

				return c.json(
					{
						message: response,
						lastResponseId: result.lastResponseId,
						...(persistenceConv && { conversationId: persistenceConv.id }),
					},
					HTTP_STATUS.OK,
				);
			} catch (error) {
				logger.error("Chat error:", error);
				return c.json(
					{ error: "An error occurred processing your request" },
					HTTP_STATUS.INTERNAL_SERVER_ERROR,
				);
			}
		} catch (error) {
			logger.error("Chat error:", error);
			return c.json(
				{ error: "An error occurred processing your request" },
				HTTP_STATUS.INTERNAL_SERVER_ERROR,
			);
		}
	},
);


/**
 * POST /chat/stream - Streaming chat endpoint using SSE (with OpenAI Agent)
 */
app.post(
	"/stream",
	describeRoute({
		tags: ["Chat"],
		summary: "Send a chat message with streaming response",
		description:
			"Send a message to the Aware Health Companion and receive a streaming response via SSE",
		responses: {
			[HTTP_STATUS.OK]: {
				description: "SSE stream of chat responses",
				content: {
					"text/event-stream": {
						schema: resolver(z.string()),
					},
				},
			},
		},
	}),
	async (c) => {
		try {
			const body = await c.req.json();
			let parsedData: ParsedRequest;

			try {
				parsedData = validateChatRequest(body);
			} catch (error) {
				return c.json(
					{ error: error instanceof Error ? error.message : "Invalid request" },
					HTTP_STATUS.BAD_REQUEST,
				);
			}

			const {
				message,
				context,
				conversationHistory,
				userProfile,
				conversationId,
				previousResponseId,
				sessionId,
			} = parsedData;

			const hasContextData = !!context?.data;

			// Detect follow-up: if there's any prior assistant message in history, it's a follow-up

			const hasAssistantHistory =
				conversationHistory?.some((msg) => msg.role === "assistant") ?? false;
			const isFollowUp = !!previousResponseId || hasAssistantHistory;
			const responseMode: "first_turn" | "follow_up" = isFollowUp
				? "follow_up"
				: "first_turn";
			const keepDisclaimer = shouldIncludeMedicalDisclaimer(message);

			logger.debug("Conversation mode detection (streaming)", {
				isFollowUp,
				responseMode,
				hasConversationId: !!conversationId,
				hasPreviousResponseId: !!previousResponseId,
				historyLength: conversationHistory?.length ?? 0,
				hasAssistantHistory,
			});

			// Early scope check – short-circuit clearly non-medical questions
			const scope = classifyQueryScope(message);
			if (scope === "non_medical") {
				logger.debug("Non-medical query detected for streaming endpoint", {
					messagePreview: message.slice(0, 80),
				});

				// For SSE, send a single completion event with the refusal message.
				const refusalContent =
					"I’m here to help you understand your lab results and biomarkers in this app. I can’t answer that kind of question, but I’m happy to explain any of your results or help you prepare questions for your medical professional.";

				return streamSSE(c, async (stream) => {
					await stream.writeSSE({
						event: "complete",
						data: JSON.stringify({
							finalOutput: refusalContent,
							timestamp: new Date().toISOString(),
							lastResponseId: undefined,
						}),
						id: "complete",
					});
				});
			}

			try {
				validateAccessToken(userProfile);
			} catch (error) {
				logger.error("Invalid or missing access token in request");
				return c.json(
					{ error: error instanceof Error ? error.message : "Invalid or missing access token" },
					HTTP_STATUS.UNAUTHORIZED,
				);
			}

			logger.debug("Processing streaming chat request", {
				hasContext: !!context,
				contextType: context?.type,
				hasContextData,
				tokenPrefix: `${userProfile.accessToken.substring(0, 20)}...`,
			});

			// On follow-ups, do not re-inject large context.data; rely on conversationHistory.
			const contextForPrompt =
				responseMode === "follow_up" && context
					? { ...context, data: undefined }
					: context;

			const enhancedMessage = enhanceMessageWithContext(message, contextForPrompt, {
				age: userProfile.age,
				sex: userProfile.sex,
			});

			const messages = buildMessages(
				conversationHistory,
				enhancedMessage,
				previousResponseId,
			);

			let streamPersistenceConv: { id: string } | null = null;
			if (env.USE_PERSISTENT_STORAGE) {
				try {
					const userId = getUserIdFromToken(userProfile.accessToken);
					streamPersistenceConv = await getOrCreateActiveConversation(
						userId,
						conversationId,
					);
					await appendMessage({
						conversationId: streamPersistenceConv.id,
						role: "user",
						content: message,
						contextSnapshot: context
							? { type: context.type, name: context.name }
							: undefined,
					});
					await touchConversationOnNewMessage({
						userId,
						conversationId: streamPersistenceConv.id,
					});
				} catch (persistErr) {
					logger.warn("Failed to persist user message (stream)", {
						error:
							persistErr instanceof Error ? persistErr.message : String(persistErr),
					});
					streamPersistenceConv = null;
				}
			}

			// Set headers to prevent buffering
		c.header('Cache-Control', 'no-cache');
		c.header('X-Accel-Buffering', 'no');
		c.header('Connection', 'keep-alive');
		c.header('Content-Type', 'text/event-stream');

		return streamSSE(c, async (stream) => {
			const requestStartTime = Date.now();

			logger.debug("SSE stream handler started", {
					hasContext: !!context,
					contextType: context?.type,
					hasContextData,
					conversationHistoryLength: conversationHistory?.length || 0,
					hasConversationId: !!conversationId,
					hasPreviousResponseId: !!previousResponseId,
				});

				try {
					if (context?.name) {
						try {
							await stream.writeSSE({
								event: "context_used",
								data: JSON.stringify({ type: context.type, name: context.name }),
								id: String(Date.now()),
							});
							await new Promise(resolve => setImmediate(resolve));
							logger.debug("Sent context_used event", {
								contextType: context.type,
								contextName: context.name,
								hasContextData,
							});
						} catch (contextError) {
							logger.error("Failed to send context_used event via SSE", {
								error: contextError instanceof Error ? contextError.message : String(contextError),
								contextType: context.type,
								contextName: context.name,
							});
						}
					}

					// For follow-ups we want short, direct answers and we do NOT want extra tool calls.
					// Disabling tools for follow-ups also prevents accidental multi-turn loops.
					const hasContextDataForAgent =
						responseMode === "follow_up" ? true : hasContextData;
					const agent = createAgentForContext(
						context,
						hasContextDataForAgent,
						responseMode,
					);
					const runOptions = buildRunOptions(
						userProfile,
						previousResponseId,
						true,
					);

					let agentStream: Awaited<ReturnType<typeof runAgent>>;
					let lastResponseId: string | undefined;

					try {
						logger.debug("Starting agent stream", {
							contextType: context?.type,
							maxTurns: runOptions?.maxTurns,
							messagesCount: messages.length,
							hasConversationId: !!conversationId,
							hasPreviousResponseId: !!previousResponseId,
							hasContextData,
							contextDataSize: context?.data ? JSON.stringify(context.data).length : 0,
						});


						agentStream = await withTrace(
							createWorkflowName("aware-companion-stream", context?.type),
							async () => {
								logger.debug("Calling agent.run()", {
									agentName: agent.name,
									messagesCount: messages.length,
									runOptionsKeys: runOptions ? Object.keys(runOptions) : [],
									hasContextData,
								});


								try {
									const result = await runAgent(
										agent,
										messages,
										runOptions,
									);


									logger.debug("agent.run() completed successfully", {
										hasResult: !!result,
									});
									return result;
								} catch (runError) {

									logger.error("Error in agent.run()", {
										error: runError instanceof Error ? runError.message : String(runError),
										stack: runError instanceof Error ? runError.stack : undefined,
										errorType: runError?.constructor?.name,
									});
									throw runError;
								}
							},
							{
								metadata: createTraceMetadata({
									contextType: context?.type,
									hasUserProfile: !!(userProfile.age || userProfile.sex),
								}),
							},
						);


						let textDeltaCount = 0;
						let fullContent = "";


						// Declare keepaliveTimer outside try block so it's accessible in finally
						let keepaliveTimer: NodeJS.Timeout | null = null;
						let hasReceivedFirstChunk = false;

						try {
							const textStream = agentStream.toTextStream({
								compatibleWithNodeStreams: false,
							});

							const keepaliveInterval = 5000; // Send keepalive every 5 seconds

							// Start keepalive mechanism to prevent proxy buffering during delay
							const startKeepalive = () => {
								if (hasReceivedFirstChunk || keepaliveTimer) return;

								keepaliveTimer = setInterval(async () => {
									if (hasReceivedFirstChunk) {
										if (keepaliveTimer) {
											clearInterval(keepaliveTimer);
											keepaliveTimer = null;
										}
										return;
									}

									try {
										await stream.writeSSE({
											event: "ping",
											data: JSON.stringify({ timestamp: Date.now() }),
										});
									} catch {
										// Ignore keepalive errors (stream may have closed)
										if (keepaliveTimer) {
											clearInterval(keepaliveTimer);
											keepaliveTimer = null;
										}
									}
								}, keepaliveInterval);
							};

							// Start keepalive immediately after context_used
							startKeepalive();

							// Streaming filter: prevent sending medical professional-section content to the client.
							// We still keep collecting fullContent and will send a fully normalized final output on completion.
							const carrySize = 64;
							let pending = "";
							let suppressStreaming = false;

							for await (const chunk of textStream) {
								if (!hasReceivedFirstChunk && chunk && chunk.length > 0) {
									hasReceivedFirstChunk = true;
									// Stop keepalive once we start receiving text
									if (keepaliveTimer) {
										clearInterval(keepaliveTimer);
										keepaliveTimer = null;
									}
								}


								if (chunk && chunk.length > 0) {
									textDeltaCount++;
									fullContent += chunk;

									if (!suppressStreaming) {
										pending += chunk;
										const suppressIndex = findSuppressStartIndex(pending);
										if (suppressIndex !== null) {
											// Send only content before the medical professional section marker, then stop streaming further text.
											const safe = pending.slice(0, suppressIndex);
											if (safe.length > 0) {
												try {
													await stream.writeSSE({
														event: "text_delta",
														data: JSON.stringify({ delta: safe }),
														id: String(textDeltaCount),
													});
													await new Promise(resolve => setImmediate(resolve));
												} catch (deltaError) {
													logger.error("Failed to send text delta via SSE", {
														error: deltaError instanceof Error ? deltaError.message : String(deltaError),
														deltaLength: safe.length,
														eventId: textDeltaCount,
													});
												}
											}
											suppressStreaming = true;
											pending = "";
										} else {
											// Keep a small tail to detect patterns spanning chunk boundaries.
											const safeLen = Math.max(0, pending.length - carrySize);
											const safe = pending.slice(0, safeLen);
											pending = pending.slice(safeLen);
											if (safe.length > 0) {
												try {
													await stream.writeSSE({
														event: "text_delta",
														data: JSON.stringify({ delta: safe }),
														id: String(textDeltaCount),
													});

													await new Promise(resolve => setImmediate(resolve));

													if (textDeltaCount <= 3) {
														logger.debug("Sent text delta SSE", {
															deltaLength: safe.length,
															deltaPreview: safe.substring(0, 50),
															eventId: textDeltaCount,
														});
													}
												} catch (deltaError) {
													logger.error("Failed to send text delta via SSE", {
														error: deltaError instanceof Error ? deltaError.message : String(deltaError),
														deltaLength: safe.length,
														eventId: textDeltaCount,
													});
												}
											}
										}
									}
								} else {
								}
							}


							await agentStream.completed;

							if (fullContent.length === 0 && typeof agentStream.finalOutput === "string") {
								fullContent = agentStream.finalOutput;

							}
							// Flush any remaining safe pending text.
							if (!suppressStreaming && pending.length > 0) {
								try {
									await stream.writeSSE({
										event: "text_delta",
										data: JSON.stringify({ delta: pending }),
										id: `flush-${textDeltaCount}`,
									});
									await new Promise(resolve => setImmediate(resolve));
								} catch (deltaError) {
									logger.error("Failed to flush pending text via SSE", {
										error: deltaError instanceof Error ? deltaError.message : String(deltaError),
										deltaLength: pending.length,
									});
								}
							}
						} catch (streamError) {

							logger.error("Error while processing agent stream", {
								error: streamError instanceof Error ? streamError.message : String(streamError),
								stack: streamError instanceof Error ? streamError.stack : undefined,
								textDeltaCount,
								contentLength: fullContent.length,
							});
							throw streamError;
						} finally {
							// Ensure keepalive timer is always cleaned up
							if (keepaliveTimer) {
								clearInterval(keepaliveTimer);
								keepaliveTimer = null;
							}
						}

						logger.debug("Agent stream completed", {
							textDeltaCount,
							contentLength: fullContent.length,
							hasContent: fullContent.length > 0,
						});


						if (fullContent.length > 0 && textDeltaCount === 0) {
							try {
								await stream.writeSSE({
									event: "text_delta",
									data: JSON.stringify({ delta: fullContent }),
									id: "full-content",
								});
								await new Promise(resolve => setImmediate(resolve));
							} catch (writeError) {
								logger.error("Failed to send full content delta via SSE", {
									error: writeError instanceof Error ? writeError.message : String(writeError),
									contentLength: fullContent.length,
								});
							}
						}

						lastResponseId =
							"lastResponseId" in agentStream &&
							typeof agentStream.lastResponseId === "string"
								? agentStream.lastResponseId
								: undefined;

						if (sessionId && lastResponseId) {
							storeLastResponseId(sessionId, lastResponseId);
						}

						// Apply lightweight post-processing before sending completion
						const normalizedContent = normalizeAssistantText(
							fullContent ||
								"I apologize, but I couldn't generate a response. Please try again.",
						);
						const finalContent = (() => {
							const stripped = keepDisclaimer
								? normalizedContent
								: stripNonEssentialDisclaimers(normalizedContent);
							return responseMode === "follow_up"
								? stripFollowUpStructure(stripped)
								: stripped;
						})();

						logger.debug("Sending completion event", {
							contentLength: normalizedContent.length,
							hasLastResponseId: !!lastResponseId,
						});


						try {
							await stream.writeSSE({
								event: "complete",
								data: JSON.stringify({
									finalOutput: finalContent,
									timestamp: new Date().toISOString(),
									lastResponseId,
									...(streamPersistenceConv && {
										conversationId: streamPersistenceConv.id,
									}),
								}),
								id: "complete",
							});

							if (streamPersistenceConv) {
								try {
									await appendMessage({
										conversationId: streamPersistenceConv.id,
										role: "assistant",
										content: finalContent,
									});
								} catch (e) {
									logger.warn("Failed to persist assistant message (stream)", {
										error: e instanceof Error ? e.message : String(e),
									});
								}
								// Fire-and-forget: generate conversation title if still default
								const streamUserId = getUserIdFromToken(userProfile.accessToken);
								const streamConvId = streamPersistenceConv.id;
								void (async () => {
									try {
										const conv = await getUserConversation({
											userId: streamUserId,
											conversationId: streamConvId,
										});
										if (conv?.title === "New conversation") {
											const title = await generateConversationTitle({
												userMessage: message,
												assistantPreview: finalContent,
											});
											await updateConversationTitle({
												userId: streamUserId,
												conversationId: streamConvId,
												title,
											});
										}
									} catch (err) {
										logger.warn("Failed to generate conversation title (stream)", {
											error: err instanceof Error ? err.message : String(err),
										});
									}
								})();
							}

							// Flush completion event with multiple delays to ensure it reaches the client
							await new Promise(resolve => setImmediate(resolve));
							await new Promise(resolve => setImmediate(resolve));
							await new Promise(resolve => setTimeout(resolve, 200)); // Increased from 100ms to 200ms


							logger.debug("Completion event sent successfully and flushed");
						} catch (writeError) {

							logger.error("Failed to send completion event via SSE", {
								error: writeError instanceof Error ? writeError.message : String(writeError),
								stack: writeError instanceof Error ? writeError.stack : undefined,
								contentLength: fullContent.length,
							});
							throw writeError;
						}
					} catch (error) {

						const errorDetails = {
							error: error instanceof Error ? error.message : String(error),
							stack: error instanceof Error ? error.stack : undefined,
							errorType: error?.constructor?.name,
							errorName: error instanceof Error ? error.name : undefined,
							contextType: context?.type,
							hasContextData,
							messagesCount: messages.length,
							hasConversationId: !!conversationId,
							hasPreviousResponseId: !!previousResponseId,
							requestDuration: Date.now() - requestStartTime,
						};

						logger.error("Error in agent stream", errorDetails);

						try {
							const errorResponse = handleAgentError(error);
							const sseError = formatErrorForSSE(errorResponse);
							logger.debug("Sending error event via SSE", {
								errorType: errorResponse.type,
								userMessage: errorResponse.userFriendlyMessage,
							});
							await stream.writeSSE(sseError);
							logger.debug("Error event sent successfully");
						} catch (sseError) {
							logger.error("Failed to send error event via SSE", {
								error: sseError instanceof Error ? sseError.message : String(sseError),
								originalError: errorDetails,
							});
						}
						return;
					}
				} catch (error) {

					const errorDetails = {
						error: error instanceof Error ? error.message : String(error),
						stack: error instanceof Error ? error.stack : undefined,
						errorType: error?.constructor?.name,
						errorName: error instanceof Error ? error.name : undefined,
						requestDuration: Date.now() - requestStartTime,
					};

					logger.error("Streaming error in SSE handler", errorDetails);

					try {
						const errorResponse = handleAgentError(error);
						const sseError = formatErrorForSSE(errorResponse);
						logger.debug("Sending streaming error event via SSE", {
							errorType: errorResponse.type,
						});
						await stream.writeSSE(sseError);
						logger.debug("Streaming error event sent successfully");
					} catch (sseError) {
						logger.error("Failed to send streaming error event via SSE", {
							error: sseError instanceof Error ? sseError.message : String(sseError),
							originalError: errorDetails,
						});
					}
				} finally {
					logger.debug("SSE stream handler completed", {
						requestDuration: Date.now() - requestStartTime,
					});
				}
			});
		} catch (error) {
			logger.error("Stream setup error:", error);
			return c.json(
				{ error: "An error occurred setting up the stream" },
				HTTP_STATUS.INTERNAL_SERVER_ERROR,
			);
		}
	},
);

export default app;
