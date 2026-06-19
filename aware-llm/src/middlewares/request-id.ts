import type { MiddlewareHandler } from "hono";
import { requestId } from "hono/request-id";

/**
 * Request ID middleware configuration
 * Generates unique request IDs for request correlation and tracing
 */
export interface RequestIdOptions {
	/**
	 * Custom request ID generator function
	 * @default crypto.randomUUID()
	 */
	generator?: (c: Parameters<MiddlewareHandler>[0]) => string;

	/**
	 * Header name to read custom request ID from
	 * @default "X-Request-Id"
	 */
	headerName?: string;
}

/**
 * Creates request ID middleware using Hono's built-in request-id
 *
 * Benefits:
 * - Unique ID per request for correlation across logs
 * - Automatically added to response headers (X-Request-Id)
 * - Can be passed to clients for debugging support tickets
 * - Essential for distributed systems and log tracing
 * - Integrates with logging for better observability
 *
 * The request ID is:
 * - Generated automatically if not provided in X-Request-Id header
 * - Stored in context as `c.get('requestId')`
 * - Added to response headers as `X-Request-Id`
 * - Available in all subsequent middleware and handlers
 *
 * @param options - Configuration options
 * @returns Request ID middleware
 */
export function createRequestIdMiddleware(
	options: RequestIdOptions = {},
): MiddlewareHandler {
	return requestId({
		generator: options.generator,
		headerName: options.headerName,
	});
}

/**
 * Default request ID middleware
 * Must be applied early in the middleware chain (before logging)
 *
 * Usage:
 * - Request ID is automatically generated and added to response headers
 * - Access in handlers: `const id = c.get('requestId')`
 * - Access in logs: Already integrated with http-logger middleware
 */
export const requestIdMiddleware = createRequestIdMiddleware();
