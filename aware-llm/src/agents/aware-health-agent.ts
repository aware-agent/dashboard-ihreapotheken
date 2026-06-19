import { Agent } from "@openai/agents";
import { env } from "../env/index.js";
import { inputGuardrails } from "./guardrails/input-guardrails.js";
import { outputGuardrails } from "./guardrails/output-guardrails.js";
import { OUTPUT_TEMPLATES } from "./prompts/output-templates.js";
import {
	CONTEXT_INSTRUCTIONS,
	SYSTEM_PROMPT,
} from "./prompts/system-prompt.js";
import { healthDataTools } from "./tools/health-data-tools.js";
import type { AgentContext, ChatContext } from "./types.js";

/**
 * Model to use for all agents - configurable via OPENAI_MODEL env variable
 * @default "gpt-5-mini"
 */
const AGENT_MODEL = env.OPENAI_MODEL;

/**
 * Whether to use nested expert agents (higher quality, more API calls)
 * Set USE_NESTED_AGENTS=true in env to enable nested agent structure
 * @default false (optimized single-agent mode)
 */
const USE_NESTED_AGENTS = env.USE_NESTED_AGENTS ?? false;

/**
 * Build instructions for a specialized agent
 * Used in nested agent structure for higher quality responses
 */
function buildSpecializedInstructions(
	contextInstruction: string,
	outputTemplate?: string,
): string {
	let instructions = `${SYSTEM_PROMPT}\n\n## CURRENT CONTEXT\n${contextInstruction}\n`;

	if (outputTemplate) {
		instructions += `\n## OUTPUT TEMPLATE GUIDANCE\nUse this structure as a guide (adapt as needed):\n${outputTemplate}\n`;
	}

	return instructions;
}

/**
 * Build dynamic instructions based on context type
 * This allows a single agent to handle all contexts without nested agent calls
 * Used in optimized single-agent mode
 */
type ResponseMode = "first_turn" | "follow_up";

/**
 * Short context hints for follow-up mode (no structured templates)
 */
const FOLLOW_UP_CONTEXT_HINTS: Record<string, string> = {
	biomarker: "The conversation is about a specific biomarker. Answer follow-up questions directly without repeating the full explanation.",
	healthZone: "The conversation is about a health zone. Answer follow-up questions directly without repeating the full overview.",
	outOfRange: "The conversation is about out-of-range markers. Answer follow-up questions directly without re-listing everything.",
	trends: "The conversation is about trends. Answer follow-up questions directly without repeating the full analysis.",
	bioAge: "The conversation is about biological age. Answer follow-up questions directly without repeating the full explanation.",
	general: "Answer the user's follow-up question directly and concisely.",
};

function buildContextAwareInstructions(
	contextType?: "biomarker" | "healthZone" | "outOfRange" | "trends" | "general" | "bioAge",
	responseMode: ResponseMode = "first_turn",
): string {
	// For follow-ups, use a much simpler instruction set
	if (responseMode === "follow_up") {
		const contextHint = FOLLOW_UP_CONTEXT_HINTS[contextType ?? "general"] ?? FOLLOW_UP_CONTEXT_HINTS.general;

		return `${SYSTEM_PROMPT}

## CRITICAL: FOLLOW-UP MODE ACTIVE
This is a **follow-up question** in an ongoing conversation. The user has already received a detailed first response.

**You MUST:**
- Answer the specific question asked — do NOT repeat the full structured response from before
- Keep your answer to **1–4 short bullets** or **1–2 short paragraphs** max
- Ignore any instruction above that suggests headings or full sections.
- Do NOT use any ## headings (Overview, What Stands Out, etc.) — just answer directly
- Do NOT include a "When to talk to a medical professional" section or heading
- Reference earlier context briefly if helpful ("As mentioned earlier…")
- Skip "I'm not a doctor" disclaimers unless user asks about medication/diagnosis/treatment

**Context hint:** ${contextHint}

**Example good follow-up response:**
"Yes, overall your results look good. The key highlights are the 53 in-range markers and strong metabolic control. The 5 out-of-range markers are worth discussing with your medical professional but aren't urgent."

**Example BAD follow-up response:**
(Do NOT do this — no full structured response with ## headings on follow-ups)
`;
	}

	// First turn: use full context instructions with output templates
	let contextInstruction = "";
	let outputTemplate = "";

	switch (contextType) {
		case "biomarker":
			contextInstruction = CONTEXT_INSTRUCTIONS.biomarker;
			outputTemplate = OUTPUT_TEMPLATES.biomarkerExplanation;
			break;
		case "healthZone":
			contextInstruction = CONTEXT_INSTRUCTIONS.healthZone;
			outputTemplate = OUTPUT_TEMPLATES.healthZoneOverview;
			break;
		case "outOfRange":
			contextInstruction = CONTEXT_INSTRUCTIONS.outOfRange;
			outputTemplate = OUTPUT_TEMPLATES.outOfRangeReview;
			break;
		case "trends":
			contextInstruction = CONTEXT_INSTRUCTIONS.trends;
			outputTemplate = OUTPUT_TEMPLATES.trendAnalysis;
			break;
		case "bioAge":
			contextInstruction = "The user is asking about their Biological Age. Bio Age is calculated from 9 blood biomarkers (Albumin, Creatinine, Glucose, CRP, Lymphocyte %, MCV, RDW, ALP, WBC) plus chronological age. Focus on explaining which biomarkers are negatively contributing (making them biologically older) and provide actionable advice to improve those specific markers.";
			break;
		default:
			contextInstruction = CONTEXT_INSTRUCTIONS.general;
			break;
	}

	let instructions = `${SYSTEM_PROMPT}\n\n## CURRENT CONTEXT\n${contextInstruction}\n`;

	if (outputTemplate) {
		instructions += `\n## OUTPUT TEMPLATE GUIDANCE\nUse this structure as a guide (adapt as needed) and keep it concise:\n${outputTemplate}\n`;
	}

	return instructions;
}

/**
 * Specialized agents for nested agent structure (higher quality, more API calls)
 * These are only created if USE_NESTED_AGENTS=true
 */
export const biomarkerAgent = USE_NESTED_AGENTS ? new Agent<AgentContext>({
	name: "Biomarker Specialist",
	instructions: buildSpecializedInstructions(
		CONTEXT_INSTRUCTIONS.biomarker,
		OUTPUT_TEMPLATES.biomarkerExplanation,
	),
	model: AGENT_MODEL,
	tools: healthDataTools,
}) : null;

export const healthZoneAgent = USE_NESTED_AGENTS ? new Agent<AgentContext>({
	name: "Health Zone Specialist",
	instructions: buildSpecializedInstructions(
		CONTEXT_INSTRUCTIONS.healthZone,
		OUTPUT_TEMPLATES.healthZoneOverview,
	),
	model: AGENT_MODEL,
	tools: healthDataTools,
}) : null;

export const outOfRangeAgent = USE_NESTED_AGENTS ? new Agent<AgentContext>({
	name: "Out-of-Range Specialist",
	instructions: buildSpecializedInstructions(
		CONTEXT_INSTRUCTIONS.outOfRange,
		OUTPUT_TEMPLATES.outOfRangeReview,
	),
	model: AGENT_MODEL,
	tools: healthDataTools,
}) : null;

export const trendsAgent = USE_NESTED_AGENTS ? new Agent<AgentContext>({
	name: "Trends Specialist",
	instructions: buildSpecializedInstructions(
		CONTEXT_INSTRUCTIONS.trends,
		OUTPUT_TEMPLATES.trendAnalysis,
	),
	model: AGENT_MODEL,
	tools: healthDataTools,
}) : null;

export const generalAgent = USE_NESTED_AGENTS ? new Agent<AgentContext>({
	name: "General Health Companion",
	instructions: buildSpecializedInstructions(CONTEXT_INSTRUCTIONS.general),
	model: AGENT_MODEL,
	tools: healthDataTools,
}) : null;

/**
 * Manager agent with nested expert agents (higher quality, more API calls)
 * Used when USE_NESTED_AGENTS=true
 *
 * Architecture:
 * - Manager agent analyzes request → 1 API call
 * - Manager calls expert agent tool → 1 API call
 * - Expert agent processes → 1 API call
 * - Manager synthesizes response → 1 API call
 * Total: 3-5+ API calls per request
 */
const nestedAwareHealthAgent = USE_NESTED_AGENTS ? new Agent<AgentContext>({
	name: "Aware Health Companion",
	instructions: `${SYSTEM_PROMPT}

## YOUR ROLE AS MANAGER
You are the main health companion that talks directly to users. You have access to specialized expert agents as tools. When users need specific help, call the appropriate expert tool.

## HEALTH DATA AND TOOL USAGE
- For every question about lab results, biomarkers, health zones, or trends, you MUST first call the health data tools (for example \`get_user_health_data\`, \`get_biomarker_detail\`, \`get_health_zone_detail\`, or \`analyze_trends\`) using the access token from \`context.accessToken\`.
- Always base your explanations on the concrete values, ranges, and trends returned by these tools – do not guess or rely only on earlier messages.
- When an expert agent is involved, you and the expert should both assume that tool results are the source of truth and reference them explicitly in your explanations.

## AVAILABLE EXPERT TOOLS

1. **biomarker_expert** - Use when the user asks about a specific biomarker from their test results. This expert explains individual biomarkers, their values, reference ranges, and what they mean.

2. **health_zone_expert** - Use when the user asks about a health zone (a group of related biomarkers like Heart, Liver, Metabolism, etc.). This expert provides overviews of health zones and how markers relate.

3. **out_of_range_expert** - Use when the user wants to understand their out-of-range biomarkers, wants to review abnormal results, or asks about which markers need attention. This expert prioritizes and explains out-of-range results.

4. **trends_expert** - Use when the user asks about trends, changes over time, comparing results, improving/declining markers, or wants to see progress. This expert analyzes historical data and identifies patterns.

5. **general_health_expert** - Use for general health questions, educational information, or when the query doesn't fit into the above categories.

## HOW TO USE EXPERT TOOLS
- Analyze the user's question and context.
- Call the most appropriate expert tool with the user's question and, when relevant, with the latest health data you have fetched via tools.
- Let the expert provide specialized analysis grounded in the same tool results.
- Synthesize the expert's response into a clear, personalized answer for the user that repeats the key numbers and trends in simple language.
- You maintain control and provide the final response to the user.

## CONTEXT AWARENESS
- If the user mentions a specific biomarker name, use biomarker_expert.
- If the user mentions a health zone, use health_zone_expert.
- If the user asks about "out of range", "abnormal", or "review my results", use out_of_range_expert.
- If the user asks about "trends", "changes", "improving", or "compare", use trends_expert.
- For general questions, use general_health_expert.

Remember: You are the face of Aware Companion. Always ground your answers in tool-fetched health data and use the experts as tools to provide the best answers, but you deliver the final response to the user.`,
	model: AGENT_MODEL,
	// Input guardrails - run before processing
	inputGuardrails,
	// Output guardrails - run after generating response
	outputGuardrails,
	tools: [
		...healthDataTools,
		...(biomarkerAgent ? [biomarkerAgent.asTool({
			toolName: "biomarker_expert",
			toolDescription:
				"Handles questions about specific biomarkers. Use when the user asks about individual test results, biomarker values, or what a specific marker means.",
		})] : []),
		...(healthZoneAgent ? [healthZoneAgent.asTool({
			toolName: "health_zone_expert",
			toolDescription:
				"Handles questions about health zones (groups of related biomarkers like Heart, Liver, Metabolism). Use when the user asks about a health zone or wants an overview of related markers.",
		})] : []),
		...(outOfRangeAgent ? [outOfRangeAgent.asTool({
			toolName: "out_of_range_expert",
			toolDescription:
				"Handles questions about out-of-range biomarkers. Use when the user wants to review abnormal results, understand which markers need attention, or asks about out-of-range values.",
		})] : []),
		...(trendsAgent ? [trendsAgent.asTool({
			toolName: "trends_expert",
			toolDescription:
				"Handles questions about trends and changes over time. Use when the user asks about trends, comparing results, improving/declining markers, or wants to see progress over time.",
		})] : []),
		...(generalAgent ? [generalAgent.asTool({
			toolName: "general_health_expert",
			toolDescription:
				"Handles general health questions and educational information. Use for questions that don't fit into biomarker, health zone, out-of-range, or trend categories.",
		})] : []),
	],
}) : null;

/**
 * Optimized single agent that handles all contexts directly
 * This eliminates nested agent calls, reducing API calls from 3-5+ to 1-2 per request
 * Used when USE_NESTED_AGENTS=false (default)
 *
 * Enhanced with:
 * - Input guardrails for medical emergency detection and content filtering
 * - Output guardrails for medical advice compliance and PII protection
 * - Dynamic instructions based on context type
 */
export const awareHealthAgent: Agent<AgentContext> = USE_NESTED_AGENTS
	? (nestedAwareHealthAgent as Agent<AgentContext>)
	: new Agent<AgentContext>({
		name: "Aware Health Companion",
		instructions: SYSTEM_PROMPT,
		model: AGENT_MODEL,
		// Input guardrails - run before processing
		inputGuardrails,
		// Output guardrails - run after generating response
		outputGuardrails,
		// Only use regular tools - no nested agents to minimize API calls
		tools: healthDataTools,
	});

/**
 * Create a context-aware agent instance with dynamic instructions
 * This is called per-request to inject context-specific instructions
 * Only used in optimized single-agent mode (USE_NESTED_AGENTS=false)
 */
export function createContextAwareAgent(
	contextType?: "biomarker" | "healthZone" | "outOfRange" | "trends" | "general" | "bioAge",
	hasContextData?: boolean,
	responseMode: ResponseMode = "first_turn",
): Agent<AgentContext> {
	// If using nested agents, return the main agent (it handles routing internally)
	if (USE_NESTED_AGENTS) {
		return awareHealthAgent;
	}

	// If context data is provided, don't provide tools (agent should use provided data)
	// Tools are kept for future use when context data is not available
	const tools = hasContextData ? [] : healthDataTools;

	// Otherwise, create context-specific agent with optimized instructions
	return new Agent({
		name: "Aware Health Companion",
		instructions: buildContextAwareInstructions(contextType, responseMode),
		model: AGENT_MODEL,
		inputGuardrails,
		outputGuardrails,
		tools,
	});
}

/**
 * Enhance message with context-specific information
 * This adds user profile and context details to the message
 */
export function enhanceMessageWithContext(
	message: string,
	context?: ChatContext,
	userProfile?: { age?: number; sex?: "MALE" | "FEMALE" | "OTHER" },
): string {
	let contextPrefix = "";

	// Add user profile info if available
	if (userProfile?.age !== undefined || userProfile?.sex !== undefined) {
		contextPrefix += "## USER PROFILE\n";
		if (userProfile.age !== undefined) {
			contextPrefix += `- Age: ${userProfile.age} years\n`;
		}
		if (userProfile.sex !== undefined) {
			contextPrefix += `- Biological sex: ${userProfile.sex}\n`;
		}
		contextPrefix += "\n";
	}

	// Add context name if available
	if (context?.name) {
		contextPrefix += `The user is specifically asking about: **${context.name}**\n\n`;
	}

	// Add context data if available
	if (context?.data) {
		// Format context data based on type
		if (context.type === "healthZone" && typeof context.data === "object" && context.data !== null) {
			const healthZoneData = context.data as {
				healthZone?: { id?: string; name?: string; description?: string };
				biomarkers?: Array<{
					id?: string;
					name?: string;
					code?: string;
					value?: number;
					valueText?: string;
					unit?: string;
					range?: [number | null, number | null];
					biomarkerStatus?: string;
					optimalRange?: [number | null, number | null];
				}>;
				latestResultDate?: string;
			};

			contextPrefix += `## HEALTH ZONE CONTEXT\n`;
			if (healthZoneData.healthZone?.name) {
				contextPrefix += `Health Zone: **${healthZoneData.healthZone.name}**\n`;
			}
			if (healthZoneData.healthZone?.description) {
				contextPrefix += `Description: ${healthZoneData.healthZone.description}\n`;
			}
			if (healthZoneData.latestResultDate) {
				contextPrefix += `Latest Test Date: ${healthZoneData.latestResultDate}\n`;
			}
			contextPrefix += `\n`;

			// Format biomarker results
			if (healthZoneData.biomarkers && healthZoneData.biomarkers.length > 0) {
				contextPrefix += `## BIOMARKER RESULTS FOR THIS HEALTH ZONE\n`;
				healthZoneData.biomarkers.forEach((biomarker) => {
					contextPrefix += `- **${biomarker.name}** (${biomarker.code}): `;
					if (biomarker.valueText) {
						contextPrefix += `${biomarker.valueText} ${biomarker.unit || ""}`;
					} else if (biomarker.value !== undefined) {
						contextPrefix += `${biomarker.value} ${biomarker.unit || ""}`;
					}
					if (biomarker.range && biomarker.range[0] !== null && biomarker.range[1] !== null) {
						contextPrefix += ` (Reference range: ${biomarker.range[0]}-${biomarker.range[1]} ${biomarker.unit || ""})`;
					}
					if (biomarker.biomarkerStatus) {
						contextPrefix += ` - Status: ${biomarker.biomarkerStatus}`;
					}
					contextPrefix += `\n`;
				});
				contextPrefix += `\n`;
			} else {
				contextPrefix += `No biomarker results available for this health zone.\n\n`;
			}
		} else if (context.type === "biomarker" && typeof context.data === "object" && context.data !== null) {
			// Biomarker data is already well-structured, just format it nicely
			contextPrefix += `## BIOMARKER CONTEXT DATA\n`;
			contextPrefix += `${JSON.stringify(context.data, null, 2)}\n\n`;
		} else if (context.type === "bioAge" && typeof context.data === "object" && context.data !== null) {
			// Bio Age context with contribution data
			const bioAgeData = context.data as {
				bioAge?: number;
				chronologicalAge?: number;
				difference?: number;
				negativeContributions?: Array<{
					biomarkerName: string;
					value: number;
					unit: string;
					contribution: number;
				}>;
			};

			contextPrefix += `## BIO AGE CONTEXT\n`;
			if (bioAgeData.bioAge !== undefined) {
				contextPrefix += `Biological Age: **${bioAgeData.bioAge.toFixed(1)} years**\n`;
			}
			if (bioAgeData.chronologicalAge !== undefined) {
				contextPrefix += `Chronological Age: ${bioAgeData.chronologicalAge} years\n`;
			}
			if (bioAgeData.difference !== undefined) {
				const isYounger = bioAgeData.difference < 0;
				contextPrefix += `Difference: ${Math.abs(bioAgeData.difference).toFixed(1)} years ${isYounger ? 'younger' : 'older'}\n`;
			}
			contextPrefix += `\n`;

			if (bioAgeData.negativeContributions && bioAgeData.negativeContributions.length > 0) {
				contextPrefix += `## BIOMARKERS NEGATIVELY CONTRIBUTING TO BIO AGE (making user older)\n`;
				bioAgeData.negativeContributions.forEach((contrib) => {
					contextPrefix += `- **${contrib.biomarkerName}**: ${contrib.value} ${contrib.unit} (adds +${contrib.contribution.toFixed(1)} years to bio age)\n`;
				});
				contextPrefix += `\n`;
			}
		} else if (context.type === "general" && typeof context.data === "object" && context.data !== null) {
			// Check if this is multiple results for trend analysis
			const data = context.data as { results?: Array<unknown>; result?: unknown; biomarkers?: Array<unknown> };

			if (data.results && Array.isArray(data.results) && data.results.length > 1) {
				// Multiple results for trend analysis
				contextPrefix += `## MULTIPLE TEST RESULTS FOR TREND ANALYSIS\n`;
				contextPrefix += `You have ${data.results.length} test results to compare. Analyze trends, changes, and improvements across these results.\n\n`;
				contextPrefix += `${JSON.stringify(context.data, null, 2)}\n\n`;
			} else {
				// Single result or other general context data
				contextPrefix += `## CONTEXT DATA\n`;
				contextPrefix += `${JSON.stringify(context.data, null, 2)}\n\n`;
			}
		} else {
			// Generic context data
			contextPrefix += `## CONTEXT DATA\n`;
			contextPrefix += `${JSON.stringify(context.data, null, 2)}\n\n`;
		}
	}

	return contextPrefix ? contextPrefix + message : message;
}
