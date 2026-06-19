/**
 * Decode JWT payload without verification (for reading claims like 'sub').
 * The token is already trusted by the caller (from AuthContext).
 */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    let payload = parts[1];
    // Convert base64url to base64
    payload = payload.replace(/-/g, '+').replace(/_/g, '/');
    // Add padding if needed
    const pad = payload.length % 4;
    if (pad) payload += '='.repeat(4 - pad);
    
    const decoded = atob(payload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Extract user ID (sub) from JWT token.
 * Returns null if token is invalid or sub is missing.
 */
export function getUserIdFromToken(token: string | null): string | null {
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  const sub = payload?.sub;
  return typeof sub === 'string' && sub.length > 0 ? sub : null;
}
