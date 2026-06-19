import { Scalar } from "@scalar/hono-api-reference";
import type { Hono } from "hono";
import { openAPIRouteHandler } from "hono-openapi";
import packageJSON from "../../package.json" with { type: "json" };

/**
 * Configure OpenAPI documentation for the application
 * @param app - Hono application instance
 */
export function configureOpenAPI(app: Hono) {
	// OpenAPI JSON endpoint - serves the OpenAPI spec as JSON
	// This scans all routes with describeRoute and generates the OpenAPI spec
	app.get(
		"/openapi.json",
		openAPIRouteHandler(app, {
			documentation: {
				info: {
					version: packageJSON.version,
					title: "Aware LLM API",
					description: "API documentation for Aware LLM backend",
				},
				servers: [
					{
						url: "http://localhost:3000/api/v1",
						description: "Development server",
					},
					// {
					//   url: "https://api.example.com/api/v1",
					//   description: "Production server",
					// },
				],
			},
		}),
	);

	// Scalar API Reference UI - serves the interactive documentation
	// Points to the OpenAPI JSON endpoint
	app.get(
		"/doc",
		Scalar({
			url: "/api/v1/openapi.json",
			theme: "kepler",
			layout: "modern",
			defaultHttpClient: {
				targetKey: "js",
				clientKey: "axios",
			},
		}),
	);
}
