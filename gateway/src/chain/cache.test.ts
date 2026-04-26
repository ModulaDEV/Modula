import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { TtlCache } from "./cache.js";

describe("TtlCache", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(()  => vi.useRealTimers());

  it("returns undefined on miss", () => {
    const c = new TtlCache<string, number>(1000);
    expect(c.get("x")).toBeUndefined();
  });

  it("returns set value before TTL expiry", () => {
    const c = new TtlCache<string, number>(1000);
    c.set("x", 42);
    vi.advanceTimersByTime(500);
    expect(c.get("x")).toBe(42);
  });

  it("evicts after TTL expires", () => {
    const c = new TtlCache<string, number>(1000);
    c.set("x", 42);
    vi.advanceTimersByTime(1001);
    expect(c.get("x")).toBeUndefined();
  });

  it("set with explicit ttlMs overrides default", () => {
    const c = new TtlCache<string, number>(1000);
    c.set("x", 42, 200);
    vi.advanceTimersByTime(201);
    expect(c.get("x")).toBeUndefined();
  });

  it("getOrLoad memoizes the loader", async () => {
    const c = new TtlCache<string, number>(1000);
    const loader = vi.fn().mockResolvedValue(7);
    expect(await c.getOrLoad("k", loader)).toBe(7);
    expect(await c.getOrLoad("k", loader)).toBe(7);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("getOrLoad re-invokes loader after TTL expiry", async () => {
    const c = new TtlCache<string, number>(1000);
    const loader = vi.fn().mockResolvedValueOnce(7).mockResolvedValueOnce(8);
    await c.getOrLoad("k", loader);
    vi.advanceTimersByTime(2000);
    const next = await c.getOrLoad("k", loader);
    expect(next).toBe(8);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("delete removes a key", () => {
    const c = new TtlCache<string, number>(1000);
    c.set("x", 42);
    c.delete("x");
    expect(c.get("x")).toBeUndefined();
  });

  it("clear removes all keys", () => {
    const c = new TtlCache<string, number>(1000);
    c.set("a", 1); c.set("b", 2);
    c.clear();
    expect(c.size()).toBe(0);
  });
});
