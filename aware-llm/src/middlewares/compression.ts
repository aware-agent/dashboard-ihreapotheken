import { compress } from "hono/compress";
import { env } from "../env/index.js";
import { setupCompressionPolyfill } from "../utils/compression.js";

// Setup compression polyfill if needed
setupCompressionPolyfill();

/**
 * Compression middleware factory
 * Creates compression middleware with configured encoding and threshold
 * Note: Hono's compress middleware supports 'gzip' and 'deflate' only
 * @returns Compression middleware
 */
export function createCompressionMiddleware() {
	// Compression encoding (default: gzip)
	// Hono supports: 'gzip' | 'deflate'
	const encoding = (env.COMPRESSION_ENCODING || "gzip") as "gzip" | "deflate";

	// Compression threshold in bytes (default: 1024 = 1KB)
	const threshold = env.COMPRESSION_THRESHOLD || 1024;

	return compress({
		encoding,
		threshold,
	});
}
