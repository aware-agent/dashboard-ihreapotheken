import { describe, expect, it } from "bun:test";
import { serverSchema } from "../schema.js";

describe("serverSchema", () => {
	it("rejects missing required OPENAI_API_KEY", () => {
		const schema = serverSchema.OPENAI_API_KEY;

		expect(() => schema.parse("")).toThrow();
	});

	it("accepts valid OPENAI_API_KEY", () => {
		const schema = serverSchema.OPENAI_API_KEY;

		expect(() => schema.parse("test-openai-key-1234567890")).not.toThrow();
	});

	it("parses AGENT_MAX_TURNS from string to number within range", () => {
		const schema = serverSchema.AGENT_MAX_TURNS;

		const value = schema.parse("5");
		expect(value).toBe(5);
	});
});

