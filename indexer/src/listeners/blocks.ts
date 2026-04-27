/**
 * Per-tick block timestamp cache.
 *
 * Multiple events can land in the same block (a busy Wrap minute will
 * batch several into one Base block). Caching block→timestamp inside a
 * single tick eliminates duplicate getBlock RPCs against the provider.
 *
 * Cache lives for the lifetime of one tick — small (bounded by the
 * range we ingest per tick) and discarded between ticks so old blocks
 * don't pin memory.
 */
import type { PublicClient } from "viem";

export class BlockTimes {
  private readonly cache = new Map<bigint, Date>();

  constructor(private readonly client: PublicClient) {}

  async at(blockNumber: bigint): Promise<Date> {
    const cached = this.cache.get(blockNumber);
    if (cached) return cached;
    const block = await this.client.getBlock({ blockNumber });
    const ts = new Date(Number(block.timestamp) * 1000);
    this.cache.set(blockNumber, ts);
    return ts;
  }
}
