import { z } from "zod";

/**
 * Server environment variable schemas
 * Defines validation rules for all server-side environment variables
 */
export const serverSchema = {
	/**
	 * Node environment - determines the runtime environment
	 * @default "development"
	 */
	NODE_ENV: z
		.enum(["development", "production", "test"], {
			error: "NODE_ENV must be one of: 'development', 'production', or 'test'",
		})
		.default("development"),

	/**
	 * Server port number - optional, defaults to platform default
	 * Validates port range (1-65535)
	 */
	PORT: z
		.string()
		.regex(/^\d+$/, { error: "PORT must be a numeric string" })
		.transform((val) => Number.parseInt(val, 10))
		.pipe(
			z
				.number()
				.int({ error: "PORT must be an integer" })
				.min(1, { error: "PORT must be at least 1" })
				.max(65535, { error: "PORT must be at most 65535" }),
		)
		.optional(),

	/**
	 * CORS origins - Comma-separated list of allowed origins for cross-origin requests
	 * Each origin must be a valid URL format
	 * Example: "https://example.com,https://app.example.com,http://localhost:3000"
	 */
	CORS_ORIGINS: z
		.string()
		.min(1, { error: "CORS_ORIGINS must be a non-empty string" })
		.transform((val) => val.split(",").map((origin) => origin.trim()))
		.pipe(
			z
				.array(z.url({ error: "Each CORS origin must be a valid URL" }))
				.min(1, { error: "CORS_ORIGINS must contain at least one valid URL" }),
		)
		.optional(),

	/**
	 * Database connection URL
	 * Must be a non-empty string
	 */
	DATABASE_URL: z
		.string()
		.min(1, { error: "DATABASE_URL must be a non-empty string" })
		.optional(),

	/**
	 * Log level - determines the verbosity of logging
	 * @default "debug" in development, "info" in production
	 */
	LOG_LEVEL: z
		.enum(["debug", "info", "warn", "error"], {
			error: "LOG_LEVEL must be one of: 'debug', 'info', 'warn', or 'error'",
		})
		.optional(),

	/**
	 * Log destination - determines where logs are written
	 * @default "both" (console + files)
	 */
	LOG_TO_FILE: z
		.enum(["console", "file", "both", "auto"], {
			error: "LOG_TO_FILE must be one of: 'console', 'file', 'both', or 'auto'",
		})
		.optional(),

	/**
	 * Compression encoding - determines the compression algorithm to use
	 * Note: Hono's compress middleware supports 'gzip' and 'deflate' only
	 * @default "gzip"
	 */
	COMPRESSION_ENCODING: z
		.enum(["gzip", "deflate"], {
			error: "COMPRESSION_ENCODING must be one of: 'gzip' or 'deflate'",
		})
		.optional(),

	/**
	 * Compression threshold - minimum response size in bytes to compress
	 * @default 1024 (1KB)
	 */
	COMPRESSION_THRESHOLD: z
		.string()
		.regex(/^\d+$/, { error: "COMPRESSION_THRESHOLD must be a numeric string" })
		.transform((val) => Number.parseInt(val, 10))
		.pipe(
			z
				.number()
				.int({ error: "COMPRESSION_THRESHOLD must be an integer" })
				.min(0, { error: "COMPRESSION_THRESHOLD must be at least 0" }),
		)
		.optional(),

	/**
	 * OpenAI API Key - Required for AI Companion functionality
	 */
	OPENAI_API_KEY: z
		.string()
		.min(1, { error: "OPENAI_API_KEY must be a non-empty string" }),

		/**
		 * OpenAI API Base URL - Base URL for OpenAI API
		 * Set to https://eu.api.openai.com/v1 for EU data residency
		 * @default "https://eu.api.openai.com/v1"
	  */
	OPENAI_BASE_URL: z
		.url({ error: "OPENAI_BASE_URL must be a valid URL" })
		.default("https://eu.api.openai.com/v1")
		.optional(),

	/**
	 * Aware API Base URL - Base URL for the Aware staging API
	 * @default "https://staging.aware.app"
	 */
	AWARE_API_BASE_URL: z
		.url({ error: "AWARE_API_BASE_URL must be a valid URL" })
		.default("https://staging.aware.app"),

	/**
	 * OpenAI Model - Model to use for AI agents
	 * @default "gpt-5-mini"
	 */
	OPENAI_MODEL: z
		.string()
		.min(1, { error: "OPENAI_MODEL must be a non-empty string" })
		.default("gpt-5-mini"),

	/**
	 * Agent Max Turns - Maximum number of turns the agent can take
	 * Prevents runaway loops
	 * @default 5
	 */
	AGENT_MAX_TURNS: z
		.string()
		.regex(/^\d+$/, { error: "AGENT_MAX_TURNS must be a numeric string" })
		.transform((val) => Number.parseInt(val, 10))
		.pipe(
			z
				.number()
				.int({ error: "AGENT_MAX_TURNS must be an integer" })
				.min(1, { error: "AGENT_MAX_TURNS must be at least 1" })
				.max(20, { error: "AGENT_MAX_TURNS must be at most 20" }),
		)
		.optional(),

	/**
	 * Use Nested Agents - Whether to use nested expert agents (higher quality, more API calls)
	 * When false, uses optimized single-agent structure (fewer API calls, good quality)
	 * @default false (optimized mode for low rate limits)
	 */
	USE_NESTED_AGENTS: z
		.string()
		.transform((val) => val === "true" || val === "1")
		.pipe(z.boolean())
		.default(false),

	/**
	 * AWS credentials for DynamoDB.
	 * These are scoped only to the aware-llm service and should have
	 * least-privilege permissions for the chat history table.
	 */
	ACCESS_KEY: z
		.string()
		.min(1, { error: "ACCESS_KEY must be a non-empty string" })
		.optional(),
	SECRET_ACCESS_KEY: z
		.string()
		.min(1, { error: "SECRET_ACCESS_KEY must be a non-empty string" })
		.optional(),
	REGION: z
		.string()
		.min(1, { error: "REGION must be a non-empty string" })
		.optional(),

	/**
	 * Optional override for the DynamoDB table name used for chat history.
	 * Defaults to `aware-chat` when not provided.
	 */
	DYNAMODB_TABLE_NAME: z
		.string()
		.min(1, { error: "DYNAMODB_TABLE_NAME must be a non-empty string" })
		.optional(),

	/**
	 * Admin credentials for internal debugging endpoints.
	 * Temporary basic-auth guard until full auth is wired in.
	 */
	ADMIN_USERNAME: z
		.string()
		.min(1, { error: "ADMIN_USERNAME must be a non-empty string" })
		.optional(),
	ADMIN_PASSWORD: z
		.string()
		.min(12, {
			error:
				"ADMIN_PASSWORD must be at least 12 characters. Use a strong random value.",
		})
		.optional(),

	/**
	 * Feature flag to toggle persistent DynamoDB-backed storage.
	 * Defaults to true; set to "false" or "0" to use in-memory session only.
	 */
	USE_PERSISTENT_STORAGE: z
		.string()
		.default("true")
		.transform((val) => val === "true" || val === "1")
		.pipe(z.boolean()),

	/**
	 * DynamoDB endpoint URL for local development (e.g. http://localhost:8000).
	 * When set, the client uses this instead of AWS.
	 */
	DYNAMODB_ENDPOINT: z
		.string()
		.optional()
		.transform((v) => (v === "" ? undefined : v))
		.pipe(z.url().optional()),
} as const;
