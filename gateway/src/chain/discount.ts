/**
 * $MODULA holder discount.
 *
 * Tiers:
 *   ≥ 10 000 $MODULA  → 20 % off inference price
 *   ≥  1 000 $MODULA  → 10 % off
 *   <  1 000           →  0 % (no discount)
 *
 * The token is not live yet — this module is a no-op when
 * MODULA_TOKEN_ADDRESS is unset.
 */
import type { Address, PublicClient } from "viem";

const ERC20_BALANCE_OF = [
  {
    name: "balanceOf",
    type: "function",
    stateMutability: "view",
    inputs:  [{ name: "account", type: "address" }],
    outputs: [{ name: "",        type: "uint256" }],
  },
] as const;

const TIER_HIGH  = BigInt(10_000) * BigInt(1e18);
const TIER_MID   = BigInt( 1_000) * BigInt(1e18);

export type DiscountBps = 0 | 1000 | 2000; // basis points

/**
 * Returns the discount in basis points for `holder` against the
 * $MODULA token contract. Returns 0 when `tokenAddress` is not
 * provided (feature disabled).
 */
export async function holderDiscountBps(
  client:       PublicClient,
  tokenAddress: Address | undefined,
  holder:       Address,
): Promise<DiscountBps> {
  if (!tokenAddress) return 0;

  try {
    const balance = await client.readContract({
      address:      tokenAddress,
      abi:          ERC20_BALANCE_OF,
      functionName: "balanceOf",
      args:         [holder],
    });

    if (balance >= TIER_HIGH) return 2000;
    if (balance >= TIER_MID)  return 1000;
    return 0;
  } catch {
    // RPC failure — fail open (no discount), never block inference.
    return 0;
  }
}

/** Apply a bps discount to a raw bigint amount. */
export function applyDiscount(amount: bigint, discountBps: DiscountBps): bigint {
  if (discountBps === 0) return amount;
  return amount - (amount * BigInt(discountBps)) / BigInt(10_000);
}
