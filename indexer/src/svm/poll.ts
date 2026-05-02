/**
 * SVM event-source poll loop.
 *
 * Tails SPL Token-2022 USDC transfers under tracked model treasury
 * ATAs and writes one row per observed transfer to svm_calls.
 *
 * Architecture:
 *   1. Load cursor (last_signature, last_slot) for the stream.
 *   2. Fetch all signatures since the cursor under each tracked
 *      treasury ATA via getSignaturesForAddress.
 *   3. For each signature, fetch the parsed transaction via
 *      getTransaction, extract the SPL transfer ix, derive
 *      (model_id, agent_pubkey, paid_usdc, slot).
 *   4. Insert into svm_calls (idempotent on tx_signature PK).
 *   5. Persist new cursor.
 *   6. Sleep SVM_POLL_INTERVAL_MS, repeat.
 *
 * The actual @solana/web3.js calls live in the SvmRpcClient
 * interface. This file only orchestrates the loop and uses an
 * abstracted client so:
 *   - tests can stub the RPC without spinning up a real cluster
 *   - the indexer doesn't pull in @solana/web3.js until SVM_ENABLED=true
 *
 * The default RPC client implementation lands in a subsequent commit
 * (svm/rpc.ts). For now this module just defines the interface and
 * the loop control flow.
 */
import type { Pool } from "pg";
import type { Logger } from "../log.js";

import { loadSvmCursor, saveSvmCursor, type SvmCursor } from "./cursor.js";
import { recordSvmCall, type SvmCallRow } from "./calls.js";
import { POLL_INTERVAL_MS, SIGNATURES_PER_TICK } from "./constants.js";

export interface SvmRpcClient {
  /// @notice Returns at most `limit` confirmed signatures referencing
  ///         `address`, oldest first. Pagination via the `until`
  ///         signature (RPC stops when it sees this signature).
  getSignaturesForAddress(
    address: string,
    opts?: { limit?: number; until?: string | null },
  ): Promise<Array<{ signature: string; slot: bigint; blockTime: number | null }>>;

  /// @notice Fetches the parsed transaction for a confirmed signature.
  ///         Returns null when the cluster has not yet observed the tx
  ///         (rare race when called too soon after submission).
  getParsedTransaction(signature: string): Promise<ParsedSvmTx | null>;
}

export interface ParsedSvmTx {
  signature:    string;
  slot:         bigint;
  /// @notice First SPL Token-2022 transferChecked or transfer ix
  ///         decoded into (source, destination, mint, amount).
  ///         null when no SPL transfer was found in the tx.
  transfer:     SvmSplTransfer | null;
}

export interface SvmSplTransfer {
  source_ata:      string;
  destination_ata: string;
  mint:            string;
  amount_units:    bigint;
  payer_pubkey:    string;
}

/**
 * Resolves a destination ATA to the model_id whose treasury it is.
 * The indexer needs this map to attribute SPL transfers to specific
 * Modula models. Implementation lands in a subsequent commit
 * alongside the model-treasury upgrade in the on-chain registry.
 */
export type ResolveTreasuryAta = (
  destinationAta: string,
) => Promise<{ model_id: Buffer } | null>;

export interface PollDeps {
  pool:              Pool;
  log:               Logger;
  rpc:               SvmRpcClient;
  network:           "solana" | "solana-devnet";
  /// @notice Treasury ATAs the indexer is tracking. Polled per-tick
  ///         in parallel; bound this list to ~50 in production.
  trackedAtas:       string[];
  resolveTreasuryAta: ResolveTreasuryAta;
}

export interface PollHandle {
  stop(): void;
}

const STREAM_NAME = "USDCTransfer";

/**
 * Boot the SVM poll loop. Returns a stop handle that the index.ts
 * shutdown sequence can call to drain the loop on SIGTERM.
 */
export function startSvmPoll(deps: PollDeps): PollHandle {
  let stopped = false;
  let inFlight: Promise<void> | null = null;

  const tick = async (): Promise<void> => {
    try {
      await pollOnce(deps);
    } catch (err) {
      deps.log.error({ err }, "svm_poll_tick_failed");
    }
  };

  const interval = setInterval(() => {
    if (stopped || inFlight) return;
    inFlight = tick().finally(() => {
      inFlight = null;
    });
  }, POLL_INTERVAL_MS);

  // Kick off the first tick immediately so the indexer doesn't wait
  // POLL_INTERVAL_MS after boot to record its first row.
  inFlight = tick().finally(() => {
    inFlight = null;
  });

  deps.log.info(
    { network: deps.network, atas: deps.trackedAtas.length },
    "svm_poll_started",
  );

  return {
    stop() {
      stopped = true;
      clearInterval(interval);
    },
  };
}

/**
 * One poll cycle. Exported for testing.
 */
export async function pollOnce(deps: PollDeps): Promise<void> {
  const cursor = await loadSvmCursor(deps.pool, STREAM_NAME);

  let observedHighestSlot = cursor.last_slot;
  let observedLatestSignature: string | null = cursor.last_signature;

  // Poll each tracked treasury ATA in parallel.
  await Promise.all(
    deps.trackedAtas.map((ata) =>
      pollOneAta(deps, ata, cursor).then((result) => {
        if (result.latestSlot > observedHighestSlot) {
          observedHighestSlot     = result.latestSlot;
          observedLatestSignature = result.latestSignature;
        }
      }),
    ),
  );

  if (
    observedLatestSignature !== cursor.last_signature ||
    observedHighestSlot     !== cursor.last_slot
  ) {
    await saveSvmCursor(deps.pool, {
      stream:         STREAM_NAME,
      last_signature: observedLatestSignature,
      last_slot:      observedHighestSlot,
    });
  }
}

interface PollAtaResult {
  latestSlot:      bigint;
  latestSignature: string | null;
}

async function pollOneAta(
  deps: PollDeps,
  ata: string,
  cursor: SvmCursor,
): Promise<PollAtaResult> {
  const sigs = await deps.rpc.getSignaturesForAddress(ata, {
    limit: SIGNATURES_PER_TICK,
    until: cursor.last_signature,
  });

  if (sigs.length === 0) {
    return { latestSlot: cursor.last_slot, latestSignature: cursor.last_signature };
  }

  // Resolve the destination ATA to a model id once per tick — same
  // ATA across all sigs in this batch, so we cache the lookup here
  // even though the recordSvmCall row needs it.
  const treasury = await deps.resolveTreasuryAta(ata);
  if (!treasury) {
    deps.log.warn({ ata }, "svm_poll_unmapped_ata");
    return { latestSlot: cursor.last_slot, latestSignature: cursor.last_signature };
  }

  let highestSlot      = cursor.last_slot;
  let latestSignature  = cursor.last_signature;

  for (const { signature, slot } of sigs) {
    const tx = await deps.rpc.getParsedTransaction(signature);
    if (!tx?.transfer) continue;
    if (tx.transfer.destination_ata !== ata) continue;

    const row: SvmCallRow = {
      tx_signature: signature,
      model_id:     treasury.model_id,
      agent_pubkey: tx.transfer.payer_pubkey,
      paid_usdc:    formatUsdc(tx.transfer.amount_units),
      network:      deps.network,
      slot,
    };
    await recordSvmCall(deps.pool, row);

    if (slot > highestSlot) {
      highestSlot     = slot;
      latestSignature = signature;
    }
  }

  return { latestSlot: highestSlot, latestSignature };
}

/// @notice Same 6-decimal USDC formatter as svm/amount.ts but inlined
///         to avoid re-exporting from this loop module. Kept tiny.
function formatUsdc(units: bigint): string {
  const SCALE = 1_000_000n;
  const whole = units / SCALE;
  const frac  = units % SCALE;
  return `${whole.toString()}.${frac.toString().padStart(6, "0")}`;
}
