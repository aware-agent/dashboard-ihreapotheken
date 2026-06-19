import type { MiddlewareHandler } from "hono";
import { secureHeaders as honoSecureHeaders } from "hono/secure-headers";
import { env } from "../env/index.js";

/**
 * Secure headers configuration options
 * Wraps Hono's secure headers with environment-aware defaults
 */
export interface SecureHeadersOptions {
	/**
	 * Enable Content-Security-Policy in production
	 * @default true in production, false in development
	 */
	enableCSP?: boolean;

	/**
	 * Custom CSP configuration
	 * Only applied if enableCSP is true
	 */
	contentSecurityPolicy?: {
		defaultSrc?: string[];
		scriptSrc?: string[];
		styleSrc?: string[];
		imgSrc?: string[];
		connectSrc?: string[];
		fontSrc?: string[];
		frameSrc?: string[];
		objectSrc?: string[];
		baseUri?: string[];
		childSrc?: string[];
		formAction?: string[];
		frameAncestors?: string[];
		manifestSrc?: string[];
		mediaSrc?: string[];
		workerSrc?: string[];
		[key: string]: unknown;
	};
}

/**
 * Creates secure headers middleware using Hono's built-in secure headers
 *
 * Hono's secure headers middleware provides:
 * - 20+ security headers (X-Frame-Options, X-XSS-Protection, HSTS, etc.)
 * - Cross-Origin policies (Embedder, Resource, Opener)
 * - DNS prefetch control, download options
 * - Removes X-Powered-By header
 * - Full CSP support with nonce generation
 * - CSP reporting endpoints
 * - Trusted Types support
 * - Flexible Permissions-Policy configuration
 *
 * @param options - Configuration options
 * @returns Secure headers middleware
 */
export function createSecureHeadersMiddleware(
	options: SecureHeadersOptions = {},
): MiddlewareHandler {
	const { enableCSP, contentSecurityPolicy } = options;
	const isProduction = env.NODE_ENV === "production";

	// Configure secure headers with production-ready defaults
	const shouldEnableCSP = enableCSP ?? isProduction;

	return honoSecureHeaders({
		// Override X-Frame-Options to DENY (more secure than default SAMEORIGIN)
		xFrameOptions: "DENY",

		// Override X-XSS-Protection to block mode (more secure than default 0)
		xXssProtection: "1; mode=block",

		// Content-Security-Policy: Only in production by default
		contentSecurityPolicy: shouldEnableCSP
			? {
					defaultSrc: contentSecurityPolicy?.defaultSrc || ["'self'"],
					scriptSrc: contentSecurityPolicy?.scriptSrc || ["'self'"],
					styleSrc: contentSecurityPolicy?.styleSrc || [
						"'self'",
						"'unsafe-inline'",
					],
					imgSrc: contentSecurityPolicy?.imgSrc || [
						"'self'",
						"data:",
						"https:",
					],
					connectSrc: contentSecurityPolicy?.connectSrc || ["'self'"],
					fontSrc: contentSecurityPolicy?.fontSrc || ["'self'", "data:"],
					frameSrc: contentSecurityPolicy?.frameSrc || ["'self'"],
					objectSrc: contentSecurityPolicy?.objectSrc || ["'none'"],
					...contentSecurityPolicy,
				}
			: undefined,

		// Strict-Transport-Security: Only in production
		strictTransportSecurity: isProduction
			? "max-age=31536000; includeSubDomains"
			: false,

		// Permissions-Policy: Restrict sensitive features
		permissionsPolicy: {
			geolocation: [],
			microphone: [],
			camera: [],
			payment: [],
		},
	});
}

/**
 * Default secure headers middleware with production-ready configuration
 * Uses Hono's built-in secure headers with optimal security settings
 */
export const secureHeaders = createSecureHeadersMiddleware();
