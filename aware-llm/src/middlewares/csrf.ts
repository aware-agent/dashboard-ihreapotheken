import type { MiddlewareHandler } from "hono";
import { csrf } from "hono/csrf";
import { env } from "../env/index.js";

/**
 * CSRF protection configuration options
 */
export interface CsrfOptions {
	/**
	 * Allowed origins for CSRF validation
	 * Can be a string, array of strings, or function for dynamic validation
	 */
	origin?: string | string[] | ((origin: string) => boolean);

	/**
	 * Allowed Sec-Fetch-Site header values
	 * Valid values: 'same-origin', 'same-site', 'none', 'cross-site'
	 * Can be a string, array of strings, or function for dynamic validation
	 */
	secFetchSite?:
		| "same-origin"
		| "same-site"
		| "none"
		| "cross-site"
		| ("same-origin" | "same-site" | "none" | "cross-site")[]
		| ((secFetchSite: string) => boolean);
}

/**
 * Creates CSRF protection middleware using Hono's built-in CSRF
 * Only applies in production by default
 *
 * Hono's CSRF middleware uses modern browser security features:
 * - Validates Origin header
 * - Validates Sec-Fetch-Site header (Fetch Metadata API)
 * - Only validates unsafe methods (POST, PUT, DELETE, PATCH)
 * - Only validates form content types (application/x-www-form-urlencoded, multipart/form-data, text/plain)
 *
 * @param options - Configuration options
 * @returns CSRF protection middleware or null if not in production
 */
export function createCsrfMiddleware(
	options: CsrfOptions = {},
): MiddlewareHandler | null {
	// Only enable CSRF in production
	if (env.NODE_ENV !== "production") {
		return null;
	}

	const { origin, secFetchSite } = options;

	// Use Hono's built-in CSRF middleware
	// If no origin is provided, it defaults to same-origin validation
	return csrf({
		origin: origin || undefined,
		secFetchSite: secFetchSite || undefined,
	});
}

/**
 * Creates CSRF protection middleware with CORS origins
 * @param allowedOrigins - Array of allowed CORS origins
 * @returns CSRF middleware or null if not in production
 */
export function createCsrfMiddlewareWithOrigins(
	allowedOrigins?: string[],
): MiddlewareHandler | null {
	if (!allowedOrigins || allowedOrigins.length === 0) {
		// If no origins provided, use default (same-origin only)
		return createCsrfMiddleware();
	}

	return createCsrfMiddleware({
		origin: allowedOrigins,
	});
}
