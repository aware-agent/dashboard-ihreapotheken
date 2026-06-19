import { createRouter } from "../lib/create-app.js";
import chat from "./chat.js";
import conversations from "./conversations.js";
import internal from "./internal.js";
import root from "./root.js";

/**
 * Main router that combines all route modules
 * Add new route modules here as the application grows
 */
const app = createRouter();

// Register all route modules
app.route("/", root);
app.route("/chat", chat);
app.route("/conversations", conversations);
app.route("/internal", internal);

export default app;
