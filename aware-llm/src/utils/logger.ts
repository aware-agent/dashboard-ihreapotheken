import { mkdirSync } from "node:fs";
import { join } from "node:path";
import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { env } from "../env/index.js";

// Log directory configuration
const logsDir = join(process.cwd(), "logs");
const auditDir = join(logsDir, ".audit"); // Store audit files in a subdirectory

// Create log directories if they don't exist (required for winston-daily-rotate-file)
// This must be done before initializing any file transports
try {
	mkdirSync(logsDir, { recursive: true });
	mkdirSync(auditDir, { recursive: true });
} catch (error) {
	// If directory creation fails, log to console as fallback
	console.error("Failed to create log directories:", error);
}

// Determine log level (default: debug in dev, info in prod)
const getLogLevel = (): string => {
	if (env.LOG_LEVEL) {
		return env.LOG_LEVEL;
	}
	return env.NODE_ENV === "production" ? "info" : "debug";
};

// Determine log destination
const getLogDestination = (): "console" | "file" | "both" | "auto" => {
	if (process.env.VERCEL === "1") {
		return "console";
	}
	if (env.LOG_TO_FILE) {
		return env.LOG_TO_FILE;
	}
	// Default to console in production (serverless), both in development
	const isDevelopment = env.NODE_ENV === "development";
	return isDevelopment ? "both" : "console";
};

const logLevel = getLogLevel();
const logDestination = getLogDestination();
const isDevelopment = env.NODE_ENV === "development";

// Control logging destination:
// 'auto' = console in dev, file in production
// 'console' = console only (regardless of environment)
// 'file' = file only (regardless of environment)
// 'both' = console + file (regardless of environment)
const useConsole =
	logDestination === "console" ||
	logDestination === "both" ||
	(logDestination === "auto" && isDevelopment);

const useFile =
	logDestination === "file" ||
	logDestination === "both" ||
	(logDestination === "auto" && !isDevelopment);

// Custom format with structured JSON for production
const jsonFormat = winston.format.combine(
	winston.format.timestamp(),
	winston.format.errors({ stack: true }),
	winston.format.json(),
);

// Human-readable format for development
const prettyFormat = winston.format.combine(
	winston.format.timestamp({ format: "HH:mm:ss" }),
	winston.format.errors({ stack: true }),
	winston.format.colorize(),
	winston.format.printf((info: winston.Logform.TransformableInfo) => {
		const { timestamp, level, message, stack, ...meta } = info;
		const metaStr = Object.keys(meta).length
			? `\n${JSON.stringify(meta, null, 2)}`
			: "";
		return `${timestamp} ${level}: ${stack || message}${metaStr}`;
	}),
);

// Create transports based on environment and LOG_TO_FILE setting
const getTransports = (): winston.transport[] => {
	const transports: winston.transport[] = [];

	// Console transport (pretty format for readability)
	if (useConsole) {
		transports.push(
			new winston.transports.Console({
				format: isDevelopment ? prettyFormat : jsonFormat,
				level: logLevel,
			}),
		);
	}

	// File transports (JSON format for structured logging)
	if (useFile) {
		// App logs (info, warn, error) - main operational logs
		transports.push(
			new DailyRotateFile({
				filename: join(logsDir, "app-%DATE%.log"),
				datePattern: "YYYY-MM-DD",
				zippedArchive: true,
				maxSize: "50m",
				maxFiles: "14d",
				format: jsonFormat,
				level: "info", // Only info and above (info, warn, error)
				auditFile: join(auditDir, "app-audit.json"), // Store audit file in subdirectory
			}),
		);

		// Error logs only - critical issues
		transports.push(
			new DailyRotateFile({
				filename: join(logsDir, "error-%DATE%.log"),
				datePattern: "YYYY-MM-DD",
				zippedArchive: true,
				maxSize: "20m",
				maxFiles: "30d",
				format: jsonFormat,
				level: "error", // Only errors
				auditFile: join(auditDir, "error-audit.json"), // Store audit file in subdirectory
			}),
		);

		// Optional: Debug logs for troubleshooting (if LOG_LEVEL=debug)
		if (logLevel === "debug") {
			transports.push(
				new DailyRotateFile({
					filename: join(logsDir, "debug-%DATE%.log"),
					datePattern: "YYYY-MM-DD",
					zippedArchive: true,
					maxSize: "100m",
					maxFiles: "3d", // Short retention for verbose logs
					format: jsonFormat,
					level: "debug",
					auditFile: join(auditDir, "debug-audit.json"), // Store audit file in subdirectory
				}),
			);
		}
	}

	return transports;
};

// Create the logger
export const logger = winston.createLogger({
	level: logLevel,
	transports: getTransports(),

	// Handle uncaught exceptions and unhandled rejections (only when using file logging)
	exceptionHandlers: useFile
		? [
				new DailyRotateFile({
					filename: join(logsDir, "exceptions-%DATE%.log"),
					datePattern: "YYYY-MM-DD",
					zippedArchive: true,
					maxSize: "20m",
					maxFiles: "30d",
					format: jsonFormat,
					auditFile: join(auditDir, "exceptions-audit.json"), // Store audit file in subdirectory
				}),
			]
		: [],

	rejectionHandlers: useFile
		? [
				new DailyRotateFile({
					filename: join(logsDir, "rejections-%DATE%.log"),
					datePattern: "YYYY-MM-DD",
					zippedArchive: true,
					maxSize: "20m",
					maxFiles: "30d",
					format: jsonFormat,
					auditFile: join(auditDir, "rejections-audit.json"), // Store audit file in subdirectory
				}),
			]
		: [],

	// Exit on handled exceptions in production
	exitOnError: !isDevelopment,
});

/**
 * Creates a logger with context that automatically includes specified fields in all log entries
 * Useful for request logging, user tracking, etc.
 *
 * @param context - Context object to include in all log entries
 * @returns Logger instance with context methods
 *
 * @example
 * const requestLogger = createContextLogger({ requestId: '123', userId: '456' });
 * requestLogger.info('Processing request'); // Automatically includes requestId and userId
 */
export const createContextLogger = (context: Record<string, unknown>) => {
	return {
		error: (message: string, meta?: Record<string, unknown>) =>
			logger.error(message, { ...context, ...meta }),
		warn: (message: string, meta?: Record<string, unknown>) =>
			logger.warn(message, { ...context, ...meta }),
		info: (message: string, meta?: Record<string, unknown>) =>
			logger.info(message, { ...context, ...meta }),
		debug: (message: string, meta?: Record<string, unknown>) =>
			logger.debug(message, { ...context, ...meta }),
	};
};

// Log startup info
logger.info("Logger initialized", {
	environment: env.NODE_ENV,
	logLevel,
	logDestination,
	console: useConsole,
	file: useFile,
	...(isDevelopment && useFile && { logsDir }), // Only log directory path in development
});
