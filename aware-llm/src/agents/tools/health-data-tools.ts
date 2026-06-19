import { tool, withTrace, type RunContext } from "@openai/agents";
import { z } from "zod";
import { env } from "../../env/index.js";
import { logger } from "../../utils/logger.js";
import type { AgentContext } from "../types.js";
import { createHash } from "node:crypto";
import type {
	BiomarkerData,
	HealthZoneData,
	UserHealthData,
} from "../types.js";

/**
 * Get access token from context or parameter
 * If the parameter looks like a template string (contains context.accessToken),
 * extract from current run context instead
 */
function getAccessToken(
	providedToken: string | undefined,
	context: RunContext<AgentContext> | undefined,
): string {
	// Normalize the provided token for comparison
	const normalizedToken = providedToken?.trim() || "";

	// Check if provided token is valid (not a template string)
	// Real JWT tokens start with "eyJ" (base64 encoded JSON header)
	const looksLikeJWT = normalizedToken.startsWith("eyJ");
	const isTemplateString = normalizedToken && !looksLikeJWT && (
		normalizedToken.includes("{{context.accessToken}}") ||
		normalizedToken.includes("context.accessToken") ||
		normalizedToken.startsWith("context.") ||
		normalizedToken.length < 10 ||
		!normalizedToken.includes(".") // JWT tokens have dots
	);

	logger.debug("getAccessToken called", {
		hasProvidedToken: !!providedToken,
		providedTokenPrefix: providedToken?.substring(0, 30),
		normalizedTokenPrefix: normalizedToken.substring(0, 30),
		looksLikeJWT,
		isTemplateString: !!isTemplateString,
		hasContext: !!context,
		hasContextToken: !!context?.context.accessToken,
	});

	// If token looks like a real JWT token, use it
	if (normalizedToken && looksLikeJWT && normalizedToken.length >= 10) {
		logger.debug("Using provided JWT token");
		return normalizedToken;
	}

	// If token is provided but doesn't look like JWT, it's probably a template.
	// Always prefer context token if available.
	if (context?.context.accessToken) {
		if (normalizedToken && isTemplateString) {
			logger.warn("Agent passed template string, using context fallback", {
				providedToken: normalizedToken.substring(0, 30),
				usingContextToken: true,
			});
		} else if (!normalizedToken) {
			logger.debug("No token provided, using context token");
		}
		return context.context.accessToken;
	}

	// If we have a provided token but it's a template and no context, log error
	if (normalizedToken && isTemplateString) {
		logger.error("Agent passed template string and no context available", {
			providedToken: normalizedToken.substring(0, 30),
			hasContext: !!context,
		});
	}

	throw new Error("Access token not available in context or parameter");
}

/**
 * Validate access token format
 * Returns true if valid, throws if invalid
 */
function validateAccessToken(accessToken: string): void {
	if (!accessToken || accessToken.length < 10) {
		throw new Error("Invalid or missing access token");
	}
}

/**
 * Fetch user health data from Aware API with tracing
 */
async function fetchFromAwareAPI<T>(
	endpoint: string,
	accessToken: string,
): Promise<T> {
	return withTrace(`api_call:${endpoint}`, async () => {
		// Validate token before making request
		if (!accessToken || accessToken.length < 10) {
			logger.error("Invalid access token provided", {
				endpoint,
				tokenLength: accessToken?.length || 0,
			});
			throw new Error("Invalid or missing access token");
		}

		const url = `${env.AWARE_API_BASE_URL}${endpoint}`;
		const headers: HeadersInit = {
			Authorization: `Bearer ${accessToken}`,
			"Content-Type": "application/json",
		};

		logger.debug("Making Aware API request", {
			endpoint,
			url,
			tokenPrefix: `${accessToken.substring(0, 20)}...`,
		});

		const response = await fetch(url, {
			headers,
			method: "GET",
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => "Unable to read error response");
			logger.error("Aware API error", {
				endpoint,
				url,
				status: response.status,
				statusText: response.statusText,
				errorBody: errorText.substring(0, 200), // Limit error body length
			});
			throw new Error(
				`Aware API error: ${response.status} ${response.statusText}`,
			);
		}

		return response.json() as Promise<T>;
	});
}

type CacheEntry<T> = { createdAt: number; promise: Promise<T> };
const IN_FLIGHT_TTL_MS = 10_000;
const inFlight = new Map<string, CacheEntry<unknown>>();

function cacheKey(endpoint: string, accessToken: string): string {
	const tokenHash = createHash("sha256").update(accessToken).digest("hex").slice(0, 16);
	return `${endpoint}:${tokenHash}`;
}

async function fetchFromAwareAPIOnce<T>(
	endpoint: string,
	accessToken: string,
): Promise<T> {
	const key = cacheKey(endpoint, accessToken);
	const now = Date.now();
	const existing = inFlight.get(key);

	if (existing && now - existing.createdAt < IN_FLIGHT_TTL_MS) {
		return existing.promise as Promise<T>;
	}

	const promise = fetchFromAwareAPI<T>(endpoint, accessToken).finally(() => {
		// Best-effort cleanup after completion (or keep until TTL expires)
		const current = inFlight.get(key);
		if (current?.promise === promise) {
			inFlight.delete(key);
		}
	});

	inFlight.set(key, { createdAt: now, promise });
	return promise;
}

/**
 * Tool: Get user's health data summary
 * Enhanced with input validation and tracing
 */
export const getUserHealthDataTool = tool({
	name: "get_user_health_data",
	description:
		"Fetches the user's complete health profile including latest blood test results, biomarker values with reference ranges, health zone summaries, and historical trends. Use this to get an overview of the user's health status. IMPORTANT: The accessToken parameter must be obtained from the run context.",
	parameters: z.object({}),
	async execute(
		_args: Record<string, never>,
		context?: RunContext<AgentContext>,
	): Promise<UserHealthData> {
		// Get access token from run context
		const token = getAccessToken(undefined, context);
		validateAccessToken(token);

		return withTrace("get_user_health_data", async () => {
			const [results, healthZones] = await Promise.all([
				fetchFromAwareAPIOnce<{
					results: Array<{
						id: string;
						date: string;
						biomarkers: BiomarkerData[];
						healthZones: HealthZoneData[];
						inRange: number;
						outOfRange: number;
					}>;
				}>("/v1/results", token),
				fetchFromAwareAPIOnce<{
					healthZones: HealthZoneData[];
				}>("/v1/health-zones", token),
			]);

			const sortedResults = [...results.results].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			);

			logger.debug("Fetched user health data", {
				resultCount: sortedResults.length,
				healthZoneCount: healthZones.healthZones.length,
			});

			return {
				latestResult: sortedResults[0] || null,
				previousResults: sortedResults.slice(1),
				healthZones: healthZones.healthZones,
			};
		});
	},
});

/**
 * Tool: Get specific biomarker details
 * Enhanced with input validation and tracing
 */
export const getBiomarkerDetailTool = tool({
	name: "get_biomarker_detail",
	description:
		"Fetches detailed information about a specific biomarker including description, health facts, related articles, and nutritional/lifestyle recommendations. Use this when the user asks about a specific biomarker. IMPORTANT: The accessToken parameter must be obtained from the run context.",
	parameters: z.object({
		biomarkerCode: z
			.string()
			.min(1, "Biomarker code is required")
			.describe("The code of the biomarker (e.g., 'HBA1C', 'TSH')"),
		resultId: z
			.string()
			.min(1, "Result ID is required")
			.describe("The ID of the result containing this biomarker"),
	}),
	async execute(
		{ biomarkerCode, resultId },
		context?: RunContext<AgentContext>,
	) {
		// Get access token from run context
		const token = getAccessToken(undefined, context);
		validateAccessToken(token);

		return withTrace("get_biomarker_detail", async () => {
			const detail = await fetchFromAwareAPI<{
				name: string;
				code: string;
				value: number;
				valueText: string;
				unit: string;
				range: [number | null, number | null];
				optimalRange: [number | null, number | null];
				biomarkerStatus: string;
				description: string | null;
				summary: string | null;
				explanation: string | null;
				labelHigh: string | null;
				labelInRange: string | null;
				labelLow: string | null;
				healthFacts: Array<{ title: string; description: string }>;
			}>(`/v1/results/${resultId}/biomarkers/${biomarkerCode}`, token);

			logger.debug("Fetched biomarker detail", {
				biomarkerCode,
				resultId,
			});

			return {
				name: detail.name,
				code: detail.code,
				value: detail.value,
				valueText: detail.valueText,
				unit: detail.unit,
				range: detail.range,
				optimalRange: detail.optimalRange,
				status: detail.biomarkerStatus,
				description: detail.description,
				summary: detail.summary,
				explanation: detail.explanation,
				labelHigh: detail.labelHigh,
				labelInRange: detail.labelInRange,
				labelLow: detail.labelLow,
				healthFacts: detail.healthFacts,
			};
		});
	},
});

/**
 * Tool: Get health zone details with biomarkers
 * Enhanced with input validation and tracing
 */
export const getHealthZoneDetailTool = tool({
	name: "get_health_zone_detail",
	description:
		"Fetches detailed information about a specific health zone including all biomarkers within that zone and their statuses. Use this when the user asks about a health zone like 'Heart', 'Liver', 'Metabolism', etc. IMPORTANT: The accessToken parameter must be obtained from the run context.",
	parameters: z.object({
		healthZoneId: z
			.string()
			.min(1, "Health zone ID is required")
			.describe("The ID of the health zone"),
		resultId: z
			.string()
			.min(1, "Result ID is required")
			.describe("The ID of the result to get zone data for"),
	}),
	async execute(
		{ healthZoneId, resultId },
		context?: RunContext<AgentContext>,
	) {
		// Get access token from run context
		const token = getAccessToken(undefined, context);
		validateAccessToken(token);

		return withTrace("get_health_zone_detail", async () => {
			const zoneDetail = await fetchFromAwareAPI<{
				id: string;
				name: string;
				icon: string | null;
				biomarkers: BiomarkerData[];
				inRange: number;
				outOfRange: number;
			}>(`/v1/results/${resultId}/health-zones/${healthZoneId}`, token);

			logger.debug("Fetched health zone detail", {
				healthZoneId,
				resultId,
				biomarkerCount: zoneDetail.biomarkers.length,
			});

			return {
				id: zoneDetail.id,
				name: zoneDetail.name,
				biomarkers: zoneDetail.biomarkers,
				inRange: zoneDetail.inRange,
				outOfRange: zoneDetail.outOfRange,
				summary: `${zoneDetail.inRange} biomarkers in range, ${zoneDetail.outOfRange} out of range`,
			};
		});
	},
});

/**
 * Tool: Analyze biomarker trends over time
 * Enhanced with input validation and tracing
 */
export const analyzeTrendsTool = tool({
	name: "analyze_trends",
	description:
		"Compares biomarker values across multiple test results to identify trends. Use this when the user asks about changes over time, improvements, or declining markers. IMPORTANT: The accessToken parameter must be obtained from the run context.",
	parameters: z.object({
		biomarkerCode: z
			.string()
			.default("")
			.describe(
				"Specific biomarker code to analyze (leave empty to analyze all biomarkers)",
			),
	}),
	async execute(
		{ biomarkerCode },
		context?: RunContext<AgentContext>,
	) {
		// Get access token from run context
		const token = getAccessToken(undefined, context);
		validateAccessToken(token);

		return withTrace("analyze_trends", async () => {
			const results = await fetchFromAwareAPI<{
				results: Array<{
					id: string;
					date: string;
					biomarkers: BiomarkerData[];
				}>;
			}>("/v1/results", token);

			if (results.results.length < 2) {
				logger.debug("Insufficient data for trend analysis", {
					resultCount: results.results.length,
				});

				return {
					hasTrends: false,
					message:
						"Not enough historical data to analyze trends. At least 2 test results are needed.",
					testCount: results.results.length,
				};
			}

			const sortedResults = [...results.results].sort(
				(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
			);

			const latest = sortedResults[0];
			const previous = sortedResults[1];

			// Find biomarkers that exist in both tests
			const trendData: Array<{
				code: string;
				name: string;
				latestValue: number;
				previousValue: number;
				change: number;
				changePercent: number;
				direction: "improving" | "declining" | "stable";
				latestStatus: string;
				previousStatus: string;
			}> = [];

			for (const latestBio of latest.biomarkers) {
				if (biomarkerCode && biomarkerCode !== "" && latestBio.code !== biomarkerCode) continue;

				const previousBio = previous.biomarkers.find(
					(b) => b.code === latestBio.code,
				);
				if (!previousBio) continue;

				const change = latestBio.value - previousBio.value;
				const changePercent =
					previousBio.value !== 0 ? (change / previousBio.value) * 100 : 0;

				// Determine if change is positive based on status
				const statusImproved =
					(latestBio.biomarkerStatus === "OPTIMAL" ||
						latestBio.biomarkerStatus === "NORMAL") &&
					(previousBio.biomarkerStatus === "HIGH" ||
						previousBio.biomarkerStatus === "LOW");

				const statusDeclined =
					(previousBio.biomarkerStatus === "OPTIMAL" ||
						previousBio.biomarkerStatus === "NORMAL") &&
					(latestBio.biomarkerStatus === "HIGH" ||
						latestBio.biomarkerStatus === "LOW");

				let direction: "improving" | "declining" | "stable" = "stable";
				if (
					statusImproved ||
					(Math.abs(changePercent) > 5 && latestBio.rangeTernary === 0)
				) {
					direction = "improving";
				} else if (
					statusDeclined ||
					(Math.abs(changePercent) > 5 && latestBio.rangeTernary !== 0)
				) {
					direction = "declining";
				}

				trendData.push({
					code: latestBio.code,
					name: latestBio.name,
					latestValue: latestBio.value,
					previousValue: previousBio.value,
					change,
					changePercent,
					direction,
					latestStatus: latestBio.biomarkerStatus,
					previousStatus: previousBio.biomarkerStatus,
				});
			}

			const improving = trendData.filter((t) => t.direction === "improving");
			const declining = trendData.filter((t) => t.direction === "declining");
			const stable = trendData.filter((t) => t.direction === "stable");

			logger.debug("Trend analysis complete", {
				biomarkerCode: biomarkerCode ?? "all",
				improving: improving.length,
				declining: declining.length,
				stable: stable.length,
			});

			return {
				hasTrends: true,
				testCount: results.results.length,
				latestDate: latest.date,
				previousDate: previous.date,
				improving,
				declining,
				stable,
				summary: `${improving.length} improving, ${declining.length} declining, ${stable.length} stable`,
			};
		});
	},
});

/**
 * All health data tools for the agent
 */
export const healthDataTools = [
	getUserHealthDataTool,
	getBiomarkerDetailTool,
	getHealthZoneDetailTool,
	analyzeTrendsTool,
];
