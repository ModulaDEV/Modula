import { describe, it, expect } from "vitest";
import { svmToBaseUnits, svmFromBaseUnits } from "./svm-amount.js";

describe("svmToBaseUnits", () => {
  it("converts whole-number amounts", () => {
    expect(svmToBaseUnits("0")).toBe(0n);
    expect(svmToBaseUnits("1")).toBe(1_000_000n);
    expect(svmToBaseUnits("1000")).toBe(1_000_000_000n);
  });

  it("converts amounts with fractional digits", () => {
    expect(svmToBaseUnits("1.5")).toBe(1_500_000n);
    expect(svmToBaseUnits("0.5")).toBe(500_000n);
    expect(svmToBaseUnits("0.000001")).toBe(1n);
    expect(svmToBaseUnits("12.345678")).toBe(12_345_678n);
  });

  it("strips surrounding whitespace", () => {
    expect(svmToBaseUnits("  1.50  ")).toBe(1_500_000n);
  });

  it("rejects more than 6 fractional digits", () => {
    expect(() => svmToBaseUnits("0.1234567")).toThrow(/max is 6/);
  });

  it("rejects scientific notation", () => {
    expect(() => svmToBaseUnits("1e6")).toThrow(/invalid USDC amount/);
  });

  it("rejects negative amounts", () => {
    expect(() => svmToBaseUnits("-1.0")).toThrow(/invalid USDC amount/);
  });

  it("rejects empty input", () => {
    expect(() => svmToBaseUnits("")).toThrow(/invalid USDC amount/);
  });

  it("rejects non-numeric input", () => {
    expect(() => svmToBaseUnits("hello")).toThrow(/invalid USDC amount/);
    expect(() => svmToBaseUnits("1.0 USDC")).toThrow(/invalid USDC amount/);
  });
});

describe("svmFromBaseUnits", () => {
  it("converts whole-number base units", () => {
    expect(svmFromBaseUnits(0n)).toBe("0.000000");
    expect(svmFromBaseUnits(1_000_000n)).toBe("1.000000");
    expect(svmFromBaseUnits(1_000_000_000n)).toBe("1000.000000");
  });

  it("converts fractional base units", () => {
    expect(svmFromBaseUnits(1_500_000n)).toBe("1.500000");
    expect(svmFromBaseUnits(500_000n)).toBe("0.500000");
    expect(svmFromBaseUnits(1n)).toBe("0.000001");
    expect(svmFromBaseUnits(12_345_678n)).toBe("12.345678");
  });

  it("rejects negative base units", () => {
    expect(() => svmFromBaseUnits(-1n)).toThrow(/negative/);
  });
});
