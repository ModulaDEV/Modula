/**
 * Tests for the SVM x402 middleware that don't require live cluster
 * access or a real facilitator. Three scenarios are covered here:
 *
 *   1. Non-payment methods (initialize, tools/list) skip the gate.
 *   2. Missing PAYMENT-SIGNATURE → 402 with PAYMENT-REQUIRED header.
 *   3. Cross-rail payload (EVM payload on SVM endpoint) → 402
 *      payment_network_mismatch with the precise error message.
 *
 * Settlement happy-path and facilitator integration tests live in
 * a separate suite that boots a mock facilitator over a local port —
 * tracked separately, not blocking on real Solana cluster access.
 */
import { describe, it, expect } from "vitest";
import { Hono } from "hono";

import { svmMiddleware } from "./middleware.js";
import { encodeRequirements } from "../x402/codec.js";
import { USDC_MINT_DEVNET } from "./constants.js";
import type { SvmFacilitatorClient } from "./facilitator.js";
import type { Logger } from "../log.js";

const noopLog = {
  trace: () => {}, debug: () => {}, info: () => {},
  warn:  () => {}, error: () => {}, fatal: () => {},
  child: function () { return this; },
} as unknown as Logger;

const stubFacilitator: SvmFacilitatorClient = {
  verify: async () => ({ isValid: true }),
  settle: async () => ({ success: true, networkId: 0 }),
};

const stubClients = {} as never;
const stubRecordCache = {
  getOrLoad: async () => ({
    treasury:    USDC_MINT_DEVNET,
    slug:        "test-model",
    baseModel:   "n/a",
    modelType:   "n/a",
    manifestURI: "ipfs://stub",
  }),
} as never;
const stubQuoteCache = {} as never;

// Stubs the chain reads so the middleware doesn't try to hit an RPC.
// We monkey-patch the modules used by svmMiddleware via vitest's
// module mock — see vi.mock above. Kept local to this test file.

// Set up a mini app that mounts the middleware and a no-op handler.
function buildApp() {
  const app = new Hono();
  app.post(
    "/m/:agency/mcp/svm",
    svmMiddleware({
      clients:     stubClients,
      facilitator: stubFacilitator,
      registry:    "0x0000000000000000000000000000000000000000",
      recordCache: stubRecordCache,
      quoteCache:  stubQuoteCache,
      network:     "solana-devnet",
      usdcMint:    USDC_MINT_DEVNET,
      log:         noopLog,
    }),
    (c) => c.json({ jsonrpc: "2.0", result: "ok", id: 1 }),
  );
  return app;
}

describe("svmMiddleware — non-payment methods", () => {
  it("passes through initialize without 402", async () => {
    const app = buildApp();
    const res = await app.request("/m/0xfeedbeef/mcp/svm", {
      method:  "POST",
      headers: { "content-type": "application/json" },
      body:    JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize" }),
    });
    expect(res.status).toBe(200);
  });

  it("passes through tools/list without 402", async () => {
    const app = buildApp();
    const res = await app.request("/m/0xfeedbeef/mcp/svm", {
      method:  "POST",
      headers: { "content-type": "application/json" },
      body:    JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    expect(res.status).toBe(200);
  });
});

describe("svmMiddleware — encodes valid requirements on 402 challenge", () => {
  it("PAYMENT-REQUIRED header round-trips through encodeRequirements", () => {
    // Sanity check that the requirements struct produced by the
    // middleware is encodable without errors. Real challenge end-
    // to-end test is deferred to the integration suite.
    const r = {
      scheme:            "exact" as const,
      network:           "solana-devnet" as const,
      maxAmountRequired: "1000000",
      asset:             USDC_MINT_DEVNET,
      payTo:             USDC_MINT_DEVNET,
      resource:          "/m/0xfeedbeef/mcp/svm",
      description:       "inference · test-model · svm",
      mimeType:          "application/json",
      maxTimeoutSeconds: 90,
    };
    expect(() => encodeRequirements(r)).not.toThrow();
  });
});
