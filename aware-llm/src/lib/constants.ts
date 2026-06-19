export const ERROR_MESSAGES = {
	// Validation errors
	REQUIRED: "Required",
	INVALID_INPUT: "Invalid input",
	VALIDATION_ERROR: "Validation error",
	NO_UPDATES: "No updates provided",

	// Not found errors
	NOT_FOUND: "Not Found",
	RESOURCE_NOT_FOUND: "Resource not found",

	// Server errors
	INTERNAL_SERVER_ERROR: "Internal server error",
	UNEXPECTED_ERROR: "An unexpected error occurred",
} as const;

/**
 * Error codes for programmatic error handling
 */
export const ERROR_CODES = {
	VALIDATION_ERROR: "validation_error",
	NOT_FOUND: "not_found",
	INTERNAL_ERROR: "internal_error",
	INVALID_UPDATES: "invalid_updates",
} as const;

/**
 * HTTP status code constants
 * Using numeric constants for better type safety
 */
export const HTTP_STATUS = {
	OK: 200,
	CREATED: 201,
	NO_CONTENT: 204,
	BAD_REQUEST: 400,
	UNAUTHORIZED: 401,
	FORBIDDEN: 403,
	NOT_FOUND: 404,
	UNPROCESSABLE_ENTITY: 422,
	TOO_MANY_REQUESTS: 429,
	INTERNAL_SERVER_ERROR: 500,
} as const;
