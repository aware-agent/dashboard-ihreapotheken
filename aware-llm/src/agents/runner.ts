import { Runner, type Agent } from "@openai/agents";
import type { AgentInputItem } from "@openai/agents";
import { tracingConfig } from "../config/tracing.js";
import type { AgentContext } from "./types.js";

type RunnerInstance = Runner;
type RunnerRun = RunnerInstance["run"];

export type RunnerRunInput = Parameters<RunnerRun>[1];
export type RunnerRunOptions = Parameters<RunnerRun>[2];

/**
 * Shared Runner instance for all agent executions.
 *
 * Centralizes global configuration like tracing so it does not need to be
 * repeated at every call site.
 */
export const runner = new Runner({
	tracing: tracingConfig,
});

/**
 * Helper to run an agent using the shared Runner instance.
 *
 * This mirrors the `run(agent, input, options)` utility signature from
 * `@openai/agents` while ensuring we consistently use the shared runner.
 */
export function runAgent(
	agent: Agent<AgentContext>,
	input: RunnerRunInput | AgentInputItem[] | string,
	options?: RunnerRunOptions,
) {
	return runner.run(agent, input as RunnerRunInput, options);
}

