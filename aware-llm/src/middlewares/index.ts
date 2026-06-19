import type { Hono } from "hono";
import { env } from "../env/index.js";
import { basicAuthMiddleware } from "./basic-auth.js";
import { createCompressionMiddleware } from "./compression.js";
import { createCorsMiddleware } from "./cors.js";
import { createCsrfMiddlewareWithOrigins } from "./csrf.js";
import { loggerMiddleware } from "./logger.js";
import { standardRateLimit } from "./rate-limit.js";
import { requestIdMiddleware } from "./request-id.js";
import { secureHeaders } from "./secure-headers.js";

/**
 * Register all middlewares on the Hono app
 * @param app - Hono application instance
 */
export function registerMiddlewares(app: Hono) {
	// Request ID middleware
	app.use(requestIdMiddleware);

	// Logger middleware
	app.use(loggerMiddleware);


	const corsMiddleware = createCorsMiddleware(env.CORS_ORIGINS);
	app.use("/*", corsMiddleware);

	// Secure headers (protects against XSS, clickjacking, etc.)
	app.use(secureHeaders);

	// CSRF protection (only in production)
	const csrfMiddleware = createCsrfMiddlewareWithOrigins(env.CORS_ORIGINS);
	if (csrfMiddleware) {
		app.use(csrfMiddleware);
	}

	// Rate limiting
	app.use(standardRateLimit);

	// Protect internal debug endpoints with Basic Auth
	app.use("/internal/*", basicAuthMiddleware);

	// Compression middleware - exclude SSE streams
	const compressionMiddleware = createCompressionMiddleware();
	app.use(async (c, next) => {
		// Skip compression for SSE streams
		if (c.req.path.includes('/stream')) {
			return next();
		}
		return compressionMiddleware(c, next);
	});
}
