import type { Context, MiddlewareHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { getClientIp } from "../utils/ip.js";
import { logger } from "../utils/logger.js";

/**
 * Rate limit entry stored in memory
 */
interface RateLimitEntry {
	count: number;
	resetTime: number;
}

/**
 * In-memory store for rate limiting
 * Note: Use Redis in production for distributed systems
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Last cleanup timestamp
 */
let lastCleanup = Date.now();

/**
 * Cleanup interval in milliseconds (5 minutes)
 */
const CLEANUP_INTERVAL = 5 * 60 * 1000;

/**
 * Cleans up expired entries from the rate limit store
 * Uses lazy cleanup - only runs when needed and enough time has passed
 */
function cleanupExpiredEntries(): void {
	const now = Date.now();

	// Only cleanup if enough time has passed since last cleanup
	if (now - lastCleanup < CLEANUP_INTERVAL) {
		return;
	}

	lastCleanup = now;
	let cleaned = 0;

	for (const [key, entry] of rateLimitStore.entries()) {
		if (entry.resetTime < now) {
			rateLimitStore.delete(key);
			cleaned++;
		}
	}

	if (cleaned > 0) {
		logger.debug("Rate limit cleanup", {
			cleaned,
			remaining: rateLimitStore.size,
		});
	}
}

/**
 * Rate limit configuration options
 */
export interface RateLimitOptions {
	/**
	 * Time window in milliseconds
	 * @default 60000 (1 minute)
	 */
	windowMs?: number;

	/**
	 * Maximum number of requests per window
	 * @default 100
	 */
	max?: number;

	/**
	 * Error message when rate limit is exceeded
	 * @default "Too many requests, please try again later."
	 */
	message?: string;

	/**
	 * Prefix for the rate limit key to isolate different limiters
	 * @default "default"
	 */
	keyPrefix?: string;

	/**
	 * Custom key generator function
	 * @default Uses client IP address
	 */
	keyGenerator?: (c: Context) => string;

	/**
	 * Skip rate limiting if this function returns true
	 * Useful for bypassing rate limits for certain conditions
	 */
	skip?: (c: Context) => boolean;

	/**
	 * Whether to skip rate limiting in development
	 * @default false
	 */
	skipInDevelopment?: boolean;
}

/**
 * Creates a rate limiting middleware
 * @param options - Configuration options
 * @returns Rate limiting middleware
 */
export function createRateLimitMiddleware(
	options: RateLimitOptions = {},
): MiddlewareHandler {
	const {
		windowMs = 60 * 1000, // 1 minute default
		max = 100, // 100 requests per minute default
		message = "Too many requests, please try again later.",
		keyPrefix = "default",
		keyGenerator = (c: Context) => getClientIp(c),
		skip,
		skipInDevelopment = false,
	} = options;

	return async (c: Context, next) => {
		// Skip rate limiting if configured
		if (skipInDevelopment && process.env.NODE_ENV === "development") {
			return next();
		}

		if (skip?.(c)) {
			return next();
		}

		// Periodic cleanup (lazy)
		cleanupExpiredEntries();

		// Generate rate limit key
		const key = `${keyPrefix}:${keyGenerator(c)}`;
		const now = Date.now();
		let entry = rateLimitStore.get(key);

		if (!entry || entry.resetTime < now) {
			// Create new entry or reset expired entry
			entry = {
				count: 1,
				resetTime: now + windowMs,
			};
			rateLimitStore.set(key, entry);
		} else {
			// Increment counter
			entry.count++;

			if (entry.count > max) {
				const retryAfter = Math.ceil((entry.resetTime - now) / 1000);

				// Log rate limit violation
				logger.warn("Rate limit exceeded", {
					key,
					count: entry.count,
					max,
					retryAfter,
					path: c.req.path,
					method: c.req.method,
				});

				// Set rate limit headers
				c.header("Retry-After", String(retryAfter));
				c.header("X-RateLimit-Limit", String(max));
				c.header("X-RateLimit-Remaining", "0");
				c.header(
					"X-RateLimit-Reset",
					String(Math.ceil(entry.resetTime / 1000)),
				);

				throw new HTTPException(429, { message });
			}
		}

		// Add rate limit headers to successful requests
		c.header("X-RateLimit-Limit", String(max));
		c.header("X-RateLimit-Remaining", String(Math.max(0, max - entry.count)));
		c.header("X-RateLimit-Reset", String(Math.ceil(entry.resetTime / 1000)));

		return next();
	};
}

/**
 * Strict rate limiter for sensitive endpoints (login, register, password reset)
 * 5 requests per 15 minutes
 */
export const strictRateLimit = createRateLimitMiddleware({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 5, // 5 requests per 15 minutes
	message: "Too many attempts, please try again after 15 minutes.",
	keyPrefix: "strict",
});

/**
 * Standard rate limiter for general API endpoints
 * 60 requests per minute
 */
export const standardRateLimit = createRateLimitMiddleware({
	windowMs: 60 * 1000, // 1 minute
	max: 60, // 60 requests per minute
	message: "Too many requests, please slow down.",
	keyPrefix: "standard",
});

/**
 * Lenient rate limiter for public endpoints
 * 100 requests per minute
 */
export const lenientRateLimit = createRateLimitMiddleware({
	windowMs: 60 * 1000, // 1 minute
	max: 100, // 100 requests per minute
	message: "Too many requests, please try again later.",
	keyPrefix: "lenient",
});
