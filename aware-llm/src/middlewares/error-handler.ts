import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { env } from "../env/index.js";
import { ERROR_CODES, ERROR_MESSAGES, HTTP_STATUS } from "../lib/constants.js";
import { logger } from "../utils/logger.js";

/**
 * Global error handler middleware
 * Handles all errors thrown in the application
 */
export const errorHandler: ErrorHandler = (err, c) => {
	// Handle HTTPException (intentional errors)
	if (err instanceof HTTPException) {
		return c.json(
			{
				success: false,
				error: {
					message: err.message,
					status: err.status,
				},
			},
			err.status,
		);
	}

	// Handle validation errors (e.g., from Zod)
	if (err.name === "ZodError") {
		return c.json(
			{
				success: false,
				error: {
					code: ERROR_CODES.VALIDATION_ERROR,
					message: ERROR_MESSAGES.VALIDATION_ERROR,
					status: HTTP_STATUS.BAD_REQUEST,
					details: (err as { issues?: unknown[] }).issues,
				},
			},
			HTTP_STATUS.BAD_REQUEST,
		);
	}

	// Log unexpected errors
	logger.error("Unexpected error", {
		error: err.message,
		stack: err.stack,
		name: err.name,
	});

	// Determine status code
	const statusCode = ((err as { status?: number }).status ?? 500) as 500;
	const message =
		env.NODE_ENV === "production"
			? "Internal server error"
			: err.message || "An unexpected error occurred";

	return c.json(
		{
			success: false,
			error: {
				message,
				status: statusCode,
				...(env.NODE_ENV === "development" && {
					stack: err.stack,
				}),
			},
		},
		statusCode,
	);
};
