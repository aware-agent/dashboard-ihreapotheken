import { z } from "zod";

/**
 * Chat message schema
 */
export const ChatMessageSchema = z.object({
	role: z.enum(["user", "assistant"]),
	content: z.string(),
	timestamp: z.string().optional(),
	context: z
		.object({
			type: z.enum(["healthZone", "biomarker", "general", "bioAge"]),
			name: z.string().optional(),
			id: z.string().optional(),
		})
		.optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

/**
 * Chat context schema - data passed from frontend
 */
export const ChatContextSchema = z.object({
	type: z.enum(["healthZone", "biomarker", "general", "bioAge"]),
	id: z.string().optional(),
	name: z.string().optional(),
	data: z.unknown().optional(),
});

export type ChatContext = z.infer<typeof ChatContextSchema>;

/**
 * User profile schema for personalization
 */
export const UserProfileSchema = z.object({
	age: z.number().optional(),
	sex: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
	accessToken: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

/**
 * Shared agent run context passed via Runner.run options.
 * This is local-only data available to tools and hooks, not to the LLM.
 */
export interface AgentContext {
	accessToken: string;
	userAge?: number;
	userSex?: "MALE" | "FEMALE" | "OTHER";
}

/**
 * Chat request schema
 */
export const ChatRequestSchema = z.object({
	message: z.string().min(1, "Message is required"),
	context: ChatContextSchema.optional(),
	conversationHistory: z.array(ChatMessageSchema).optional(),
	userProfile: UserProfileSchema,
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Biomarker data from Aware API
 */
export interface BiomarkerData {
	id: string;
	name: string;
	code: string;
	value: number;
	valueText: string;
	unit: string;
	range: [number | null, number | null];
	rangeTernary: -1 | 0 | 1 | null;
	biomarkerStatus: "OPTIMAL" | "NORMAL" | "HIGH" | "LOW" | "NO_RANGE";
	optimalRange: [number | null, number | null];
	rangeOptimalTernary: -1 | 0 | 1 | null;
	percentageVariation: number | null;
}

/**
 * Health zone data from Aware API
 */
export interface HealthZoneData {
	id: string;
	name: string;
	icon: string | null;
	inRange: number;
	outOfRange: number;
	biomarkers?: BiomarkerData[];
}

/**
 * Result data from Aware API
 */
export interface ResultData {
	id: string;
	date: string;
	biomarkers: BiomarkerData[];
	healthZones: HealthZoneData[];
	inRange: number;
	outOfRange: number;
}

/**
 * User health data for agent context
 */
export interface UserHealthData {
	latestResult: ResultData | null;
	previousResults: ResultData[];
	healthZones: HealthZoneData[];
}

/**
 * SSE event types for streaming
 */
export type SSEEventType =
	| "text_delta"
	| "context_used"
	| "complete"
	| "error"
	| "thinking";

export interface SSEEvent {
	type: SSEEventType;
	data: unknown;
}
