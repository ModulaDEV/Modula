import { describe, expect, test } from "vitest";

import { oauthMetadata } from "./oauth-metadata.js";
import { buildResourceMetadata } from "../oauth.js";
import type { Config } from "../config.js";

const baseConfig: Config = {
  PORT: 8787,
  HOST: "0.0.0.0",
  CHAIN: "baseSepolia",
  BASE_RPC_URL: "http://localhost:8545",
  X402_FACILITATOR_URL: "http://localhost:9999",
  X402_FACILITATOR_API_KEY: "k",
  SVM_ENABLED: false,
  SVM_NETWORK: "solana-devnet",
  OAUTH_ENABLED: false,
  LOG_LEVEL: "info",
  NODE_ENV: "test",
  addresses: {
    chainId: 84532,
    name:    "Base Sepolia",
    usdc:    "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    registry:     "0x0000000000000000000000000000000000000000",
    factory:      "0x0000000000000000000000000000000000000000",
    accessRouter: "0x0000000000000000000000000000000000000000",
  },
};

interface ResourceMetadataLike {
  resource:                 string;
  authorization_servers:    string[];
  bearer_methods_supported: string[];
  scopes_supported?:        string[];
}

describe("/.well-known/oauth-protected-resource (RFC 9728)", () => {
  test("returns the stub document when OAuth is disabled", async () => {
    const app = oauthMetadata({ config: { ...baseConfig, OAUTH_ENABLED: false } });
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ResourceMetadataLike;
    expect(body.bearer_methods_supported).toEqual(["header"]);
    expect(body.authorization_servers).toEqual([]);
    expect(body).toHaveProperty("resource");
  });

  test("returns the full document when OAuth is enabled", async () => {
    const app = oauthMetadata({
      config: {
        ...baseConfig,
        OAUTH_ENABLED: true,
        OAUTH_ISSUER:  "https://issuer.example.com",
        OAUTH_RESOURCE: "https://mcp.example.com",
      },
    });
    const res = await app.request("/");
    expect(res.status).toBe(200);
    const body = (await res.json()) as ResourceMetadataLike;
    expect(body.resource).toBe("https://mcp.example.com");
    expect(body.authorization_servers).toEqual(["https://issuer.example.com"]);
    expect(body.scopes_supported).toContain("mcp:tools.call");
    expect(body.bearer_methods_supported).toEqual(["header"]);
  });
});

describe("buildResourceMetadata", () => {
  test("throws ConfigError when OAuth enabled without an issuer", () => {
    expect(() =>
      buildResourceMetadata({ ...baseConfig, OAUTH_ENABLED: true } as Config),
    ).toThrowError(/OAUTH_ISSUER/);
  });
});
