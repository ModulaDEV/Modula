/**
 * Multi-model chaining — modula.pipeline()
 *
 * runPipeline() executes a sequence of model calls where the output of
 * each step feeds as input to the next. Every hop pays independently via
 * auto-pay (EIP-3009). Returns the full result array so callers can
 * inspect intermediate outputs.
 *
 * Each PipelineStep can declare an optional mapInput() to reshape the
 * previous MCPCallResult into the next model's argument shape. Without
 * mapInput the raw MCPCallResult is passed through as-is.
 */
import type { MCPCallResult } from "./types.js";
import type { AutoPaySigner }  from "./autopay.js";
import type { RegistryClient } from "./registry.js";
import type { GatewayClient }  from "./gateway.js";

export interface PipelineStep {
  /** Registry slug of the model to call, e.g. "solidity-audit-v3". */
  slug:     string;
  /** MCP tool name exposed by that model. */
  toolName: string;
  /**
   * Optional transform applied to the previous step's MCPCallResult to
   * produce this step's argument. When omitted the raw MCPCallResult is
   * forwarded as-is.
   */
  mapInput?: (prev: MCPCallResult) => unknown;
}

/**
 * Run a sequential pipeline of model calls with auto-pay at each hop.
 *
 * @param steps    Ordered list of pipeline steps
 * @param input    Initial input passed to the first step
 * @param signer   AutoPaySigner (viem WalletClient or { address, signTypedData })
 * @param registry RegistryClient used to resolve each slug → agency address
 * @param gateway  GatewayClient used to call each model and handle 402
 * @returns        Array of MCPCallResult — one per step, in order
 */
export async function runPipeline(
  steps:    PipelineStep[],
  input:    unknown,
  signer:   AutoPaySigner,
  registry: RegistryClient,
  gateway:  GatewayClient,
): Promise<MCPCallResult[]> {
  const results: MCPCallResult[] = [];
  let current: unknown = input;

  for (const step of steps) {
    const model = await registry.get(step.slug);
    const args  = step.mapInput
      ? step.mapInput(results[results.length - 1] ?? { content: [] })
      : current;

    const result = await gateway.callToolWithAutoPay(
      model.agency,
      step.toolName,
      args,
      signer,
    );

    results.push(result);
    current = result;
  }

  return results;
}
