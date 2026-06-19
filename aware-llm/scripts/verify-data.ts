/**
 * Verifies data exists in DynamoDB by scanning the table.
 * Run from aware-llm/: bun ./scripts/verify-data.ts
 */
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import "dotenv/config";
import { CHAT_TABLE_NAME, getDocumentClient } from "../src/db/dynamodb-client.js";

const client = getDocumentClient();

async function main(): Promise<void> {
	console.log(`Scanning table: ${CHAT_TABLE_NAME}`);
	console.log(`Endpoint: ${process.env.DYNAMODB_ENDPOINT || "AWS"}`);
	console.log(`Region: ${process.env.REGION || "default"}\n`);

	try {
		const result = await client.send(
			new ScanCommand({
				TableName: CHAT_TABLE_NAME,
				Limit: 10, // Just get a sample
			}),
		);

		const items = result.Items ?? [];
		console.log(`Found ${items.length} items (showing up to 10)`);
		console.log(`Total scanned: ${result.ScannedCount ?? 0}`);
		console.log(`Total count: ${result.Count ?? 0}\n`);

		if (items.length === 0) {
			console.log("⚠️  No items found in table. Data may not be persisted yet.");
			return;
		}

		console.log("Sample items:");
		for (const item of items.slice(0, 5)) {
			console.log(`\n- Entity: ${item.entityType}`);
			if (item.entityType === "CONVERSATION") {
				console.log(`  Conversation ID: ${item.conversationId}`);
				console.log(`  User ID: ${item.userId}`);
				console.log(`  Title: ${item.title}`);
				console.log(`  Status: ${item.status}`);
				console.log(`  Messages: ${item.messageCount}`);
			} else if (item.entityType === "MESSAGE") {
				console.log(`  Message ID: ${item.messageId}`);
				console.log(`  Conversation ID: ${item.conversationId}`);
				console.log(`  Role: ${item.role}`);
				console.log(`  Content preview: ${(item.content as string).substring(0, 50)}...`);
			} else if (item.entityType === "AGENT_LOG") {
				console.log(`  Log ID: ${item.logId}`);
				console.log(`  Status: ${item.status}`);
			}
		}

		if (items.length > 5) {
			console.log(`\n... and ${items.length - 5} more items`);
		}
	} catch (err) {
		console.error("Error scanning table:", err);
		if (err && typeof err === "object" && "name" in err && err.name === "ResourceNotFoundException") {
			console.error("\n❌ Table does not exist! Run: bun run db:ensure");
		}
		process.exit(1);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
