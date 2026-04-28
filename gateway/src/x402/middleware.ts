/**
 * x402 middleware.
 *
 *   missing PAYMENT-SIGNATURE  -> 402 PAYMENT-REQUIRED  (challenge)
 *   present, invalid           -> 402 with reason
 *   present, valid             -> next() runs the handler
 *   handler succeeds           -> /settle, attach PAYMENT-RESPONSE, 200
 *
 * Wired in front of POST /m/:agency/mcp for tools/call only. The
 * handler reads the JSON-RPC body to detect the method.
 */
import type { Context, Next, MiddlewareHandler } from "hono";
import type { Address } from "viem";

import type { ModelRecord }    from "../chain/registry.js";
import type { Quote }          from "../chain/agency.js";
import type { FacilitatorClient } from "./facilitator.js";
import type { Logger }         from "../log.js";

import { encodeRequirements, encodeSettlement, decodePayment } from "./codec.js";
import { quoteWrap, readAsset } from "../chain/agency.js";
import { readModelByAgency }    from "../chain/registry.js";
import { PaymentRequired }      from "../errors.js";
import { holderDiscountBps, applyDiscount } from "../chain/discount.js";

import type { PaymentRequirements, X402Network } from "./types.js";
import type { Clients }   from "../chain/clients.js";
import type { TtlCache }  from "../chain/cache.js";

interface Deps {
  clients:            Clients;
  facilitator:        FacilitatorClient;
  registry:           Address;
  recordCache:        TtlCache<string, ModelRecord>;
  quoteCache:         TtlCache<string, Quote>;
  network:            X402Network;
  log:                Logger;
  modulaTokenAddress: Address | undefined;
}

export function x402Middleware(deps: Deps): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    // Skip x402 for non-paid methods. We only gate `tools/call`.
    const body  = await safeJson(c);
    const method = body?.method;
    if (method !== "tools/call") {
      // Still hand the body downstream — replay it via context.
      c.set("rpc:body", body);
      return next();
    }

    const agency = c.req.param("agency") as Address;
    const record = await readModelByAgency(
      { clients: deps.clients, registry: deps.registry, cache: deps.recordCache },
      agency,
    );
    const asset = await readAsset({ clients: deps.clients, cache: deps.quoteCache as never }, agency);
    const quote = await quoteWrap({ clients: deps.clients, cache: deps.quoteCache }, agency);

    // Resolve discount: use X-Wallet-Address hint at challenge time,
    // or the verified payer on the retry with PAYMENT-SIGNATURE.
    const walletHint = c.req.header("X-Wallet-Address") as Address | undefined;
    const discountBps = await holderDiscountBps(
      deps.clients.read,
      deps.modulaTokenAddress,
      walletHint ?? ("0x0000000000000000000000000000000000000000" as Address),
    );
    const discountedAmount = applyDiscount(quote.total, discountBps);

    const requirements: PaymentRequirements = {
      scheme:            "exact",
      network:           deps.network,
      maxAmountRequired: discountedAmount.toString(),
      asset:             asset.currency,
      payTo:             record.treasury,
      resource:          c.req.url,
      description:       `inference · ${record.slug}`,
      mimeType:          "application/json",
      maxTimeoutSeconds: 60,
    };

    const sig = c.req.header("PAYMENT-SIGNATURE");
    if (!sig) {
      c.header("PAYMENT-REQUIRED", encodeRequirements(requirements));
      return c.json(
        { error: { code: "payment_required", message: "x402 payment required" } },
        402,
      );
    }

    const payload  = decodePayment(sig);

    // Re-derive discount using the actual payer from the signed authorization
    // (more trustworthy than the hint header).
    const payer = payload.payload.authorization.from as Address;
    const payerDiscountBps = await holderDiscountBps(
      deps.clients.read,
      deps.modulaTokenAddress,
      payer,
    );
    const payerAmount = applyDiscount(quote.total, payerDiscountBps);
    const payerRequirements = payerDiscountBps !== discountBps
      ? { ...requirements, maxAmountRequired: payerAmount.toString() }
      : requirements;

    const verified = await deps.facilitator.verify(payload, payerRequirements);
    if (!verified.isValid) {
      c.header("PAYMENT-REQUIRED", encodeRequirements(payerRequirements));
      return c.json(
        {
          error: {
            code: "payment_invalid",
            message: verified.invalidReason ?? "facilitator rejected payment",
          },
        },
        402,
      );
    }

    // Stash for the handler — it picks up agent + paid + record + quote.
    c.set("rpc:body", body);
    c.set("x402:agent",   verified.payer ?? payload.payload.authorization.from);
    c.set("x402:paid",    payerAmount);
    c.set("x402:record",  record);
    c.set("x402:reqs",    payerRequirements);
    c.set("x402:payload", payload);

    const t0 = performance.now();
    await next();
    const lat = Math.round(performance.now() - t0);

    // Settlement happens regardless of handler outcome — the inference
    // was *served* (or attempted). Settling gives the user back a tx
    // hash they can verify on-chain.
    try {
      const settle = await deps.facilitator.settle(payload, payerRequirements);
      if (!settle.success) {
        deps.log.error({ reason: settle.errorReason }, "x402_settle_failed");
        throw new PaymentRequired(
          `settle failed: ${settle.errorReason ?? "unknown"}`,
        );
      }
      c.header("PAYMENT-RESPONSE", encodeSettlement(settle));
      c.set("x402:txHash", settle.txHash ?? null);
      c.set("x402:latency", lat);
    } catch (e) {
      deps.log.error({ err: e }, "x402_settle_error");
      throw e;
    }
  };
}

async function safeJson(c: Context): Promise<{ method?: string } | null> {
  try {
    return (await c.req.json()) as { method?: string };
  } catch {
    return null;
  }
}
