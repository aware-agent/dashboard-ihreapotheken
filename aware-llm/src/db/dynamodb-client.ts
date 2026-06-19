import {
	DynamoDBClient,
	type DynamoDBClientConfig,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { env } from "../env/index.js";
import { logger } from "../utils/logger.js";

/**
 * Name of the DynamoDB table used for chat history and logs.
 * Defaults to `aware-chat` but can be overridden via env.
 */
export const CHAT_TABLE_NAME = env.DYNAMODB_TABLE_NAME ?? "aware-chat";

let rawClient: DynamoDBClient | null = null;
let documentClient: DynamoDBDocumentClient | null = null;

function createDynamoClient(): DynamoDBClient {
	const baseConfig: DynamoDBClientConfig = {};

	if (env.REGION) {
		baseConfig.region = env.REGION;
	}

	if (env.DYNAMODB_ENDPOINT) {
		baseConfig.endpoint = env.DYNAMODB_ENDPOINT;
	}

	// Only configure explicit credentials if provided; otherwise fall back to
	// the default SDK credential provider chain (IAM role, shared config, etc.).
	if (env.ACCESS_KEY && env.SECRET_ACCESS_KEY) {
		baseConfig.credentials = {
			accessKeyId: env.ACCESS_KEY,
			secretAccessKey: env.SECRET_ACCESS_KEY,
		};
	}

	logger.info("Initializing DynamoDB client for chat persistence", {
		tableName: CHAT_TABLE_NAME,
		hasExplicitRegion: !!baseConfig.region,
		usingExplicitCredentials: !!baseConfig.credentials,
	});

	return new DynamoDBClient(baseConfig);
}

/**
 * Lazily initialized low-level DynamoDB client.
 */
export function getDynamoClient(): DynamoDBClient {
	if (!rawClient) {
		rawClient = createDynamoClient();
	}
	return rawClient;
}

/**
 * Lazily initialized document-oriented DynamoDB client.
 * This is what application code should usually use.
 */
export function getDocumentClient(): DynamoDBDocumentClient {
	if (!documentClient) {
		documentClient = DynamoDBDocumentClient.from(getDynamoClient());
	}
	return documentClient;
}

