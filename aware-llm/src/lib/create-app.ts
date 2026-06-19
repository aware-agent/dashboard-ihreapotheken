import { Hono } from "hono";
import { errorHandler } from "../middlewares/error-handler.js";
import { registerMiddlewares } from "../middlewares/index.js";
import { notFoundHandler } from "../middlewares/not-found.js";

/**
 * Creates a new Hono application instance with all middlewares and error handlers configured
 * Uses hono-openapi for OpenAPI/Swagger support
 *
 * @param options - Configuration options for app creation
 * @returns Configured Hono application instance
 */
export function createApp(options: { basePath?: string } = {}) {
	const app = new Hono();

	// Apply base path if provided
	if (options.basePath) {
		app.basePath(options.basePath);
	}

	// Register all middlewares (security, logging, etc.)
	registerMiddlewares(app);

	// Error handlers
	app.onError(errorHandler);
	app.notFound(notFoundHandler);

	return app;
}

/**
 * Creates a router instance (sub-application) for route organization
 * Use this for creating modular route groups
 *
 * @returns New Hono router instance
 */
export function createRouter() {
	return new Hono();
}
