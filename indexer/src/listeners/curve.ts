/**
 * Wrap / Unwrap listener.
 *
 * Tails Wrap and Unwrap on every per-model ModulaAgency the indexer
 * knows about. The Agency set is read from the `models` table at the
 * top of each tick — no in-process channel between this listener and
 * the registry one, so they can run independently and even on
 * separate processes if we ever scale that way.
 *
 * Schema invariant: cursor.event_name in ('Wrap','Unwrap') exists per
 * 002_cursor.sql. We treat them as a single logical "AgencyEvents"
 * cursor — both rows advance to the same end block in one tx — so the
 * two streams stay aligned.
 *
 * supply_after is approximated as `tokenId` for wraps and `tokenId - 1`
 * for unwraps. This is exact when tokens mint strictly monotonically
 * (the v1 ModulaApp behaviour); a future commit can compute it from
 * `App.totalSupply()` at block height for full correctness.
 */
import type { Address } from "viem";
import { modulaAgencyAbi } from "@modula/abi/agency";

import { byteaToHex, hexToBytea }   from "./hex.js";
import { loadCursor, saveCursor }   from "./cursor.js";
import { pollLoop }                 from "./poll.js";
import { BlockTimes }               from "./blocks.js";
import { MAX_BLOCK_RANGE }          from "./types.js";
import type { Listener, ListenerDeps } from "./types.js";

export function createCurveListener(deps: ListenerDeps): Listener {
  async function tick(): Promise<void> {
    // 1. Discover known Agencies from the models table.
    const { rows: modelRows } = await deps.db.pool.query<{
      id:     Buffer;
      agency: Buffer;
    }>("SELECT id, agency FROM models");

    if (modelRows.length === 0) return;

    const agencies = modelRows.map((r) => byteaToHex(r.agency) as Address);
    const idByAgency = new Map<string, Buffer>(
      modelRows.map((r) => [byteaToHex(r.agency).toLowerCase(), r.id]),
    );

    // 2. Pick a unified cursor (Wrap/Unwrap stay aligned).
    const wrapCursor   = await loadCursor(deps.db.pool, "Wrap");
    const unwrapCursor = await loadCursor(deps.db.pool, "Unwrap");
    const cursor       = wrapCursor < unwrapCursor ? wrapCursor : unwrapCursor;

    const head     = await deps.client.getBlockNumber();
    const safeHead = head - BigInt(deps.config.CONFIRMATIONS);

    const startBlock = cursor === 0n
      ? deps.config.START_BLOCK
      : cursor + 1n;
    if (startBlock > safeHead) return;

    const endBlock = startBlock + MAX_BLOCK_RANGE - 1n > safeHead
      ? safeHead
      : startBlock + MAX_BLOCK_RANGE - 1n;

    // 3. Pull both event streams across all agencies in two getLogs calls.
    const [wrapLogs, unwrapLogs] = await Promise.all([
      deps.client.getContractEvents({
        address:   agencies,
        abi:       modulaAgencyAbi,
        eventName: "Wrap",
        fromBlock: startBlock,
        toBlock:   endBlock,
      }),
      deps.client.getContractEvents({
        address:   agencies,
        abi:       modulaAgencyAbi,
        eventName: "Unwrap",
        fromBlock: startBlock,
        toBlock:   endBlock,
      }),
    ]);

    const blockTimes = new BlockTimes(deps.client);

    if (wrapLogs.length === 0 && unwrapLogs.length === 0) {
      await deps.db.withTx(async (c) => {
        await saveCursor(c, "Wrap",   endBlock);
        await saveCursor(c, "Unwrap", endBlock);
      });
      return;
    }

    // 4. Insert all events transactionally, advance both cursors.
    await deps.db.withTx(async (client) => {
      for (const log of wrapLogs) {
        const modelId = idByAgency.get(log.address.toLowerCase());
        if (!modelId) continue; // event from a contract we don't track
        const tokenId = log.args.tokenId;
        const premium = log.args.premium;
        if (tokenId == null || premium == null) continue;
        const ts = await blockTimes.at(log.blockNumber);
        await client.query(
          `INSERT INTO curve_ticks
             (model_id, block_number, tx_hash, kind, supply_after, price_usdc, ts)
           VALUES
             ($1, $2, $3, 'wrap', $4, $5, $6)
           ON CONFLICT (model_id, block_number, tx_hash) DO NOTHING`,
          [
            modelId,
            log.blockNumber.toString(),
            hexToBytea(log.transactionHash),
            tokenId.toString(),
            formatUsdc(premium),
            ts.toISOString(),
          ],
        );
      }

      for (const log of unwrapLogs) {
        const modelId = idByAgency.get(log.address.toLowerCase());
        if (!modelId) continue;
        const tokenId = log.args.tokenId;
        const premium = log.args.premium;
        if (tokenId == null || premium == null) continue;
        const supplyAfter = tokenId > 0n ? tokenId - 1n : 0n;
        const ts = await blockTimes.at(log.blockNumber);
        await client.query(
          `INSERT INTO curve_ticks
             (model_id, block_number, tx_hash, kind, supply_after, price_usdc, ts)
           VALUES
             ($1, $2, $3, 'unwrap', $4, $5, $6)
           ON CONFLICT (model_id, block_number, tx_hash) DO NOTHING`,
          [
            modelId,
            log.blockNumber.toString(),
            hexToBytea(log.transactionHash),
            supplyAfter.toString(),
            formatUsdc(premium),
            ts.toISOString(),
          ],
        );
      }

      await saveCursor(client, "Wrap",   endBlock);
      await saveCursor(client, "Unwrap", endBlock);
    });

    deps.log.info(
      {
        listener: "curve",
        wraps:    wrapLogs.length,
        unwraps:  unwrapLogs.length,
        from:     startBlock.toString(),
        to:       endBlock.toString(),
      },
      "curve_ingested",
    );
  }

  return {
    async start() {
      await pollLoop({
        name:       "curve",
        intervalMs: deps.config.POLL_INTERVAL_MS,
        abort:      deps.abort,
        log:        deps.log,
        tick,
      });
    },
  };
}

/// Convert a 6-decimal USDC base-units bigint to a numeric(38,6) string.
function formatUsdc(amount: bigint): string {
  const s    = amount.toString().padStart(7, "0");
  const head = s.slice(0, -6) || "0";
  const tail = s.slice(-6);
  return `${head}.${tail}`;
}
