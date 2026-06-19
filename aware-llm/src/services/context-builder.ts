import type { ChatContext } from "../agents/types.js";
import { estimateTokens } from "../utils/token-counter.js";
import type { StoredMessage } from "./message-service.js";
import type { ConversationSummaryData } from "./summary-service.js";

const SYSTEM_PROMPT = `You are Aware, a friendly health companion that helps users understand their lab results and biomarkers.

## Context Awareness

This conversation may include:
1. Summarized history: Earlier parts of our conversation condensed into a summary. Treat this as reliable context.
2. Recent messages: The last few exchanges in full detail.
3. Domain data: Health metrics, biomarkers, and results relevant to the current question.

## Guidelines

- Be conversational and supportive, not clinical.
- When domain data is provided, focus on the primary topic indicated, but use other data if it helps explain connections.
- If something was discussed in the summarized history, you can reference it naturally.
- For health advice, always encourage consulting a healthcare provider.

## Response Style

- Use clear, simple language.
- Structure responses with headers and bullets for readability.
- Highlight actionable insights when relevant.`;

export interface DomainDataInput {
	context?: ChatContext & {
		primaryFocus?: string;
	};
}

export interface BuiltContext {
	messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
	summaryTokens: number;
	recentTokens: number;
	domainTokens: number;
}

export interface ContextBuilderConfig {
	maxSummaryTokens: number;
	maxDomainTokens: number;
	maxRecentTokens: number;
}

const DEFAULT_CONFIG: ContextBuilderConfig = {
	maxSummaryTokens: 1000,
	maxDomainTokens: 2000,
	maxRecentTokens: 3500,
};

export function formatDomainDataForLLM(
	input: DomainDataInput | undefined,
): string | null {
	if (!input?.context || !input.context.type || !input.context.data) return null;

	const { type, primaryFocus, data } = input.context;

	if (type === "healthZone" && typeof data === "object" && data !== null) {
		type HealthZonePayload = {
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

		const payload = data as HealthZonePayload;
		const zone = payload.healthZone ?? {};
		const biomarkers = payload.biomarkers ?? [];
		const latestResultDate = payload.latestResultDate;

		let text = `## Health Zone: ${zone.name ?? "Unknown"}\n`;
		if (primaryFocus) {
			text += `*Primary focus of this question: ${primaryFocus}*\n\n`;
		}
		if (zone.description) {
			text += `${zone.description}\n\n`;
		}
		if (latestResultDate) {
			text += `Results as of ${latestResultDate}\n\n`;
		}

		if (Array.isArray(biomarkers) && biomarkers.length > 0) {
			text += "### Biomarker Results\n\n";
			text += "| Marker | Value | Status | Reference |\n";
			text += "|--------|-------|--------|-----------|\n";

			for (const bm of biomarkers) {
				const name = bm.name ?? "Unknown";
				const value =
					bm.valueText ??
					(bm.value !== undefined ? String(bm.value) : "n/a");
				const unit = bm.unit ?? "";
				const status = bm.biomarkerStatus ?? "UNKNOWN";
				const range =
					bm.range && bm.range[0] !== null && bm.range[1] !== null
						? `${bm.range[0]}-${bm.range[1]} ${unit}`
						: "";
				text += `| ${name} | ${value} ${unit} | ${status} | ${range} |\n`;
			}
			text += "\n";
		}

		return text;
	}

	if (type === "biomarker" && typeof data === "object" && data !== null) {
		type BiomarkerPayload = {
			id?: string;
			name?: string;
			code?: string;
			value?: number;
			unit?: string;
			status?: string;
			range?: [number | null, number | null];
			optimalRange?: [number | null, number | null];
			history?: Array<{ date: string; value: number }>;
		};

		const bm = data as BiomarkerPayload;
		let text = `## Biomarker Focus: ${bm.name ?? "Unknown biomarker"}\n`;
		if (primaryFocus) {
			text += `*Primary focus of this question: ${primaryFocus}*\n\n`;
		}
		if (bm.value !== undefined && bm.unit) {
			text += `**Current Value**: ${bm.value} ${bm.unit}`;
			if (bm.status) {
				text += ` (${bm.status})`;
			}
			text += "\n";
		}
		if (bm.range && bm.range[0] !== null && bm.range[1] !== null) {
			text += `- Reference range: ${bm.range[0]}-${bm.range[1]} ${
				bm.unit ?? ""
			}\n`;
		}
		if (
			bm.optimalRange &&
			bm.optimalRange[0] !== null &&
			bm.optimalRange[1] !== null
		) {
			text += `- Optimal range: ${bm.optimalRange[0]}-${bm.optimalRange[1]} ${
				bm.unit ?? ""
			}\n`;
		}
		if (Array.isArray(bm.history) && bm.history.length > 0) {
			type HistoryPoint = { date: string; value: number };
			const history = bm.history as HistoryPoint[];
			text += "\n**Recent Trend**:\n";
			for (const point of history) {
				text += `- ${point.date}: ${point.value} ${bm.unit ?? ""}\n`;
			}
		}
		return text;
	}

	if (type === "general") {
		type GeneralPayload = {
			results?: unknown[];
			result?: unknown;
			biomarkers?: unknown[];
		};

		const general = data as GeneralPayload;
		let text = "## Current Results Context\n";
		if (primaryFocus) {
			text += `*Primary focus of this question: ${primaryFocus}*\n\n`;
		}
		text += JSON.stringify(general, null, 2);
		return text;
	}

	if (type === "bioAge" && typeof data === "object" && data !== null) {
		type BioAgePayload = {
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

		const d = data as BioAgePayload;
		let text = "## Biological Age Context\n";
		if (primaryFocus) {
			text += `*Primary focus of this question: ${primaryFocus}*\n\n`;
		}
		if (typeof d.bioAge === "number") {
			text += `Biological age: ${d.bioAge} years\n`;
		}
		if (typeof d.chronologicalAge === "number") {
			text += `Chronological age: ${d.chronologicalAge} years\n`;
		}
		if (typeof d.difference === "number") {
			const dir = d.difference < 0 ? "younger" : "older";
			text += `Difference: ${Math.abs(d.difference)} years ${dir}\n`;
		}
		if (
			Array.isArray(d.negativeContributions) &&
			d.negativeContributions.length
		) {
			text += "\nBiomarkers contributing most to older bio age:\n";
			for (const c of d.negativeContributions) {
				text += `- ${c.biomarkerName}: ${c.value} ${
					c.unit ?? ""
				} (adds +${c.contribution} years)\n`;
			}
		}
		return text;
	}

	return null;
}

export function buildLLMContext(options: {
	summary: ConversationSummaryData | null;
	recentMessages: StoredMessage[];
	domainData?: DomainDataInput;
	currentUserMessage: string;
	config?: ContextBuilderConfig;
}): BuiltContext {
	const config = options.config ?? DEFAULT_CONFIG;
	const messages: BuiltContext["messages"] = [];

	messages.push({ role: "system", content: SYSTEM_PROMPT });

	let summaryTokens = 0;
	if (options.summary) {
		const content = `## Conversation Summary\n${options.summary.content}`;
		summaryTokens = estimateTokens(content);
		if (summaryTokens > config.maxSummaryTokens) {
			summaryTokens = config.maxSummaryTokens;
		}
		messages.push({ role: "system", content });
	}

	let domainTokens = 0;
	const domainText = formatDomainDataForLLM(options.domainData);
	if (domainText) {
		domainTokens = estimateTokens(domainText);
		if (domainTokens > config.maxDomainTokens) {
			domainTokens = config.maxDomainTokens;
		}
		messages.push({
			role: "system",
			content: `## Current Health Context\n${domainText}`,
		});
	}

	const historyMessages: StoredMessage[] = [];
	let historyTokens = 0;

	for (const m of options.recentMessages) {
		const tokens = estimateTokens(m.content);
		if (historyTokens + tokens > config.maxRecentTokens) {
			continue;
		}
		historyTokens += tokens;
		historyMessages.push(m);
	}

	for (const m of historyMessages) {
		messages.push({
			role: m.role,
			content: m.content,
		});
	}

	messages.push({ role: "user", content: options.currentUserMessage });

	return {
		messages,
		summaryTokens,
		recentTokens: historyTokens,
		domainTokens,
	};
}

