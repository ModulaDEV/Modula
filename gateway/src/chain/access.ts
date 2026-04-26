/**
 * Write-side helper for ModulaAccessRouter.
 *
 * The gateway calls log() once per successful x402-paid tools/call.
 * The call is gated by gatewaySigner on-chain; this module signs and
 * broadcasts the tx via the WalletClient configured in clients.ts.
 *
 * If the gateway is running in read-only mode (no signer configured),
 * `logAccess` is a no-op and emits a warn-level log line so we notice.
 */
import type { Address, Hash } from "viem";
import { modulaAccessRouterAbi } from "@modula/abi/access";

import type { Clients } from "./clients.js";
import type { Logger }  from "../log.js";

export interface AccessLog {
  modelId:   `0x${string}`;
  agent:     Address;
  paidUSDC:  bigint;
  latencyMs: number;
  txHash:    `0x${string}`;
}

interface Deps {
  clients:      Clients;
  accessRouter: Address;
  log:          Logger;
}

/// @notice Submit a ModelCalled event via AccessRouter.log().
///         Returns the tx hash, or null in read-only mode.
export async function logAccess(deps: Deps, entry: AccessLog): Promise<Hash | null> {
  if (!deps.clients.write || !deps.clients.signerAddress) {
    deps.log.warn(
      { modelId: entry.modelId },
      "access_log_skipped_no_signer",
    );
    return null;
  }
  const account = deps.clients.signerAddress;

  const txHash = await deps.clients.write.writeContract({
    address: deps.accessRouter,
    abi:     modulaAccessRouterAbi,
    functionName: "log",
    args: [
      entry.modelId,
      entry.agent,
      entry.paidUSDC,
      BigInt(entry.latencyMs),
      entry.txHash,
    ],
    account,
    chain:   deps.clients.read.chain,
  });

  deps.log.info(
    {
      modelId: entry.modelId,
      agent:   entry.agent,
      paid:    entry.paidUSDC.toString(),
      latency: entry.latencyMs,
      tx:      txHash,
    },
    "access_log_submitted",
  );
  return txHash;
}
