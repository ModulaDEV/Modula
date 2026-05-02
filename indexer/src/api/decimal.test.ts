import { describe, it, expect } from "vitest";
import { sumUsdc } from "./decimal.js";

describe("sumUsdc", () => {
  it("returns 0.000000 for an empty argument list", () => {
    expect(sumUsdc()).toBe("0.000000");
  });

  it("returns the canonical form of a single argument", () => {
    expect(sumUsdc("1.5")).toBe("1.500000");
    expect(sumUsdc("1.500000")).toBe("1.500000");
  });

  it("sums two amounts", () => {
    expect(sumUsdc("1.000000", "2.000000")).toBe("3.000000");
    expect(sumUsdc("0.5", "0.5")).toBe("1.000000");
  });

  it("sums many amounts", () => {
    expect(sumUsdc("0.1", "0.2", "0.3", "0.4")).toBe("1.000000");
  });

  it("handles fractional amounts smaller than the scale", () => {
    expect(sumUsdc("0.000001", "0.000001")).toBe("0.000002");
    expect(sumUsdc("0.000999", "0.000001")).toBe("0.001000");
  });

  it("does not lose precision past JS Number range", () => {
    // 2^53 ≈ 9_007_199_254_740_992 base units = ~9 billion USDC.
    // Sum two amounts that would overflow JS Number; verify the
    // sum is exact.
    const huge = "9007199254.740992"; // 9_007_199_254_740_992 base units
    expect(sumUsdc(huge, huge)).toBe("18014398509.481984");
  });

  it("treats empty strings as 0", () => {
    expect(sumUsdc("", "1.5")).toBe("1.500000");
  });

  it("truncates inputs with > 6 fractional digits to 6", () => {
    // Defensive: a malformed input shouldn't crash the route, but
    // we don't claim to round — we truncate. Documented behavior.
    expect(sumUsdc("1.1234567")).toBe("1.123456");
  });
});
