import "dotenv/config";
import { createEnv } from "@t3-oss/env-core";
import { serverSchema } from "./schema.js";

/**
 * Validated server environment variables
 * Throws an error at runtime if any required variables are missing or invalid
 */
export const env = createEnv({
	server: serverSchema,
	runtimeEnv: process.env,
	emptyStringAsUndefined: true,
});
