import { describe, it, expect } from "vitest";
import { Hono } from "hono";
import { healthz } from "./healthz.js";
import type { Config } from "../config.js";
import type { AppDeps } from "../app.js";

const noopLog = {
  trace: () => {},
  debug: () => {},
  info:  () => {},
  warn:  () => {},
  error: () => {},
  fatal: () => {},
  child: function () { return this; },
} as unknown as AppDeps["log"];

const baseConfig: Partial<Config> = {
  PORT: 8787,
  HOST: "0.0.0.0",
  CHAIN: "base",
  BASE_RPC_URL: "http://localhost:8545",
  X402_FACILITATOR_URL: "http://localhost:9999",
  SVM_ENABLED: false,
  SVM_NETWORK: "solana-devnet",
  OAUTH_ENABLED: false,
  LOG_LEVEL: "info",
  NODE_ENV: "test",
};

function mountHealthz(config: Partial<Config>): Hono {
  const app = new Hono();
  app.route("/healthz", healthz({ config: config as Config, log: noopLog }));
  return app;
}

describe("/healthz settlement mount status", () => {
  it("reports svm: { enabled: false } when SVM_ENABLED is off", async () => {
    const app = mountHealthz({ ...baseConfig, SVM_ENABLED: false });
    const res = await app.request("/healthz");
    expect(res.status).toBe(200);
    const body = await res.json() as { settlement: { svm: { enabled: boolean } } };
    expect(body.settlement.svm.enabled).toBe(false);
    expect("network" in body.settlement.svm).toBe(false);
  });

  it("reports svm: { enabled: true, network } when SVM_ENABLED is on", async () => {
    const app = mountHealthz({
      ...baseConfig,
      SVM_ENABLED: true,
      SVM_NETWORK: "solana",
    });
    const res = await app.request("/healthz");
    const body = await res.json() as {
      settlement: { svm: { enabled: boolean; network?: string } };
    };
    expect(body.settlement.svm.enabled).toBe(true);
    expect(body.settlement.svm.network).toBe("solana");
  });

  it("normalizes baseSepolia config into the base-sepolia network literal", async () => {
    const app = mountHealthz({ ...baseConfig, CHAIN: "baseSepolia" });
    const res = await app.request("/healthz");
    const body = await res.json() as {
      settlement: { evm: { network: string } };
    };
    expect(body.settlement.evm.network).toBe("base-sepolia");
  });

  it("/healthz/live and /healthz both return the settlement field", async () => {
    const app = mountHealthz(baseConfig);
    for (const path of ["/healthz", "/healthz/live"]) {
      const res = await app.request(path);
      const body = await res.json() as { settlement?: unknown };
      expect(body.settlement).toBeDefined();
    }
  });

  it("/healthz/ready returns the settlement field", async () => {
    const app = mountHealthz({ ...baseConfig, SVM_ENABLED: true });
    const res = await app.request("/healthz/ready");
    const body = await res.json() as {
      status: string;
      settlement: { svm: { enabled: boolean } };
    };
    expect(body.status).toBe("ready");
    expect(body.settlement.svm.enabled).toBe(true);
  });
});
