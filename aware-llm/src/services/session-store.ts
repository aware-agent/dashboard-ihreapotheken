import type { AgentInputItem, Session } from "@openai/agents-core";
import { randomUUID } from "@openai/agents-core/_shims";
import { logger } from "../utils/logger.js";

/**
 * Session entry with metadata
 */
interface SessionEntry {
	items: AgentInputItem[];
	createdAt: number;
	updatedAt: number;
}

/**
 * Session expiry time (24 hours in milliseconds)
 */
const SESSION_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Maximum items to keep per session
 */
const MAX_SESSION_ITEMS = 50;

/**
 * In-memory session store implementation
 * For production, replace with Redis or database
 */
export class InMemorySessionStore {
	private sessions = new Map<string, SessionEntry>();

	/**
	 * Load session items for a given session ID
	 */
	async load(sessionId: string): Promise<AgentInputItem[]> {
		const entry = this.sessions.get(sessionId);

		if (!entry) {
			logger.debug("Session not found, returning empty", { sessionId });
			return [];
		}

		// Check if session has expired
		if (Date.now() - entry.updatedAt > SESSION_TTL_MS) {
			this.sessions.delete(sessionId);
			logger.debug("Session expired", { sessionId });
			return [];
		}

		logger.debug("Session loaded", {
			sessionId,
			itemCount: entry.items.length,
		});

		return entry.items;
	}

	/**
	 * Save session items for a given session ID
	 */
	async save(sessionId: string, items: AgentInputItem[]): Promise<void> {
		const now = Date.now();
		const existingEntry = this.sessions.get(sessionId);

		// Truncate to max items (keep most recent)
		const truncatedItems =
			items.length > MAX_SESSION_ITEMS
				? items.slice(-MAX_SESSION_ITEMS)
				: items;

		const entry: SessionEntry = {
			items: truncatedItems,
			createdAt: existingEntry?.createdAt ?? now,
			updatedAt: now,
		};

		this.sessions.set(sessionId, entry);

		logger.debug("Session saved", {
			sessionId,
			itemCount: truncatedItems.length,
			truncated: items.length > MAX_SESSION_ITEMS,
		});
	}

	/**
	 * Clear a session
	 */
	async clear(sessionId: string): Promise<void> {
		this.sessions.delete(sessionId);
		logger.debug("Session cleared", { sessionId });
	}

	/**
	 * Get session count (for monitoring)
	 */
	getSessionCount(): number {
		return this.sessions.size;
	}

	/**
	 * Cleanup expired sessions
	 * Call periodically to prevent memory leaks
	 */
	cleanupExpiredSessions(): number {
		const now = Date.now();
		let cleanedCount = 0;

		for (const [sessionId, entry] of this.sessions.entries()) {
			if (now - entry.updatedAt > SESSION_TTL_MS) {
				this.sessions.delete(sessionId);
				cleanedCount++;
			}
		}

		if (cleanedCount > 0) {
			logger.info("Cleaned up expired sessions", { count: cleanedCount });
		}

		return cleanedCount;
	}
}

/**
 * Session implementation that uses InMemorySessionStore for persistence.
 * This adapts our existing per-session storage to the Agents SDK Session interface.
 */
export class AwareSession implements Session {
	private readonly sessionId: string;

	constructor(
		private readonly store: InMemorySessionStore,
		options: { sessionId?: string } = {},
	) {
		this.sessionId = options.sessionId ?? randomUUID();
	}

	async getSessionId(): Promise<string> {
		return this.sessionId;
	}

	async getItems(limit?: number): Promise<AgentInputItem[]> {
		const items = await this.store.load(this.sessionId);
		// Never replay internal reasoning items back to the API.
		// These can require paired follower items and can break if stored/replayed.
		const filtered = items.filter(
			(item) => !("type" in item && item.type === "reasoning"),
		);

		if (limit === undefined) {
			return filtered.map((item) => structuredClone(item));
		}

		if (limit <= 0) {
			return [];
		}

		const start = Math.max(filtered.length - limit, 0);
		return filtered.slice(start).map((item) => structuredClone(item));
	}

	async addItems(items: AgentInputItem[]): Promise<void> {
		if (items.length === 0) {
			return;
		}

		const existing = await this.store.load(this.sessionId);
		// Never persist internal reasoning items.
		const safeNew = items.filter(
			(item) => !("type" in item && item.type === "reasoning"),
		);
		if (safeNew.length === 0) return;
		const clonedNew = safeNew.map((item) => structuredClone(item));
		await this.store.save(this.sessionId, [...existing, ...clonedNew]);
	}

	async popItem(): Promise<AgentInputItem | undefined> {
		const items = await this.store.load(this.sessionId);

		if (items.length === 0) {
			return undefined;
		}

		const last = items[items.length - 1];
		await this.store.save(this.sessionId, items.slice(0, -1));
		return structuredClone(last);
	}

	async clearSession(): Promise<void> {
		await this.store.clear(this.sessionId);
	}
}

/**
 * Helper to create a Session instance for a given logical session ID.
 * The same sessionId will reuse the underlying stored items via InMemorySessionStore.
 */
export function createSession(sessionId?: string): Session {
	return new AwareSession(sessionStore, { sessionId });
}

/**
 * Custom session input callback
 * Merges session history with new input, keeping only recent messages
 */
export function sessionInputCallback(
	history: AgentInputItem[],
	newInput: AgentInputItem[],
): AgentInputItem[] {
	// Keep last 20 history items plus all new input
	const recentHistory = history.slice(-20);

	logger.debug("Merging session history with new input", {
		historyCount: history.length,
		recentHistoryCount: recentHistory.length,
		newInputCount: newInput.length,
	});

	return [...recentHistory, ...newInput];
}

/**
 * Global session store instance
 * For production, replace with Redis-backed implementation
 */
export const sessionStore = new InMemorySessionStore();

/**
 * Start periodic cleanup of expired sessions
 * @param intervalMs Cleanup interval in milliseconds (default: 1 hour)
 */
export function startSessionCleanup(intervalMs = 60 * 60 * 1000): NodeJS.Timer {
	return setInterval(() => {
		sessionStore.cleanupExpiredSessions();
	}, intervalMs);
}
