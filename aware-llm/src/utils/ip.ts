import type { Context } from "hono";

/**
 * Validates if a string is a valid IP address (IPv4 or IPv6)
 * @param ip - IP address string to validate
 * @returns true if valid IP address, false otherwise
 */
function isValidIp(ip: string): boolean {
	if (!ip || ip.trim() === "") {
		return false;
	}

	// IPv4 regex
	const ipv4Regex =
		/^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

	// IPv6 regex (simplified - covers most cases)
	const ipv6Regex =
		/^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^([0-9a-fA-F]{1,4}:)*::([0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;

	return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Extracts and validates the first valid IP from a comma-separated list
 * @param headerValue - Comma-separated list of IP addresses
 * @returns First valid IP address or null
 */
function extractFirstValidIp(headerValue: string): string | null {
	if (!headerValue) {
		return null;
	}

	const ips = headerValue
		.split(",")
		.map((ip) => ip.trim())
		.filter((ip) => ip.length > 0);

	for (const ip of ips) {
		if (isValidIp(ip)) {
			return ip;
		}
	}

	// If no valid IP found, return the first one anyway (might be a proxy format)
	return ips[0] || null;
}

/**
 * Gets the client IP address from the request headers
 * Checks headers in order of priority:
 * 1. CF-Connecting-IP (Cloudflare)
 * 2. X-Forwarded-For (standard proxy header)
 * 3. X-Real-IP (nginx and other proxies)
 * 4. X-Client-IP (some proxies)
 * 5. True-Client-IP (Akamai and Cloudflare)
 * 6. X-Forwarded (older standard)
 * 7. Forwarded-For (older standard)
 *
 * @param c - Hono context
 * @returns Client IP address or 'unknown' if not found
 */
export function getClientIp(c: Context): string {
	// Cloudflare header (highest priority)
	const cfIp = c.req.header("cf-connecting-ip");
	if (cfIp && isValidIp(cfIp)) {
		return cfIp;
	}

	// Standard proxy header (X-Forwarded-For)
	const forwardedFor = c.req.header("x-forwarded-for");
	if (forwardedFor) {
		const ip = extractFirstValidIp(forwardedFor);
		if (ip) {
			return ip;
		}
	}

	// Nginx and other proxies
	const realIp = c.req.header("x-real-ip");
	if (realIp && isValidIp(realIp)) {
		return realIp;
	}

	// Some proxy servers
	const clientIp = c.req.header("x-client-ip");
	if (clientIp && isValidIp(clientIp)) {
		return clientIp;
	}

	// Akamai and Cloudflare alternative
	const trueClientIp = c.req.header("true-client-ip");
	if (trueClientIp && isValidIp(trueClientIp)) {
		return trueClientIp;
	}

	// Older standard headers
	const forwarded = c.req.header("x-forwarded");
	if (forwarded) {
		const ip = extractFirstValidIp(forwarded);
		if (ip) {
			return ip;
		}
	}

	const forwardedForOld = c.req.header("forwarded-for");
	if (forwardedForOld) {
		const ip = extractFirstValidIp(forwardedForOld);
		if (ip) {
			return ip;
		}
	}

	// Fallback to unknown if no valid IP found
	return "unknown";
}
