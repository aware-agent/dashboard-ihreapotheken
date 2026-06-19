/**
 * Lightweight token counting utilities.
 */

/**
 * Estimate the number of tokens in a piece of text.
 * Assumes 3.5 characters per token on average, which is a reasonable
 * compromise between natural language and JSON/code content.
 */
export function estimateTokens(text: string): number {
	if (!text) return 0;
	const avgCharsPerToken = 3.5;
	return Math.ceil(text.length / avgCharsPerToken);
}

/**
 * Estimate tokens for an array of messages of the form { role, content }.
 */
export function estimateTokensForMessages(
	messages: Array<{ role: string; content: string }>,
): number {
	return messages.reduce(
		(total, msg) => total + estimateTokens(msg.content),
		0,
	);
}

