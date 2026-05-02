/**
 * USDC base-unit conversion helpers for the SDK SVM path.
 *
 * USDC on Solana has 6 decimals (matches Base USDC). Duplicates the
 * gateway/src/svm/amount.ts logic — the SDK is shipped to public
 * npm and cannot depend on the workspace gateway package.
 */

const USDC_DECIMALS = 6;
const SCALE = 10n ** BigInt(USDC_DECIMALS);

/**
 * Convert a human-readable USDC string ("1.50") to base units (1500000n).
 *
 * @throws Error  if `usdc` has more than 6 decimal places (would lose precision).
 */
export function svmToBaseUnits(usdc: string): bigint {
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
 */
export function svmFromBaseUnits(units: bigint): string {
  if (units < 0n) throw new Error(`USDC amount is negative: ${units}`);
  const whole = units / SCALE;
  const frac  = units % SCALE;
  return `${whole.toString()}.${frac.toString().padStart(USDC_DECIMALS, "0")}`;
}
