import {
	AgentsError,
	GuardrailExecutionError,
	InputGuardrailTripwireTriggered,
	MaxTurnsExceededError,
	ModelBehaviorError,
	OutputGuardrailTripwireTriggered,
	ToolCallError,
	UserError,
} from "@openai/agents";
import { logger } from "./logger.js";

/**
 * Structured error response for agent errors
 */
export interface AgentErrorResponse {
	/**
	 * Type of error for client handling
	 */
	type:
		| "emergency"
		| "inappropriate_request"
		| "guardrail_input"
		| "guardrail_output"
		| "max_turns"
		| "tool_error"
		| "model_error"
		| "user_error"
		| "rate_limit"
		| "unknown";

	/**
	 * Technical error message for logging
	 */
	message: string;

	/**
	 * User-friendly message to display
	 */
	userFriendlyMessage: string;

	/**
	 * Whether the request can be retried
	 */
	shouldRetry: boolean;

	/**
	 * HTTP status code to return
	 */
	statusCode: number;

	/**
	 * Name of the guardrail that triggered (if applicable)
	 */
	guardrailName?: string;

	/**
	 * Current run state for potential retry
	 */
	state?: unknown;
}

/**
 * Emergency response message
 */
const EMERGENCY_MESSAGE = `
🚨 **This appears to be a medical emergency.**

Please contact emergency services immediately:
- **Germany:** 112
- **EU Emergency:** 112
- **USA:** 911

If you're having thoughts of self-harm, please contact:
- **Germany:** 0800 111 0 111 (Telefonseelsorge)
- **International:** https://findahelpline.com/

I'm designed to help with general health education, not emergency situations.
`.trim();

/**
 * Handle agent errors and return structured response
 */
export function handleAgentError(error: unknown): AgentErrorResponse {
	// Input guardrail triggered (e.g., emergency, inappropriate content)
	if (error instanceof InputGuardrailTripwireTriggered) {
		// Access properties safely - structure may vary by @openai/agents version
		const guardrailName =
			(error as unknown as { guardrail?: { name?: string } }).guardrail?.name ??
			"unknown";
		const result = (error as unknown as { result?: unknown })?.result;
		const outputInfo = (
			result as { outputInfo?: Record<string, unknown> } | undefined
		)?.outputInfo;

		// Check if it's an emergency
		if (
			guardrailName === "medical_emergency_check" ||
			outputInfo?.isEmergency
		) {
			logger.warn("Medical emergency guardrail triggered", {
				guardrailName,
			});

			return {
				type: "emergency",
				message: error.message,
				userFriendlyMessage: EMERGENCY_MESSAGE,
				shouldRetry: false,
				statusCode: 200, // Return 200 with emergency message
				guardrailName,
			};
		}

		// Check if it's an inappropriate request
		if (
			guardrailName === "inappropriate_content_check" ||
			outputInfo?.isInappropriate
		) {
			return {
				type: "inappropriate_request",
				message: error.message,
				userFriendlyMessage:
					"I'm not able to provide specific medical advice, dosage recommendations, or diagnoses. For these questions, please consult with your healthcare provider. I can help you understand your biomarker results and general health information.",
				shouldRetry: false,
				statusCode: 200,
				guardrailName,
			};
		}

		// Prompt injection attempt
		if (guardrailName === "prompt_injection_check") {
			return {
				type: "guardrail_input",
				message: error.message,
				userFriendlyMessage:
					"I couldn't process that request. Please try rephrasing your question about your health data.",
				shouldRetry: false,
				statusCode: 400,
				guardrailName,
			};
		}

		// Generic input guardrail
		return {
			type: "guardrail_input",
			message: error.message,
			userFriendlyMessage:
				"I cannot help with this type of request. Please rephrase your question.",
			shouldRetry: false,
			statusCode: 200,
			guardrailName,
		};
	}

	// Output guardrail triggered
	if (error instanceof OutputGuardrailTripwireTriggered) {
		const guardrailName =
			(error as unknown as { guardrail?: { name?: string } }).guardrail?.name ??
			"unknown";

		logger.warn("Output guardrail triggered", {
			guardrailName,
		});

		return {
			type: "guardrail_output",
			message: error.message,
			userFriendlyMessage:
				"I need to rephrase my response. Let me try again with more appropriate language.",
			shouldRetry: true,
			statusCode: 200,
			guardrailName,
			state: error.state,
		};
	}

	// Guardrail execution error (guardrail itself failed)
	if (error instanceof GuardrailExecutionError) {
		logger.error("Guardrail execution failed", {
			message: error.message,
		});

		return {
			type: "guardrail_input",
			message: error.message,
			userFriendlyMessage:
				"I encountered an issue processing your request. Please try again.",
			shouldRetry: true,
			statusCode: 500,
			state: error.state,
		};
	}

	// Max turns exceeded
	if (error instanceof MaxTurnsExceededError) {
		logger.warn("Max turns exceeded", {
			message: error.message,
		});

		return {
			type: "max_turns",
			message: error.message,
			userFriendlyMessage:
				"This question is quite complex. Could you try asking a more specific question? For example, ask about one biomarker or health zone at a time.",
			shouldRetry: false,
			statusCode: 200,
		};
	}

	// Tool call error
	if (error instanceof ToolCallError) {
		logger.error("Tool call failed", {
			message: error.message,
		});

		return {
			type: "tool_error",
			message: error.message,
			userFriendlyMessage:
				"I had trouble accessing your health data. Please try again in a moment.",
			shouldRetry: true,
			statusCode: 502,
		};
	}

	// Model behavior error (malformed output, etc.)
	if (error instanceof ModelBehaviorError) {
		logger.error("Model behavior error", {
			message: error.message,
		});

		return {
			type: "model_error",
			message: error.message,
			userFriendlyMessage:
				"I had trouble generating a response. Please try again.",
			shouldRetry: true,
			statusCode: 500,
		};
	}

	// User error (configuration issue)
	if (error instanceof UserError) {
		logger.error("User configuration error", {
			message: error.message,
		});

		return {
			type: "user_error",
			message: error.message,
			userFriendlyMessage:
				"There's a configuration issue. Please try again later.",
			shouldRetry: false,
			statusCode: 500,
		};
	}

	// Generic AgentsError
	if (error instanceof AgentsError) {
		logger.error("Agent error", {
			message: error.message,
		});

		return {
			type: "unknown",
			message: error.message,
			userFriendlyMessage: "An unexpected error occurred. Please try again.",
			shouldRetry: true,
			statusCode: 500,
			state: error.state,
		};
	}

	// Check for OpenAI authentication and configuration errors
	if (error instanceof Error) {
		const errorMessage = error.message.toLowerCase();
		const errorName = error.name || "";
		const status = (error as { status?: number }).status;
		const originalMessage = error.message;

		// Check specifically for geography restriction errors first (more specific)
		if (
			originalMessage.includes("geography restrictions") ||
			originalMessage.includes("geography restriction") ||
			errorMessage.includes("geography restrictions") ||
			errorMessage.includes("geography restriction")
		) {
			logger.error("OpenAI geography restriction error", {
				message: originalMessage,
				status,
				errorName,
			});

			return {
				type: "user_error",
				message: originalMessage,
				userFriendlyMessage:
					"There's a configuration issue with the OpenAI API. Geography restrictions need to be enabled for this endpoint. Please contact support.",
				shouldRetry: false,
				statusCode: 500,
			};
		}

		// Check for authentication errors (401)
		if (
			status === 401 ||
			originalMessage.startsWith("401") ||
			errorName === "AuthenticationError" ||
			errorMessage.includes("authentication") ||
			errorMessage.includes("invalid api key") ||
			errorMessage.includes("unauthorized")
		) {
			logger.error("OpenAI authentication error", {
				message: originalMessage,
				status,
				errorName,
			});

			return {
				type: "user_error",
				message: originalMessage,
				userFriendlyMessage:
					"There's an authentication issue with the AI service. Please try again later or contact support.",
				shouldRetry: false,
				statusCode: 500,
			};
		}

		// Check for OpenAI rate limit errors
		if (
			errorMessage.includes("rate limit") ||
			errorMessage.includes("requests per min") ||
			errorMessage.includes("rpm") ||
			errorMessage.includes("tpm")
		) {
			// Extract retry time from error message if available
			const retryMatch = errorMessage.match(/try again in (\d+)s/i);
			const retrySeconds = retryMatch ? parseInt(retryMatch[1], 10) : 20;

			logger.warn("OpenAI rate limit reached", {
				message: error.message,
				retrySeconds,
			});

			return {
				type: "rate_limit",
				message: error.message,
				userFriendlyMessage: `I'm currently processing many requests. Please wait ${retrySeconds} seconds and try again.`,
				shouldRetry: true,
				statusCode: 429, // Too Many Requests
			};
		}
	}

	// Unknown error
	logger.error("Unknown error in agent", {
		error: String(error),
	});

	return {
		type: "unknown",
		message: error instanceof Error ? error.message : String(error),
		userFriendlyMessage: "An unexpected error occurred. Please try again.",
		shouldRetry: true,
		statusCode: 500,
	};
}

/**
 * Format error response for SSE streaming
 */
export function formatErrorForSSE(errorResponse: AgentErrorResponse): {
	event: string;
	data: string;
} {
	return {
		event: errorResponse.type === "emergency" ? "emergency" : "error",
		data: JSON.stringify({
			type: errorResponse.type,
			message: errorResponse.userFriendlyMessage,
			shouldRetry: errorResponse.shouldRetry,
		}),
	};
}
