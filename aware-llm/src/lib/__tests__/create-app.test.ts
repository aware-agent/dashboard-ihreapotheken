import { beforeAll, describe, expect, it } from "bun:test";

beforeAll(() => {
	// Minimal required env vars for app bootstrap
	process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "test-openai-key-1234567890";
	process.env.AWARE_API_BASE_URL =
		process.env.AWARE_API_BASE_URL ?? "https://staging.aware.app";
	process.env.OPENAI_BASE_URL =
		process.env.OPENAI_BASE_URL ?? "https://eu.api.openai.com/v1";
});

describe("createApp", () => {
	it("creates a Hono app that responds on /api/v1", async () => {
		const { default: app } = await import("../../index.js");

		const response = await app.request("/api/v1");

		expect(response.status).toBe(200);
		const text = await response.text();
		expect(typeof text).toBe("string");
	});
});

