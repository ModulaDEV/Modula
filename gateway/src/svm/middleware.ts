/**
 * SVM x402 middleware.
 *
 * Mounted in front of POST /m/:agency/mcp/svm. Mirrors the EVM
 * middleware in src/x402/middleware.ts but settles via the SVM
 * facilitator and reads the SPL USDC mint per cluster.
 *
 *   missing PAYMENT-SIGNATURE  → 402 PAYMENT-REQUIRED  (challenge)
 *   present, invalid           → 402 with reason
 *   present, valid             → next() runs the handler
 *   handler succeeds           → /settle, attach PAYMENT-RESPONSE, 200
 *
 * The handler reads the JSON-RPC body to detect the method and skips
 * payment for tools/list / initialize.
 */
import type { Context, Next, MiddlewareHandler } from "hono";
import type { Address } from "viem";

import type { ModelRecord }    from "../chain/registry.js";
import type { Quote }          from "../chain/agency.js";
import type { SvmFacilitatorClient } from "./facilitator.js";
import type { Logger }         from "../log.js";

import { encodeRequirements, encodeSettlement } from "../x402/codec.js";
import { decodeSvmPayload } from "./codec.js";
import { quoteWrap }        from "../chain/agency.js";
import { readModelByAgency } from "../chain/registry.js";
import { PaymentRequired }   from "../errors.js";

import type { PaymentRequirements, X402Network } from "../x402/types.js";
import type { Clients }   from "../chain/clients.js";
import type { TtlCache }  from "../chain/cache.js";

interface Deps {
  clients:      Clients;
  facilitator:  SvmFacilitatorClient;
  registry:     Address;
  recordCache:  TtlCache<string, ModelRecord>;
  quoteCache:   TtlCache<string, Quote>;
  /** SVM network — must be one of "solana" or "solana-devnet". */
  network:      X402Network & ("solana" | "solana-devnet");
  /** Canonical USDC SPL mint pubkey (base58) for the configured cluster. */
  usdcMint:     string;
  log:          Logger;
}

export function svmMiddleware(deps: Deps): MiddlewareHandler {
  return async (c: Context, next: Next) => {
    const body   = await safeJson(c);
    const method = body?.method;
    if (method !== "tools/call") {
      c.set("rpc:body", body);
      return next();
    }

    const agency = c.req.param("agency") as Address;
    const record = await readModelByAgency(
      { clients: deps.clients, registry: deps.registry, cache: deps.recordCache },
      agency,
    );
    const quote = await quoteWrap({ clients: deps.clients, cache: deps.quoteCache }, agency);

    // SVM payTo is the creator's Solana treasury — currently the model's
    // EVM treasury address is reused as a placeholder until the registry
    // exposes a per-model SVM treasury column. The on-chain registry
    // upgrade is tracked separately; until then, models with no Solana
    // treasury cannot be paid via SVM and the facilitator will reject
    // the requirements at /verify time.
    const requirements: PaymentRequirements = {
      scheme:            "exact",
      network:           deps.network,
      maxAmountRequired: quote.total.toString(),
      asset:             deps.usdcMint,
      payTo:             record.treasury,
      resource:          c.req.url,
      description:       `inference · ${record.slug} · svm`,
      mimeType:          "application/json",
      maxTimeoutSeconds: 90,
    };

    const sig = c.req.header("PAYMENT-SIGNATURE");
    if (!sig) {
      c.header("PAYMENT-REQUIRED", encodeRequirements(requirements));
      return c.json(
        { error: { code: "payment_required", message: "x402 payment required (svm)" } },
        402,
      );
    }

    const payload = decodeSvmPayload(sig);

    // Cross-rail rejection — if the payload is for an EVM network or a
    // different SVM cluster than this gateway is configured for, fail
    // fast with a precise error message.
    if (payload.network !== deps.network) {
      c.header("PAYMENT-REQUIRED", encodeRequirements(requirements));
      return c.json(
        {
          error: {
            code:    "payment_network_mismatch",
            message: `this endpoint settles on ${deps.network}; payload network was ${payload.network}`,
          },
        },
        402,
      );
    }

    const verified = await deps.facilitator.verify(payload, requirements);
    if (!verified.isValid) {
      c.header("PAYMENT-REQUIRED", encodeRequirements(requirements));
      return c.json(
        {
          error: {
            code:    "payment_invalid",
            message: verified.invalidReason ?? "facilitator rejected payment",
          },
        },
        402,
      );
    }

    c.set("rpc:body", body);
    c.set("x402:agent",   verified.payer ?? payload.payload.payer);
    c.set("x402:paid",    quote.total);
    c.set("x402:record",  record);
    c.set("x402:reqs",    requirements);
    c.set("x402:payload", payload);

    const t0 = performance.now();
    await next();
    const lat = Math.round(performance.now() - t0);

    try {
      const settle = await deps.facilitator.settle(payload, requirements);
      if (!settle.success) {
        deps.log.error({ reason: settle.errorReason }, "svm_settle_failed");
        throw new PaymentRequired(
          `settle failed: ${settle.errorReason ?? "unknown"}`,
        );
      }
      c.header("PAYMENT-RESPONSE", encodeSettlement(settle));
      c.set("x402:txHash",  settle.txHash ?? null);
      c.set("x402:latency", lat);
    } catch (e) {
      deps.log.error({ err: e }, "svm_settle_error");
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
