import { Hono } from "hono";
import packageJSON from "../package.json" with { type: "json" };
import { env } from "./env/index.js";
import { createApp } from "./lib/create-app.js";
import { configureOpenAPI } from "./lib/openapi.js";
import routes from "./routes/index.js";
import { logger } from "./utils/logger.js";

const __vercelHonoDetection__ = Hono;

const isProduction = env.NODE_ENV === "production";
const isDevelopment = env.NODE_ENV === "development";

// Create API app (no basePath - we'll mount it with basePath)
const apiApp = createApp();

// Register all routes
apiApp.route("/", routes);

// Configure OpenAPI (must be after routes so it can scan them)
// Docs and OpenAPI spec should not be exposed in production
if (!isProduction) {
	configureOpenAPI(apiApp);
}

// Create main app and mount API app with basePath
const app = createApp();
app.route("/api/v1", apiApp);

// Root route handler - provides API information
app.get("/", (c) => {
	const apiInfo: { basePath: string; docs?: string; openapi?: string } = {
		basePath: "/api/v1",
	};

	if (!isProduction) {
		apiInfo.docs = "/api/v1/doc";
		apiInfo.openapi = "/api/v1/openapi.json";
	}

	return c.json(
		{
			name: "Aware LLM API",
			version: packageJSON.version,
			status: "running",
			api: apiInfo,
		},
		200,
	);
});

// Determine the port
const port = env.PORT || 3000;

// Log server startup information
const url = `http://localhost:${port}`;
const apiUrl = `${url}/api/v1`;
const docUrl = `${apiUrl}/doc`;

if (isDevelopment) {
	logger.info("🚀 Server starting", {
		version: packageJSON.version,
		environment: env.NODE_ENV,
		port,
		url,
		apiUrl,
		docUrl,
		basePath: "/api/v1",
	});
	// console.log(`\n✨ Server running at ${url}`);
	// console.log(`📡 API available at ${apiUrl}`);
	// console.log(`📚 OpenAPI docs at ${docUrl}\n`);
} else {
	// Production: minimal logging, no sensitive info
	logger.info("Server starting", {
		version: packageJSON.version,
		environment: env.NODE_ENV,
		port,
	});
}

export default app;

export type { AppType } from "./lib/types.js";
