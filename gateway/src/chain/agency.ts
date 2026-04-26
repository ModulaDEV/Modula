/**
 * Read-side helpers for ModulaAgency — the curve oracle.
 *
 * The gateway calls quoteWrap before every paid tools/call to populate
 * the x402 PaymentRequirements amount. Cached for 2s (one Base block)
 * so a flurry of identical reads in the same block don't duplicate
 * RPC calls.
 */
import type { Address } from "viem";
import { modulaAgencyAbi } from "@modula/abi/agency";
import type { Clients }    from "./clients.js";
import type { TtlCache }   from "./cache.js";

export interface Quote {
  premium: bigint;   // base units of the reserve currency (USDC: 6 dp)
  fee:     bigint;
  total:   bigint;   // premium + fee, what the wallet pays
}

interface Deps {
  clients: Clients;
  cache:   TtlCache<string, Quote>;
}

/// @notice Quote the next mint along an Agency's bonding curve.
export async function quoteWrap(deps: Deps, agency: Address): Promise<Quote> {
  return deps.cache.getOrLoad(
    `wrap:${agency.toLowerCase()}`,
    async () => {
      const [premium, fee] = await deps.clients.read.readContract({
        address: agency,
        abi:     modulaAgencyAbi,
        functionName: "getWrapOracle",
        args: ["0x"],
      });
      return { premium, fee, total: premium + fee };
    },
    2_000,
  );
}

/// @notice Quote the next burn (unwrap) along the curve. Reverts on
///         empty curves (the contract surfaces this as Errors.CurveEmpty).
export async function quoteUnwrap(deps: Deps, agency: Address): Promise<Quote> {
  const [premium, fee] = await deps.clients.read.readContract({
    address: agency,
    abi:     modulaAgencyAbi,
    functionName: "getUnwrapOracle",
    args: ["0x"],
  });
  return { premium, fee, total: premium - fee };
}

/// @notice Read the static Asset record (currency, basePremium, fees,
///         feeRecipient). Doesn't change after Agency initialize, so
///         cached aggressively (10 minutes).
export async function readAsset(deps: Deps, agency: Address) {
  return deps.cache.getOrLoad(
    `asset:${agency.toLowerCase()}`,
    async () => {
      const [currency, basePremium, feeRecipient, mintFeePercent, burnFeePercent] =
        await deps.clients.read.readContract({
          address: agency,
          abi:     modulaAgencyAbi,
          functionName: "assetData",
          args: [],
        });
      return {
        currency, basePremium, feeRecipient, mintFeePercent, burnFeePercent,
      } as unknown as Quote; // typed below via cast in caller
    },
    600_000,
  ) as unknown as Promise<{
    currency: Address;
    basePremium: bigint;
    feeRecipient: Address;
    mintFeePercent: number;
    burnFeePercent: number;
  }>;
}
