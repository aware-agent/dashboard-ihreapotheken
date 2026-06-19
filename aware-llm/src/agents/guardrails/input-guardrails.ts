import type { InputGuardrail } from "@openai/agents";
import { logger } from "../../utils/logger.js";

/**
 * Patterns that indicate a medical emergency
 * These should trigger immediate redirection to emergency services
 */
const EMERGENCY_PATTERNS = [
	// Cardiac emergencies
	/\b(heart attack|chest pain|can't breathe|cannot breathe|difficulty breathing|shortness of breath)\b/i,
	// Stroke signs
	/\b(stroke|face drooping|arm weakness|speech difficulty|sudden numbness)\b/i,
	// Mental health emergencies
	/\b(suicid|kill myself|want to die|end my life|self.?harm)\b/i,
	// Poisoning/overdose
	/\b(overdos|poison|took too many pills|accidental ingestion)\b/i,
	// Severe allergic reactions
	/\b(anaphyla|severe allergic|throat closing|can't swallow)\b/i,
	// Unconsciousness
	/\b(unconscious|passed out|not responding|fainted and)\b/i,
	// Severe bleeding
	/\b(severe bleeding|won't stop bleeding|massive blood loss)\b/i,
];

/**
 * Medical Emergency Guardrail
 * Detects emergency medical queries and blocks processing
 */
export const medicalEmergencyGuardrail: InputGuardrail = {
	name: "medical_emergency_check",
	execute: async ({ input }) => {
		const text = typeof input === "string" ? input : JSON.stringify(input);

		const isEmergency = EMERGENCY_PATTERNS.some((pattern) =>
			pattern.test(text),
		);

		if (isEmergency) {
			logger.warn("Medical emergency detected in input", {
				inputLength: text.length,
			});
		}

		return {
			outputInfo: {
				isEmergency,
				matchedPattern: isEmergency
					? EMERGENCY_PATTERNS.find((p) => p.test(text))?.source
					: null,
			},
			tripwireTriggered: isEmergency,
		};
	},
};

/**
 * Patterns that indicate requests for specific medical advice
 * These are inappropriate for the AI to answer
 */
const INAPPROPRIATE_REQUEST_PATTERNS = [
	// Dosage requests
	/\b(how (much|many) (mg|milligrams?|pills?|tablets?|capsules?) (should|can|do) I take)\b/i,
	/\b(what (dose|dosage) (of|for|should))\b/i,
	// Medication changes
	/\b(should I (stop|start|change|increase|decrease|double) (my|the) (medication|medicine|prescription|dose))\b/i,
	// Self-diagnosis requests
	/\b(do I have (cancer|diabetes|heart disease|HIV|AIDS|tumor|disease))\b/i,
	/\b(diagnose me|what disease do I have|what's wrong with me medically)\b/i,
	// Image interpretation
	/\b(look at (this|my) (scan|x-?ray|MRI|CT|ultrasound|image))\b/i,
	/\b(interpret (this|my) (scan|x-?ray|MRI|CT|ultrasound))\b/i,
];

/**
 * Inappropriate Content Guardrail
 * Blocks requests for specific medical advice that AI shouldn't provide
 */
export const inappropriateContentGuardrail: InputGuardrail = {
	name: "inappropriate_content_check",
	execute: async ({ input }) => {
		const text = typeof input === "string" ? input : JSON.stringify(input);

		const isInappropriate = INAPPROPRIATE_REQUEST_PATTERNS.some((pattern) =>
			pattern.test(text),
		);

		if (isInappropriate) {
			logger.info("Inappropriate medical request detected", {
				inputLength: text.length,
			});
		}

		return {
			outputInfo: {
				isInappropriate,
				matchedPattern: isInappropriate
					? INAPPROPRIATE_REQUEST_PATTERNS.find((p) => p.test(text))?.source
					: null,
			},
			tripwireTriggered: isInappropriate,
		};
	},
};

/**
 * Patterns that indicate potential prompt injection attempts
 */
const INJECTION_PATTERNS = [
	/\b(ignore (previous|all|your) instructions?)\b/i,
	/\b(you are now|pretend (to be|you're)|act as|roleplay as)\b/i,
	/\b(system prompt|reveal your (instructions?|prompt|rules))\b/i,
	/\b(disregard (safety|guidelines|rules|restrictions))\b/i,
	/\b(jailbreak|DAN mode|developer mode)\b/i,
];

/**
 * Prompt Injection Guardrail
 * Detects and blocks prompt injection attempts
 */
export const promptInjectionGuardrail: InputGuardrail = {
	name: "prompt_injection_check",
	execute: async ({ input }) => {
		const text = typeof input === "string" ? input : JSON.stringify(input);

		const isInjection = INJECTION_PATTERNS.some((pattern) =>
			pattern.test(text),
		);

		if (isInjection) {
			logger.warn("Potential prompt injection detected", {
				inputLength: text.length,
			});
		}

		return {
			outputInfo: {
				isInjection,
				matchedPattern: isInjection
					? INJECTION_PATTERNS.find((p) => p.test(text))?.source
					: null,
			},
			tripwireTriggered: isInjection,
		};
	},
};

/**
 * All input guardrails for the health agent
 */
export const inputGuardrails: InputGuardrail[] = [
	medicalEmergencyGuardrail,
	inappropriateContentGuardrail,
	promptInjectionGuardrail,
];
