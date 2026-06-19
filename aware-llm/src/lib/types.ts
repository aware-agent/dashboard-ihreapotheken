import type { Context, Hono } from "hono";

/**
 * Application bindings (variables available in context)
 * Extend this interface to add custom variables to the context
 */
export interface AppBindings {
	Variables: {
		// Request ID is available via request-id middleware
		requestId?: string;
	};
}

/**
 * Type-safe route handler
 * Provides type inference for route handlers
 *
 * @template R - Route configuration type
 */
export type AppRouteHandler<_R extends { in?: unknown; out?: unknown }> = (
	c: Context<AppBindings>,
) => Promise<Response> | Response;

/**
 * Application type with bindings
 */
export type AppType = Hono<AppBindings>;
