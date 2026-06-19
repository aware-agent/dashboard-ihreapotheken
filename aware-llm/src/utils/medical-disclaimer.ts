/**
 * Decide whether we should keep an explicit "I'm not a doctor" style disclaimer.
 *
 * Goal: only include it when the user is asking for medical decisions such as
 * diagnosis, treatment, medication changes, or dosages.
 */

export function shouldIncludeMedicalDisclaimer(userMessage: string): boolean {
	const text = userMessage.toLowerCase();

	// Medication / dosage / prescriptions
	const medicationPatterns: RegExp[] = [
		/\b(medication|medicine|drug|prescription|rx|dose|dosage)\b/i,
		/\b(mg|milligrams?|mcg|micrograms?)\b/i,
		/\b(antibiotic|antidepressant|statin|metformin|insulin|levothyroxine)\b/i,
		/\b(ibuprofen|acetaminophen|paracetamol|naproxen|aspirin)\b/i,
		/\b(start|stop|discontinue|increase|decrease|switch)\b.*\b(med|meds|medication|medicine|dose|dosage)\b/i,
	];

	// Diagnosis / treatment requests
	const diagnosisOrTreatmentPatterns: RegExp[] = [
		/\b(diagnos(e|is)|do i have|is this (cancer|diabetes|hypothyroid|hyperthyroid))\b/i,
		/\b(treat(ment)?|therapy|cure|antivirals?|antifungals?)\b/i,
		/\b(what should i take|what can i take|should i take)\b/i,
	];

	return (
		medicationPatterns.some((p) => p.test(text)) ||
		diagnosisOrTreatmentPatterns.some((p) => p.test(text))
	);
}

/**
 * Remove common short disclaimers if they are not relevant.
 * This is intentionally conservative: it targets only well-known phrases.
 */
export function stripNonEssentialDisclaimers(text: string): string {
	const patterns: RegExp[] = [
		// Common first-sentence identity disclaimer variants
		/\b(i[’']?m|i am)\s+not\s+a\s+doctor[^.]*\.\s*/gi,
		/\b(i[’']?m|i am)\s+not\s+a\s+medical\s+professional[^.]*\.\s*/gi,
		// Generic "not medical advice" one-liners
		/\bthis\s+is\s+not\s+medical\s+advice[^.]*\.\s*/gi,
	];

	let out = text;
	for (const pattern of patterns) {
		out = out.replace(pattern, "");
	}

	// Clean up whitespace artifacts.
	out = out.replace(/\n{3,}/g, "\n\n").trim();
	return out;
}

