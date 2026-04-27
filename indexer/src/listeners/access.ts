/**
 * ModelCalled listener.
 *
 * Tails ModulaAccessRouter.ModelCalled, writes one row per event to
 * `calls`. The event's `txHash` arg is the x402 USDC settlement tx
 * hash (not the AccessRouter.log() tx); EIP-3009 nonces guarantee
 * uniqueness so we use it as the table's PRIMARY KEY.
 *
 * Ordering invariant: this listener never advances past the registry
 * cursor. A ModelCalled event references a modelId that must already
 * exist in `models` (FK), so if the registry hasn't ingested up to
 * block N yet, neither does this one. The registry catches up first;
 * access follows.
 */
import { modulaAccessRouterAbi } from "@modula/abi/access";

import { hexToBytea }                from "./hex.js";
import { loadCursor, saveCursor }    from "./cursor.js";
import { pollLoop }                  from "./poll.js";
import { BlockTimes }                from "./blocks.js";
import { MAX_BLOCK_RANGE }           from "./types.js";
import type { Listener, ListenerDeps } from "./types.js";

const STREAM = "ModelCalled" as const;

export function createAccessListener(deps: ListenerDeps): Listener {
  async function tick(): Promise<void> {
    const cursor         = await loadCursor(deps.db.pool, STREAM);
    const registryCursor = await loadCursor(deps.db.pool, "ModelRegistered");
    const head           = await deps.client.getBlockNumber();
    const safeHead       = head - BigInt(deps.config.CONFIRMATIONS);

    // Never overtake the registry — calls FK to models(id), and a
    // ModelCalled at block N can only be ingested once registry has
    // also crossed block N.
    const upperBound = registryCursor < safeHead ? registryCursor : safeHead;

    const startBlock = cursor === 0n
      ? deps.config.START_BLOCK
      : cursor + 1n;
    if (startBlock > upperBound) return;

    const endBlock = startBlock + MAX_BLOCK_RANGE - 1n > upperBound
      ? upperBound
      : startBlock + MAX_BLOCK_RANGE - 1n;

    const logs = await deps.client.getContractEvents({
      address:   deps.config.addresses.accessRouter,
      abi:       modulaAccessRouterAbi,
      eventName: "ModelCalled",
      fromBlock: startBlock,
      toBlock:   endBlock,
    });

    if (logs.length === 0) {
      await deps.db.withTx((c) => saveCursor(c, STREAM, endBlock));
      return;
    }

    const blockTimes = new BlockTimes(deps.client);

    await deps.db.withTx(async (client) => {
      for (const log of logs) {
        const modelId   = log.args.modelId;
        const agent     = log.args.agent;
        const paid      = log.args.paidUSDC;
        const latencyMs = log.args.latencyMs;
        const txHash    = log.args.txHash;
        if (!modelId || !agent || paid == null || latencyMs == null || !txHash) continue;

        const ts = await blockTimes.at(log.blockNumber);

        await client.query(
          `INSERT INTO calls
             (tx_hash, model_id, agent, paid_usdc, latency_ms, ts)
           VALUES
             ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (tx_hash) DO NOTHING`,
          [
            hexToBytea(txHash),
            hexToBytea(modelId),
            hexToBytea(agent),
            formatUsdc(paid),
            Number(latencyMs),
            ts.toISOString(),
          ],
        );
      }
      await saveCursor(client, STREAM, endBlock);
    });

    deps.log.info(
      {
        listener: "access",
        count:    logs.length,
        from:     startBlock.toString(),
        to:       endBlock.toString(),
      },
      "access_ingested",
    );
  }

  return {
    async start() {
      await pollLoop({
        name:       "access",
        intervalMs: deps.config.POLL_INTERVAL_MS,
        abort:      deps.abort,
        log:        deps.log,
        tick,
      });
    },
  };
}

function formatUsdc(amount: bigint): string {
  const s    = amount.toString().padStart(7, "0");
  const head = s.slice(0, -6) || "0";
  const tail = s.slice(-6);
  return `${head}.${tail}`;
}
