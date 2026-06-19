import type { OutputGuardrail } from "@openai/agents";
import { logger } from "../../utils/logger.js";

/**
 * Patterns that indicate prohibited medical advice in output
 */
const PROHIBITED_OUTPUT_PATTERNS = [
	// Specific dosage recommendations
	/\b(you should take \d+\s*(mg|milligrams?|pills?|tablets?|capsules?))\b/i,
	/\b(take \d+\s*(mg|milligrams?) (of|daily|twice|three times))\b/i,
	// Direct diagnosis statements
	/\b(you (have|definitely have|clearly have) (cancer|diabetes|heart disease|HIV|AIDS))\b/i,
	/\b(I diagnose you with)\b/i,
	/\b(this (confirms|proves|means) you have)\b/i,
	// Medication change instructions
	/\b(stop taking your (medication|medicine|prescription))\b/i,
	/\b(discontinue (your|the) (medication|medicine|treatment))\b/i,
	/\b(double your (dose|dosage|medication))\b/i,
	// Alarming language
	/\b(you (will|are going to) die)\b/i,
	/\b(this is (fatal|terminal|deadly) unless)\b/i,
	/\b(you (must|need to) (immediately|urgently) (go to|visit) (the hospital|ER|emergency))\b/i,
];

/**
 * Medical Advice Output Guardrail
 * Prevents the agent from outputting prohibited medical advice
 */
export const medicalAdviceGuardrail: OutputGuardrail = {
	name: "medical_advice_check",
	execute: async ({ agentOutput }) => {
		const text =
			typeof agentOutput === "string"
				? agentOutput
				: JSON.stringify(agentOutput);

		const hasProhibitedContent = PROHIBITED_OUTPUT_PATTERNS.some((pattern) =>
			pattern.test(text),
		);

		if (hasProhibitedContent) {
			logger.warn("Prohibited medical advice detected in output", {
				outputLength: text.length,
				matchedPattern: PROHIBITED_OUTPUT_PATTERNS.find((p) => p.test(text))
					?.source,
			});
		}

		return {
			outputInfo: {
				hasProhibitedContent,
				matchedPattern: hasProhibitedContent
					? PROHIBITED_OUTPUT_PATTERNS.find((p) => p.test(text))?.source
					: null,
			},
			tripwireTriggered: hasProhibitedContent,
		};
	},
};

/**
 * PII patterns to detect in output
 */
const PII_PATTERNS = [
	// Email addresses
	/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
	// Phone numbers (various formats)
	/\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g,
	// German phone numbers
	/\b(?:\+49|0049|0)[\s]?[1-9][0-9]{1,4}[\s]?[0-9]{4,12}\b/g,
	// Social security / ID numbers (generic patterns)
	/\b[0-9]{3}[-\s]?[0-9]{2}[-\s]?[0-9]{4}\b/g,
	// Credit card numbers (basic pattern)
	/\b(?:[0-9]{4}[-\s]?){3}[0-9]{4}\b/g,
];

/**
 * PII Redaction Output Guardrail
 * Detects and blocks output containing personally identifiable information
 */
export const piiRedactionGuardrail: OutputGuardrail = {
	name: "pii_redaction_check",
	execute: async ({ agentOutput }) => {
		const text =
			typeof agentOutput === "string"
				? agentOutput
				: JSON.stringify(agentOutput);

		const containsPII = PII_PATTERNS.some((pattern) => pattern.test(text));

		if (containsPII) {
			logger.warn("PII detected in output", {
				outputLength: text.length,
			});
		}

		return {
			outputInfo: {
				containsPII,
			},
			tripwireTriggered: containsPII,
		};
	},
};

/**
 * Check for missing disclaimer
 */
const DISCLAIMER_PATTERNS = [
	/educational purposes only/i,
	/not medical advice/i,
	/consult.*healthcare professional/i,
	/consult.*doctor/i,
	/speak.*healthcare provider/i,
];

/**
 * Disclaimer Check Output Guardrail
 * Ensures responses include appropriate medical disclaimer
 * Note: This is informational only, doesn't block output
 */
export const disclaimerCheckGuardrail: OutputGuardrail = {
	name: "disclaimer_check",
	execute: async ({ agentOutput }) => {
		const text =
			typeof agentOutput === "string"
				? agentOutput
				: JSON.stringify(agentOutput);

		const hasDisclaimer = DISCLAIMER_PATTERNS.some((pattern) =>
			pattern.test(text),
		);

		if (!hasDisclaimer) {
			logger.debug("Output missing standard disclaimer", {
				outputLength: text.length,
			});
		}

		// Don't trip the wire, just log for monitoring
		return {
			outputInfo: {
				hasDisclaimer,
			},
			tripwireTriggered: false,
		};
	},
};

/**
 * All output guardrails for the health agent
 */
export const outputGuardrails: OutputGuardrail[] = [
	medicalAdviceGuardrail,
	piiRedactionGuardrail,
	disclaimerCheckGuardrail,
];
