import { describeRoute, resolver } from "hono-openapi";
import { z } from "zod";
import { HTTP_STATUS } from "../lib/constants.js";
import { createRouter } from "../lib/create-app.js";

/**
 * Root route handler
 * Returns welcome message and API information
 */

// Create router
const app = createRouter();

// Define the route with OpenAPI metadata using hono-openapi
app.get(
	"/",
	describeRoute({
		tags: ["Root"],
		summary: "Root endpoint",
		description: "Returns a welcome message",
		responses: {
			[HTTP_STATUS.OK]: {
				description: "Welcome message",
				content: {
					"text/plain": {
						schema: resolver(z.string()),
						example: "Hello World",
					},
				},
			},
		},
	}),
	(c) => {
		return c.text("Hello World", HTTP_STATUS.OK);
	},
);

export default app;
