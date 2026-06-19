import type { NotFoundHandler } from "hono";

/**
 * Not found (404) handler middleware
 * Handles requests to routes that don't exist
 */
export const notFoundHandler: NotFoundHandler = (c) => {
	return c.json(
		{
			success: false,
			error: {
				message: `Not Found - [${c.req.method}]:[${c.req.path}]`,
				status: 404,
				method: c.req.method,
				path: c.req.path,
			},
		},
		404,
	);
};
