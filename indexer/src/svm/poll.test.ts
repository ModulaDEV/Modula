/**
 * Tests for the SVM poll loop with a stubbed SvmRpcClient.
 *
 * No real Solana cluster, no testcontainer — these tests verify the
 * control flow (cursor advance, ATA filtering, idempotent insert call
 * shape) using in-memory fakes. The DB writer side (recordSvmCall +
 * loadSvmCursor + saveSvmCursor) is verified separately in the
 * integration suite that needs a real Postgres.
 */
import { describe, it, expect, vi } from "vitest";
import { pollOnce, type SvmRpcClient, type PollDeps, type ResolveTreasuryAta } from "./poll.js";

const NOOP_LOG = {
  trace: () => {}, debug: () => {}, info: () => {},
  warn:  () => {}, error: () => {}, fatal: () => {},
  child: function () { return this; },
} as unknown as PollDeps["log"];

function fakeRpc(
  signatures: Array<{ signature: string; slot: bigint; blockTime: number | null }>,
  parsed: Record<string, Awaited<ReturnType<SvmRpcClient["getParsedTransaction"]>>>,
): SvmRpcClient {
  return {
    getSignaturesForAddress: async () => signatures,
    getParsedTransaction:    async (sig) => parsed[sig] ?? null,
  };
}

const FAKE_ATA = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const FAKE_PAYER = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const FAKE_MODEL_ID = Buffer.alloc(32, 0x11);

const resolveAlwaysModel: ResolveTreasuryAta = async () => ({
  model_id: FAKE_MODEL_ID,
});
const resolveNeverFound: ResolveTreasuryAta = async () => null;

interface MockPool {
  query: ReturnType<typeof vi.fn>;
}

function fakePool(initialCursor: { last_signature: string | null; last_slot: bigint }): MockPool {
  return {
    query: vi.fn().mockImplementation((sql: string) => {
      if (sql.includes("FROM svm_indexer_cursor")) {
        return Promise.resolve({
          rows: [{
            last_signature: initialCursor.last_signature,
            last_slot:      initialCursor.last_slot.toString(),
          }],
        });
      }
      // recordSvmCall + saveSvmCursor inserts return nothing meaningful
      return Promise.resolve({ rows: [] });
    }),
  };
}

describe("pollOnce — empty signature list", () => {
  it("does not write anything when the RPC returns no new signatures", async () => {
    const pool = fakePool({ last_signature: null, last_slot: 0n });
    const rpc = fakeRpc([], {});

    await pollOnce({
      pool: pool as never,
      log: NOOP_LOG,
      rpc,
      network: "solana-devnet",
      trackedAtas: [FAKE_ATA],
      resolveTreasuryAta: resolveAlwaysModel,
    });

    // Only the cursor load query — no inserts, no cursor save.
    const inserts = pool.query.mock.calls.filter(([sql]: [string]) =>
      sql.includes("INSERT INTO svm_calls") || sql.includes("INSERT INTO svm_indexer_cursor"),
    );
    expect(inserts).toHaveLength(0);
  });
});

describe("pollOnce — unmapped ATA", () => {
  it("skips ATAs that resolveTreasuryAta cannot map", async () => {
    const pool = fakePool({ last_signature: null, last_slot: 0n });
    const rpc = fakeRpc(
      [{ signature: "sig1", slot: 100n, blockTime: 1 }],
      {
        sig1: {
          signature: "sig1",
          slot: 100n,
          transfer: {
            source_ata: "src", destination_ata: FAKE_ATA, mint: "m",
            amount_units: 1_000_000n, payer_pubkey: FAKE_PAYER,
          },
        },
      },
    );

    await pollOnce({
      pool: pool as never,
      log: NOOP_LOG,
      rpc,
      network: "solana-devnet",
      trackedAtas: [FAKE_ATA],
      resolveTreasuryAta: resolveNeverFound,
    });

    const inserts = pool.query.mock.calls.filter(([sql]: [string]) =>
      sql.includes("INSERT INTO svm_calls"),
    );
    expect(inserts).toHaveLength(0);
  });
});

describe("pollOnce — happy path", () => {
  it("writes a row + advances the cursor when a new transfer is observed", async () => {
    const pool = fakePool({ last_signature: null, last_slot: 0n });
    const rpc = fakeRpc(
      [{ signature: "sig-new", slot: 200n, blockTime: 1 }],
      {
        "sig-new": {
          signature: "sig-new",
          slot: 200n,
          transfer: {
            source_ata: "src", destination_ata: FAKE_ATA, mint: "m",
            amount_units: 1_500_000n, payer_pubkey: FAKE_PAYER,
          },
        },
      },
    );

    await pollOnce({
      pool: pool as never,
      log: NOOP_LOG,
      rpc,
      network: "solana-devnet",
      trackedAtas: [FAKE_ATA],
      resolveTreasuryAta: resolveAlwaysModel,
    });

    const callInserts = pool.query.mock.calls.filter(([sql]: [string]) =>
      sql.includes("INSERT INTO svm_calls"),
    );
    expect(callInserts).toHaveLength(1);
    const [, insertParams] = callInserts[0]!;
    expect(insertParams[0]).toBe("sig-new");          // tx_signature
    expect(insertParams[2]).toBe(FAKE_PAYER);         // agent_pubkey
    expect(insertParams[3]).toBe("1.500000");         // paid_usdc canonical 6dp
    expect(insertParams[4]).toBe("solana-devnet");    // network
    expect(insertParams[5]).toBe("200");              // slot as string

    const cursorSaves = pool.query.mock.calls.filter(([sql]: [string]) =>
      sql.includes("INSERT INTO svm_indexer_cursor"),
    );
    expect(cursorSaves).toHaveLength(1);
    const [, cursorParams] = cursorSaves[0]!;
    expect(cursorParams[1]).toBe("sig-new");          // last_signature
    expect(cursorParams[2]).toBe("200");              // last_slot
  });

  it("ignores transfers whose destination_ata does not match the polled ATA", async () => {
    const pool = fakePool({ last_signature: null, last_slot: 0n });
    const rpc = fakeRpc(
      [{ signature: "sig-wrong", slot: 200n, blockTime: 1 }],
      {
        "sig-wrong": {
          signature: "sig-wrong", slot: 200n,
          transfer: {
            source_ata: "src", destination_ata: "different-ata", mint: "m",
            amount_units: 1_000_000n, payer_pubkey: FAKE_PAYER,
          },
        },
      },
    );

    await pollOnce({
      pool: pool as never,
      log: NOOP_LOG,
      rpc,
      network: "solana-devnet",
      trackedAtas: [FAKE_ATA],
      resolveTreasuryAta: resolveAlwaysModel,
    });

    const inserts = pool.query.mock.calls.filter(([sql]: [string]) =>
      sql.includes("INSERT INTO svm_calls"),
    );
    expect(inserts).toHaveLength(0);
  });
});
