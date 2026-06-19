import { cors } from "hono/cors";
import { env } from "../env/index.js";

/**
 * CORS middleware factory
 * Creates CORS middleware with configured origins
 * @param origins - Array of allowed CORS origins
 * @returns CORS middleware
 */
export function createCorsMiddleware(origins?: string[]) {
	const isProduction = env.NODE_ENV === "production";

	// In production, use provided origins or deny all
	// In development, allow all origins for easier development (including ngrok)
	let allowedOrigins: string | string[] | ((origin: string) => string | null);

	if (isProduction) {
		allowedOrigins = origins || [];
	} else {
		// In development, if origins are provided, use them; otherwise allow all
		if (origins && origins.length > 0) {
			allowedOrigins = origins;
		} else {
			// Allow all origins in development 
			// Return the origin itself to allow it
			allowedOrigins = (origin: string) => origin;
		}
	}

	return cors({
		origin: allowedOrigins,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
		allowHeaders: [
			"Content-Type",
			"Authorization",
			"X-CSRF-Token",
			"X-Session-Id",
			"X-User-Id",
		],
		credentials: true,
		maxAge: 86400, // Cache preflight for 1 day
	});
}
