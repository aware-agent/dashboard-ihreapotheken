import { describe, expect, it } from "bun:test";
import root from "../root.js";

describe("root route", () => {
	it("returns Hello World with 200 status", async () => {
		const response = await root.request("/");

		expect(response.status).toBe(200);
		const body = await response.text();
		expect(body).toBe("Hello World");
	});
});

