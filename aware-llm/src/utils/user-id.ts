import { createHash } from "node:crypto";

const USER_ID_HASH_LENGTH = 32;

/**
 * Decodes a JWT payload without verification (payload only).
 * Use only for reading claims like `sub`; the token is already trusted by the caller.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
	const parts = token.split(".");
	if (parts.length !== 3) return null;
	try {
		let payload = parts[1];
		payload = payload.replace(/-/g, "+").replace(/_/g, "/");
		const pad = payload.length % 4;
		if (pad) payload += "=".repeat(4 - pad);
		const decoded = Buffer.from(payload, "base64").toString("utf8");
		return JSON.parse(decoded) as Record<string, unknown>;
	} catch {
		return null;
	}
}

/**
 * Derives a stable, opaque user ID from an access token for persistence.
 * Use when no JWT `sub` is available (e.g. opaque token).
 */
export function deriveUserIdFromToken(accessToken: string): string {
	const hash = createHash("sha256").update(accessToken, "utf8").digest("hex");
	return hash.slice(0, USER_ID_HASH_LENGTH);
}

/**
 * Returns the user ID for persistence: Auth0 JWT `sub` when present, otherwise
 * a stable hash of the token. Prefer `sub` so identity matches Auth0 and other services.
 */
export function getUserIdFromToken(accessToken: string): string {
	const payload = decodeJwtPayload(accessToken);
	const sub = payload?.sub;
	if (typeof sub === "string" && sub.length > 0) {
		return sub;
	}
	return deriveUserIdFromToken(accessToken);
}
