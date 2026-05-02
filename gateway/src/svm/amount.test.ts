import { describe, it, expect } from "vitest";
import { toBaseUnits, fromBaseUnits } from "./amount.js";

describe("toBaseUnits", () => {
  it("converts whole-number amounts", () => {
    expect(toBaseUnits("0")).toBe(0n);
    expect(toBaseUnits("1")).toBe(1_000_000n);
    expect(toBaseUnits("1000")).toBe(1_000_000_000n);
  });

  it("converts amounts with fractional digits", () => {
    expect(toBaseUnits("1.5")).toBe(1_500_000n);
    expect(toBaseUnits("0.5")).toBe(500_000n);
    expect(toBaseUnits("0.000001")).toBe(1n);
    expect(toBaseUnits("12.345678")).toBe(12_345_678n);
  });

  it("strips surrounding whitespace", () => {
    expect(toBaseUnits("  1.50  ")).toBe(1_500_000n);
  });

  it("rejects more than 6 fractional digits", () => {
    expect(() => toBaseUnits("0.1234567")).toThrow(/max is 6/);
  });

  it("rejects scientific notation", () => {
    expect(() => toBaseUnits("1e6")).toThrow(/invalid USDC amount/);
  });

  it("rejects negative amounts", () => {
    expect(() => toBaseUnits("-1.0")).toThrow(/invalid USDC amount/);
  });

  it("rejects empty input", () => {
    expect(() => toBaseUnits("")).toThrow(/invalid USDC amount/);
  });

  it("rejects non-numeric input", () => {
    expect(() => toBaseUnits("hello")).toThrow(/invalid USDC amount/);
    expect(() => toBaseUnits("1.0 USDC")).toThrow(/invalid USDC amount/);
  });
});

describe("fromBaseUnits", () => {
  it("converts whole-number base units", () => {
    expect(fromBaseUnits(0n)).toBe("0.000000");
    expect(fromBaseUnits(1_000_000n)).toBe("1.000000");
    expect(fromBaseUnits(1_000_000_000n)).toBe("1000.000000");
  });

  it("converts fractional base units", () => {
    expect(fromBaseUnits(1_500_000n)).toBe("1.500000");
    expect(fromBaseUnits(500_000n)).toBe("0.500000");
    expect(fromBaseUnits(1n)).toBe("0.000001");
    expect(fromBaseUnits(12_345_678n)).toBe("12.345678");
  });

  it("rejects negative base units", () => {
    expect(() => fromBaseUnits(-1n)).toThrow(/negative/);
  });
});

describe("toBaseUnits / fromBaseUnits round-trip", () => {
  it("round-trips a representative set of amounts", () => {
    const cases = ["0.000001", "0.5", "1.000000", "12.345678", "1000.000000"];
    for (const c of cases) {
      expect(fromBaseUnits(toBaseUnits(c))).toBe(c.padEnd(c.indexOf(".") + 7, "0"));
    }
  });
});
