/**
 * Exact 6-decimal USDC string arithmetic.
 *
 * Postgres NUMERIC(38, 6) round-trips through pg as a string. Any
 * client-side arithmetic that converts to JS Number loses precision
 * past 2^53 base units (about ~9 billion USDC, but the principle
 * matters at any scale). The two helpers here keep the math in
 * string-decimal space.
 */

const SCALE = 1_000_000n;

/// @notice Convert "1.50" → 1500000n. Pads / truncates to exactly 6
///         fractional digits so all sum() inputs share a base.
function toUnits(s: string): bigint {
  if (s === "" || s == null) return 0n;
  const [whole, frac = ""] = s.split(".");
  return BigInt((whole ?? "0") + frac.padEnd(6, "0").slice(0, 6));
}

/// @notice Convert 1500000n → "1.500000" with always-6 fractional digits.
function fromUnits(units: bigint): string {
  const whole = units / SCALE;
  const frac  = units % SCALE;
  return `${whole.toString()}.${frac.toString().padStart(6, "0")}`;
}

/// @notice Sum any number of exact-decimal USDC strings without losing precision.
export function sumUsdc(...strings: string[]): string {
  const total = strings.reduce<bigint>((acc, s) => acc + toUnits(s), 0n);
  return fromUnits(total);
}
