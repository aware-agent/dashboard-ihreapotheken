/**
 * Simple rule-based scope classifier for companion queries.
 *
 * The goal is to detect clearly non-medical queries (e.g. weather, philosophy)
 * so we can return a short, friendly refusal without calling the LLM.
 */

export type QueryScope = "medical_or_unknown" | "non_medical";

// Keywords that strongly indicate a non‑medical topic.
// Keep this conservative – we only want to catch obviously out‑of‑scope queries.
const NON_MEDICAL_KEYWORDS: RegExp[] = [
	// Weather / travel time specific
	/\bweather\b/i,
	/\bforecast\b/i,
	/\brain\b/i,
	/\bsnow\b/i,
	/\btemperature\b/i,
	/\bberlin\b/i,
	// General chit‑chat / philosophy
	/\bmeaning of life\b/i,
	/\bphilosoph(y|ical)\b/i,
	/\btell me a joke\b/i,
	/\bjoke\b/i,
	/\bfun fact\b/i,
	// Productivity / work that is clearly not health related
	/\bproductivit(y|ies)\b/i,
	/\bcareer advice\b/i,
	/\binterview tips?\b/i,
	/\bstartup idea\b/i,
	// Finance / investing
	/\bstock market\b/i,
	/\bcrypto\b/i,
	/\bbitcoin\b/i,
	/\binvest(ing|ment)\b/i,
];

export function classifyQueryScope(message: string): QueryScope {
	const text = message.toLowerCase();

	for (const pattern of NON_MEDICAL_KEYWORDS) {
		if (pattern.test(text)) {
			return "non_medical";
		}
	}

	return "medical_or_unknown";
}

