/**
 * ModelRegistered listener.
 *
 * Tails ModulaRegistry.ModelRegistered and writes one row per event to
 * `models`. The cursor advance happens in the same transaction as the
 * inserts so a crash never leaves the cursor ahead of the data.
 *
 * The agency address per model is stored in `models.agency`, so the
 * curve listener can discover all known Agencies by querying that
 * table at the start of each tick — no in-process callback needed
 * between the two listeners.
 *
 * Replay strategy: one polling tick processes at most MAX_BLOCK_RANGE
 * blocks. On a fresh boot against a chain with deep history this means
 * many ticks before we catch up to head; the loop backs off naturally
 * once cursor catches the safe head.
 */
import type { Address } from "viem";
import { modulaRegistryAbi } from "@modula/abi/registry";

import { hexToBytea }                from "./hex.js";
import { loadCursor, saveCursor }    from "./cursor.js";
import { pollLoop }                  from "./poll.js";
import { MAX_BLOCK_RANGE }           from "./types.js";
import type { Listener, ListenerDeps } from "./types.js";

const STREAM = "ModelRegistered" as const;

export function createRegistryListener(deps: ListenerDeps): Listener {
  async function tick(): Promise<void> {
    const cursor   = await loadCursor(deps.db.pool, STREAM);
    const head     = await deps.client.getBlockNumber();
    const safeHead = head - BigInt(deps.config.CONFIRMATIONS);

    const startBlock = cursor === 0n
      ? deps.config.START_BLOCK
      : cursor + 1n;

    if (startBlock > safeHead) return;

    const endBlock = startBlock + MAX_BLOCK_RANGE - 1n > safeHead
      ? safeHead
      : startBlock + MAX_BLOCK_RANGE - 1n;

    const logs = await deps.client.getContractEvents({
      address:   deps.config.addresses.registry,
      abi:       modulaRegistryAbi,
      eventName: "ModelRegistered",
      fromBlock: startBlock,
      toBlock:   endBlock,
    });

    if (logs.length === 0) {
      // Empty range — still advance the cursor so we don't re-scan
      // empty blocks every tick.
      await deps.db.withTx((c) => saveCursor(c, STREAM, endBlock));
      return;
    }

    await deps.db.withTx(async (client) => {
      for (const log of logs) {
        const id     = log.args.id;
        const record = log.args.record;
        if (!id || !record) continue;

        await client.query(
          `INSERT INTO models
             (id, slug, agency, app, creator, treasury,
              base_model, model_type, manifest_uri,
              registered_at, registered_tx)
           VALUES
             ($1, $2, $3, $4, $5, $6,
              $7, $8, $9,
              to_timestamp($10), $11)
           ON CONFLICT (id) DO NOTHING`,
          [
            hexToBytea(id),
            record.slug,
            hexToBytea(record.agency as Address),
            hexToBytea(record.app as Address),
            hexToBytea(record.creator as Address),
            hexToBytea(record.treasury as Address),
            record.baseModel,
            record.modelType,
            record.manifestURI,
            Number(record.registeredAt),
            hexToBytea(log.transactionHash),
          ],
        );
      }
      await saveCursor(client, STREAM, endBlock);
    });

    deps.log.info(
      {
        listener: "registry",
        count:    logs.length,
        from:     startBlock.toString(),
        to:       endBlock.toString(),
      },
      "registry_ingested",
    );
  }

  return {
    async start() {
      await pollLoop({
        name:       "registry",
        intervalMs: deps.config.POLL_INTERVAL_MS,
        abort:      deps.abort,
        log:        deps.log,
        tick,
      });
    },
  };
}
