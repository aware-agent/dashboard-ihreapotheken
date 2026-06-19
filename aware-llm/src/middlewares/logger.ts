import { httpLogger } from "./http-logger.js";

/**
 * Logger middleware
 * Logs HTTP requests with method, path, status, duration, IP, and user agent
 * Uses Winston for structured logging
 */
export const loggerMiddleware = httpLogger;
