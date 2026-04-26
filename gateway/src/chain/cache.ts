/**
 * Tiny in-memory TTL cache.
 *
 * Used in front of registry reads and oracle quotes to flatten the
 * fan-out a busy MCP endpoint causes. Not an L2 cache — process-local
 * by design so a process restart starts cold and can never serve a
 * stale value across deploys.
 */

interface Entry<V> {
  value:     V;
  expiresAt: number;
}

export class TtlCache<K, V> {
  private store = new Map<K, Entry<V>>();
  constructor(private readonly defaultTtlMs: number) {}

  get(key: K): V | undefined {
    const e = this.store.get(key);
    if (!e) return undefined;
    if (e.expiresAt <= Date.now()) {
      this.store.delete(key);
      return undefined;
    }
    return e.value;
  }

  set(key: K, value: V, ttlMs: number = this.defaultTtlMs): void {
    this.store.set(key, { value, expiresAt: Date.now() + ttlMs });
  }

  delete(key: K): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  /** Resolve from cache or compute via the loader and memoize the result. */
  async getOrLoad(
    key: K,
    loader: () => Promise<V>,
    ttlMs: number = this.defaultTtlMs,
  ): Promise<V> {
    const hit = this.get(key);
    if (hit !== undefined) return hit;
    const value = await loader();
    this.set(key, value, ttlMs);
    return value;
  }

  size(): number {
    return this.store.size;
  }
}
