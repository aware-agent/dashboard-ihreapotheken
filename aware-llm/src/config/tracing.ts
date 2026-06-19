import type { TracingConfig } from "@openai/agents";
import { env } from "../env/index.js";

/**
 * Global tracing configuration for the Aware Health Companion
 */
export const tracingConfig: TracingConfig = {};

/**
 * Create per-request tracing metadata
 */
export function createTraceMetadata(options: {
	contextType?: string;
	userId?: string;
	hasUserProfile?: boolean;
}): Record<string, string> {
	return {
		contextType: options.contextType ?? "general",
		hasUserProfile: String(options.hasUserProfile ?? false),
		environment: env.NODE_ENV,
		...(options.userId && { userId: options.userId }),
	};
}

/**
 * Create workflow name based on context
 */
export function createWorkflowName(
	baseWorkflow: string,
	contextType?: string,
): string {
	if (contextType) {
		return `${baseWorkflow}:${contextType}`;
	}
	return baseWorkflow;
}
