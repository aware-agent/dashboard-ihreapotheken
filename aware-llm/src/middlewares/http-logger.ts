import type { MiddlewareHandler } from "hono";
import { getClientIp } from "../utils/ip.js";
import { logger } from "../utils/logger.js";

/**
 * HTTP request logging middleware
 * Logs HTTP requests with method, path, status, duration, IP, user agent, and request ID
 *
 * Note: Requires request-id middleware to be applied before this middleware
 * to include request ID in logs for correlation
 */
export const httpLogger: MiddlewareHandler = async (c, next) => {
	const start = Date.now();
	const method = c.req.method;
	const path = c.req.path;
	const url = c.req.url;
	const userAgent = c.req.header("user-agent") || "unknown";
	const ip = getClientIp(c);

	// Get request ID if available
	const requestId = c.get("requestId") as string | undefined;

	// Execute the request
	await next();

	// Calculate duration
	const duration = Date.now() - start;
	const status = c.res.status;

	// Log the request
	logger.info("HTTP Request", {
		requestId,
		method,
		path,
		url,
		status,
		duration: `${duration}ms`,
		userAgent,
		ip,
	});
};
