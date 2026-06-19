import { timingSafeEqual } from "node:crypto";
import { createMiddleware } from "hono/factory";
import { HTTPException } from "hono/http-exception";
import { env } from "../env/index.js";

const ADMIN_USERNAME = env.ADMIN_USERNAME;
const ADMIN_PASSWORD = env.ADMIN_PASSWORD;

function safeEqual(a: string, b: string): boolean {
	const aBuf = Buffer.from(a);
	const bBuf = Buffer.from(b);
	if (aBuf.length !== bBuf.length) {
		return false;
	}
	return timingSafeEqual(aBuf, bBuf);
}

export const basicAuthMiddleware = createMiddleware(async (c, next) => {
	if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
		throw new HTTPException(500, {
			message:
				"Admin credentials are not configured. Set ADMIN_USERNAME and ADMIN_PASSWORD.",
		});
	}

	const authHeader = c.req.header("Authorization");

	if (!authHeader || !authHeader.startsWith("Basic ")) {
		c.header("WWW-Authenticate", 'Basic realm="Admin Area"');
		throw new HTTPException(401, { message: "Authentication required" });
	}

	const base64Credentials = authHeader.slice(6);
	const credentials = Buffer.from(base64Credentials, "base64").toString("utf-8");
	const [username, password] = credentials.split(":");

	const usernameValid = safeEqual(username ?? "", ADMIN_USERNAME);
	const passwordValid = safeEqual(password ?? "", ADMIN_PASSWORD);

	if (!usernameValid || !passwordValid) {
		throw new HTTPException(401, { message: "Invalid credentials" });
	}

	await next();
});

