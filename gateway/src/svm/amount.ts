/**
 * USDC amount helpers for the SVM x402 path.
 *
 * USDC on Solana has 6 decimals (matches Base USDC), so all amount
 * conversion follows the same 10^6 base-unit rule. Kept in a tiny
 * module of its own so the SDK and gateway can both import without
 * pulling in the entire SVM stack.
 */
import { USDC_DECIMALS } from "./constants.js";

const SCALE = 10n ** BigInt(USDC_DECIMALS);

/**
 * Convert a human-readable USDC string ("1.50") to base units (1500000n).
 *
 * @throws Error  if `usdc` has more than 6 decimal places (would lose precision).
 */
export function toBaseUnits(usdc: string): bigint {
  const trimmed = usdc.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error(`invalid USDC amount: ${usdc}`);
  }
  const [whole, frac = ""] = trimmed.split(".");
  if (frac.length > USDC_DECIMALS) {
    throw new Error(
      `USDC amount has ${frac.length} decimals; max is ${USDC_DECIMALS}`,
    );
  }
  const padded = frac.padEnd(USDC_DECIMALS, "0");
  return BigInt(whole + padded);
}

/**
 * Convert base units (1500000n) to a human-readable USDC string ("1.500000").
 *
 * Always emits 6 fractional digits to match Solana SPL display
 * conventions. Trim trailing zeroes at the call site if a tighter
 * display is wanted.
 */
export function fromBaseUnits(units: bigint): string {
  if (units < 0n) throw new Error(`USDC amount is negative: ${units}`);
  const whole = units / SCALE;
  const frac  = units % SCALE;
  return `${whole.toString()}.${frac.toString().padStart(USDC_DECIMALS, "0")}`;
}
