import type { MiddlewareHandler } from "hono";
import { timing } from "hono/timing";
import { env } from "../env/index.js";

/**
 * Server-Timing middleware configuration
 * Adds performance metrics to response headers for monitoring
 */
export interface ServerTimingOptions {
	/**
	 * Show total response time in Server-Timing header
	 * @default true
	 */
	total?: boolean;

	/**
	 * Enable/disable Server-Timing headers
	 * Can be a function for conditional enabling
	 * @default true in production, false in development
	 */
	enabled?: boolean | ((c: Parameters<MiddlewareHandler>[0]) => boolean);

	/**
	 * Description for total response time
	 * @default "Total Response Time"
	 */
	totalDescription?: string;

	/**
	 * Auto-end timers at request end
	 * @default true
	 */
	autoEnd?: boolean;

	/**
	 * Cross-origin timing access (Timing-Allow-Origin header)
	 * @default false
	 */
	crossOrigin?:
		| boolean
		| string
		| ((c: Parameters<MiddlewareHandler>[0]) => boolean | string);
}

/**
 * Creates Server-Timing middleware using Hono's built-in timing
 *
 * Benefits:
 * - Performance metrics in response headers (Server-Timing)
 * - Track specific operations (DB queries, external APIs, etc.)
 * - Identify bottlenecks in request processing
 * - Useful for monitoring and debugging performance issues
 *
 * Usage in handlers:
 * ```ts
 * import { setMetric, startTime, endTime } from 'hono/timing'
 *
 * // Add custom metric
 * setMetric(c, 'region', 'europe-west3')
 *
 * // Time an operation
 * startTime(c, 'db')
 * await db.query(...)
 * endTime(c, 'db')
 * ```
 *
 * Response header example:
 * ```
 * Server-Timing: total;desc="Total Response Time",db;dur=50,region;desc="europe-west3"
 * ```
 *
 * Note: Only enable in production or when actively monitoring performance
 *
 * @param options - Configuration options
 * @returns Server-Timing middleware
 */
export function createServerTimingMiddleware(
	options: ServerTimingOptions = {},
): MiddlewareHandler | null {
	const isProduction = env.NODE_ENV === "production";

	// Default: only enable in production
	const enabled = options.enabled ?? isProduction;

	if (enabled === false) {
		return null;
	}

	return timing({
		total: options.total ?? true,
		enabled: enabled === true ? true : options.enabled,
		totalDescription: options.totalDescription,
		autoEnd: options.autoEnd ?? true,
		crossOrigin: options.crossOrigin ?? false,
	});
}

/**
 * Default Server-Timing middleware
 * Only enabled in production by default
 *
 * To use in development, explicitly enable:
 * ```ts
 * const timingMiddleware = createServerTimingMiddleware({ enabled: true })
 * ```
 */
export const serverTimingMiddleware = createServerTimingMiddleware();

export type { TimingVariables } from "hono/timing";
/**
 * Re-export timing utilities for use in handlers
 */
export { endTime, setMetric, startTime } from "hono/timing";
