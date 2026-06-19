/**
 * Ensures the DynamoDB chat table exists (creates it if missing).
 * If the table exists but is missing required indexes, it will update the table.
 * Run against local DynamoDB (DYNAMODB_ENDPOINT from .env) or AWS.
 *
 * Usage:
 *   From repo root:    bun run db:ensure
 *   From aware-llm:    bun run db:ensure   or   bun ./scripts/ensure-table.ts
 */
import {
	CreateTableCommand,
	DescribeTableCommand,
	UpdateTableCommand,
	type TableStatus,
} from "@aws-sdk/client-dynamodb";
import "dotenv/config";
import { CHAT_TABLE_NAME, getDynamoClient } from "../src/db/dynamodb-client.js";

const client = getDynamoClient();

/**
 * Retrieves the current table description or null if it doesn't exist.
 */
async function getTableDescription() {
	try {
		const out = await client.send(
			new DescribeTableCommand({ TableName: CHAT_TABLE_NAME }),
		);
		return out.Table;
	} catch (err: unknown) {
		const name = err && typeof err === "object" && "name" in err ? err.name : "";
		if (name === "ResourceNotFoundException") return null;
		throw err;
	}
}

/**
 * Polls until the table and GSI1 (if present) are in ACTIVE status.
 */
async function waitForActive(): Promise<void> {
	for (let i = 0; i < 300; i++) {
		const table = await getTableDescription();
		const status = (table?.TableStatus ?? "UNKNOWN") as TableStatus;

		const gsi = table?.GlobalSecondaryIndexes?.find((g) => g.IndexName === "GSI1");
		const gsiStatus = gsi?.IndexStatus;

		// If GSI1 exists, it must also be ACTIVE.
		const isGsiReady = !gsi || gsiStatus === "ACTIVE";

		if (status === "ACTIVE" && isGsiReady) {
			console.log("Table and Index are ACTIVE.");
			return;
		}

		console.log(
			`Table status: ${status}, GSI1 status: ${gsiStatus ?? "N/A"}, waiting...`,
		);
		await new Promise((r) => setTimeout(r, 2000));
	}
	throw new Error("Table/Index did not become ACTIVE in time.");
}

/**
 * Creates the table with the base schema and GSI1.
 */
async function createTable(): Promise<void> {
	console.log(`Creating table: ${CHAT_TABLE_NAME}`);
	await client.send(
		new CreateTableCommand({
			TableName: CHAT_TABLE_NAME,
			AttributeDefinitions: [
				{ AttributeName: "PK", AttributeType: "S" },
				{ AttributeName: "SK", AttributeType: "S" },
				{ AttributeName: "GSI1PK", AttributeType: "S" },
				{ AttributeName: "GSI1SK", AttributeType: "S" },
			],
			KeySchema: [
				{ AttributeName: "PK", KeyType: "HASH" },
				{ AttributeName: "SK", KeyType: "RANGE" },
			],
			GlobalSecondaryIndexes: [
				{
					IndexName: "GSI1",
					KeySchema: [
						{ AttributeName: "GSI1PK", KeyType: "HASH" },
						{ AttributeName: "GSI1SK", KeyType: "RANGE" },
					],
					Projection: { ProjectionType: "ALL" },
				},
			],
			BillingMode: "PAY_PER_REQUEST",
		}),
	);
	console.log("CreateTable requested. Waiting for ACTIVE...");
	await waitForActive();
}

/**
 * Adds the GSI1 index to an existing table.
 */
async function addGSI1(): Promise<void> {
	console.log(`Adding missing GSI1 index to "${CHAT_TABLE_NAME}"...`);
	await client.send(
		new UpdateTableCommand({
			TableName: CHAT_TABLE_NAME,
			AttributeDefinitions: [
				{ AttributeName: "GSI1PK", AttributeType: "S" },
				{ AttributeName: "GSI1SK", AttributeType: "S" },
			],
			GlobalSecondaryIndexUpdates: [
				{
					Create: {
						IndexName: "GSI1",
						KeySchema: [
							{ AttributeName: "GSI1PK", KeyType: "HASH" },
							{ AttributeName: "GSI1SK", KeyType: "RANGE" },
						],
						Projection: { ProjectionType: "ALL" },
					},
				},
			],
		}),
	);
	console.log("UpdateTable requested. Waiting for ACTIVE...");
	await waitForActive();
}

async function main(): Promise<void> {
	const table = await getTableDescription();

	if (!table) {
		await createTable();
		console.log(`Table "${CHAT_TABLE_NAME}" created successfully.`);
		return;
	}

	// Check if GSI1 exists on the existing table
	const hasGSI1 = table.GlobalSecondaryIndexes?.some(
		(gsi) => gsi.IndexName === "GSI1",
	);

	if (!hasGSI1) {
		await addGSI1();
		console.log(`GSI1 added to "${CHAT_TABLE_NAME}".`);
	} else {
		console.log(`Table "${CHAT_TABLE_NAME}" already exists and has GSI1.`);
	}

	console.log(`Table "${CHAT_TABLE_NAME}" is ready.`);
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
