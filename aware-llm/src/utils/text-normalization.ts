/**
 * Lightweight post-processing for assistant responses.
 *
 * - Softens alarmist phrasing (e.g. "extremely high") into neutral language.
 * - Strips long boilerplate legal disclaimers that the UI already covers.
 */

const ALARMIST_PHRASES: Array<{ pattern: RegExp; replacement: string }> = [
	{ pattern: /\bextremely high\b/gi, replacement: "high" },
	{ pattern: /\bextremely low\b/gi, replacement: "low" },
	{ pattern: /\bdangerously high\b/gi, replacement: "high and out of range" },
	{ pattern: /\bdangerously low\b/gi, replacement: "low and out of range" },
	{ pattern: /\bseverely (high|elevated)\b/gi, replacement: "high" },
	{ pattern: /\bseverely low\b/gi, replacement: "low" },
];


// Match with optional leading/trailing asterisks and flexible spacing.
const LEGAL_DISCLAIMER_REGEX =
	/\*?\s*This information is for educational purposes only and is not medical advice\. Please consult with a healthcare professional for personalized medical guidance\.\s*\*?/gi;

// Remove medical professional section headings if present (keep response concise).
const CLINICIAN_SECTION_REGEX =
	/\n?##?\s*When to Talk to (a|your) medical professional[\s\S]*?(?=\n##\s|\n#\s|$)/gi;

const FOLLOW_UP_HEADING_REGEX =
	/^\s*(##\s*)?(Overview|What Stands Out|How These Markers Relate|Practical Next Steps|When to Talk to (a|your) medical professional)\s*:?$/gim;

export function normalizeAssistantText(raw: string): string {
	let text = raw;

	for (const { pattern, replacement } of ALARMIST_PHRASES) {
		text = text.replace(pattern, replacement);
	}

	// Remove old long-form legal disclaimer if present.
	text = text.replace(LEGAL_DISCLAIMER_REGEX, "").trim();
	// Remove clinician section if present.
	text = text.replace(CLINICIAN_SECTION_REGEX, "").trim();

	// Collapse excessive blank lines created by removals.
	text = text.replace(/\n{3,}/g, "\n\n");

	return text;
}

export function stripFollowUpStructure(raw: string): string {
	let text = raw.replace(FOLLOW_UP_HEADING_REGEX, "");
	text = text.replace(/\n{3,}/g, "\n\n").trim();
	return text;
}

