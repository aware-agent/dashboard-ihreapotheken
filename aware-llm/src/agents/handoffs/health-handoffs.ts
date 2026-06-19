import type { AgentInputItem } from "@openai/agents";
import { handoff } from "@openai/agents";
import {
	biomarkerAgent,
	generalAgent,
	healthZoneAgent,
	outOfRangeAgent,
	trendsAgent,
} from "../aware-health-agent.js";

/**
 * Filter input history for handoffs
 * Keeps only the most recent and relevant messages, including recent tool results
 */
function filterInputForHandoff(history: AgentInputItem[]): AgentInputItem[] {
	// Keep last 10 messages for context so specialist agents see recent tool outputs
	return history.slice(-10);
}

/**
 * Type for inputFilter callback parameter
 */
interface InputFilterParams {
	history: AgentInputItem[];
}

/**
 * Handoff to biomarker specialist
 * Use when user asks about a specific biomarker
 */
export const biomarkerHandoff = handoff({
	agent: biomarkerAgent,
	toolDescriptionOverride:
		"Hand off to biomarker specialist for detailed analysis of specific biomarkers, their values, reference ranges, and what they mean. Use when the user mentions a specific biomarker by name.",
	inputFilter: ({ history }: InputFilterParams) =>
		filterInputForHandoff(history),
} as unknown as Parameters<typeof handoff>[0]);

/**
 * Handoff to health zone specialist
 * Use when user asks about a health zone
 */
export const healthZoneHandoff = handoff({
	agent: healthZoneAgent,
	toolDescriptionOverride:
		"Hand off to health zone specialist for analysis of health zones like Heart, Liver, Metabolism, etc. Use when the user asks about a group of related biomarkers or a specific health zone.",
	inputFilter: ({ history }: InputFilterParams) =>
		filterInputForHandoff(history),
} as unknown as Parameters<typeof handoff>[0]);

/**
 * Handoff to out-of-range specialist
 * Use when user wants to review abnormal results
 */
export const outOfRangeHandoff = handoff({
	agent: outOfRangeAgent,
	toolDescriptionOverride:
		"Hand off to out-of-range specialist for prioritized review of biomarkers that are outside reference ranges. Use when the user asks about abnormal results, which markers need attention, or wants to review out-of-range values.",
	inputFilter: ({ history }: InputFilterParams) =>
		filterInputForHandoff(history),
} as unknown as Parameters<typeof handoff>[0]);

/**
 * Handoff to trends specialist
 * Use when user asks about changes over time
 */
export const trendsHandoff = handoff({
	agent: trendsAgent,
	toolDescriptionOverride:
		"Hand off to trends specialist for analysis of biomarker changes over time. Use when the user asks about trends, improvements, declining markers, or wants to compare results across tests.",
	inputFilter: ({ history }: InputFilterParams) =>
		filterInputForHandoff(history),
} as unknown as Parameters<typeof handoff>[0]);

/**
 * Handoff to general health expert
 * Use for general health questions
 */
export const generalHandoff = handoff({
	agent: generalAgent,
	toolDescriptionOverride:
		"Hand off to general health expert for educational health information and questions that don't fit into specific biomarker, health zone, or trend categories.",
	inputFilter: ({ history }: InputFilterParams) =>
		filterInputForHandoff(history),
} as unknown as Parameters<typeof handoff>[0]);

/**
 * All health handoffs for the manager agent
 */
export const healthHandoffs = [
	biomarkerHandoff,
	healthZoneHandoff,
	outOfRangeHandoff,
	trendsHandoff,
	generalHandoff,
];
