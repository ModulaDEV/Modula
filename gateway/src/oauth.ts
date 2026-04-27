/**
 * OAuth 2.1 bearer-token verification + protected-resource metadata.
 *
 * MCP 2025-11-25 mandates that any HTTP-exposed MCP server publish
 * OAuth 2.0 Protected Resource Metadata at
 * `/.well-known/oauth-protected-resource` (RFC 9728) and verify
 * bearer tokens on protected requests.
 *
 * Layering:
 *   - tools/list      — anonymous OK (discovery is public)
 *   - tools/call      — bearer + x402 both required
 *
 * The bearer auths *who* the agent is (for rate limiting and abuse);
 * x402 auths *payment*. Two independent layers stacked.
 *
 * Provider-agnostic by design — any OIDC/OAuth 2.1 issuer that
 * publishes a JWKS works (Clerk, Auth0, WorkOS, custom). Configure
 * via env: OAUTH_ENABLED, OAUTH_ISSUER, OAUTH_AUDIENCE, OAUTH_JWKS_URI.
 */
import type { MiddlewareHandler } from "hono";
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

import { ConfigError, GatewayError } from "./errors.js";
import type { Config } from "./config.js";
import type { Logger } from "./log.js";

// ---------- 401 helpers ----------

class Unauthorized extends GatewayError {
  constructor(message: string, readonly wwwAuthenticate: string) {
    super("unauthorized", 401, message);
  }
}

// ---------- Resource metadata (RFC 9728) ----------

export interface OAuthMetadata {
  resource:                  string;
  authorization_servers:     string[];
  bearer_methods_supported:  ("header")[];
  scopes_supported:          string[];
  jwks_uri?:                 string;
  resource_documentation?:   string;
}

export function buildResourceMetadata(config: Config): OAuthMetadata {
  if (!config.OAUTH_ISSUER) {
    throw new ConfigError(
      "OAUTH_ENABLED=true requires OAUTH_ISSUER (and ideally OAUTH_AUDIENCE)",
    );
  }
  return {
    resource:                 config.OAUTH_RESOURCE ?? `http://${config.HOST}:${config.PORT}`,
    authorization_servers:    [config.OAUTH_ISSUER],
    bearer_methods_supported: ["header"],
    scopes_supported:         ["mcp:tools.list", "mcp:tools.call"],
    jwks_uri:                 config.OAUTH_JWKS_URI,
    resource_documentation:   "https://www.modulabase.org/docs",
  };
}

// ---------- JWT verification ----------

export interface OAuthVerifier {
  verify(token: string): Promise<JWTPayload>;
}

/// @notice Build a verifier backed by the issuer's remote JWKS.
///         Returns null when OAuth is disabled — callers can skip
///         middleware mounting in that case.
export function createVerifier(config: Config, log: Logger): OAuthVerifier | null {
  if (!config.OAUTH_ENABLED) {
    log.info("oauth_disabled");
    return null;
  }
  if (!config.OAUTH_ISSUER) {
    throw new ConfigError("OAUTH_ENABLED=true requires OAUTH_ISSUER");
  }
  const jwksUri = config.OAUTH_JWKS_URI
    ?? new URL("/.well-known/jwks.json", config.OAUTH_ISSUER).toString();

  const jwks = createRemoteJWKSet(new URL(jwksUri), {
    cacheMaxAge: 5 * 60_000,
    cooldownDuration: 30_000,
  });

  log.info({ issuer: config.OAUTH_ISSUER, jwksUri }, "oauth_enabled");

  return {
    async verify(token: string): Promise<JWTPayload> {
      const { payload } = await jwtVerify(token, jwks, {
        issuer:   config.OAUTH_ISSUER,
        audience: config.OAUTH_AUDIENCE,
      });
      return payload;
    },
  };
}

// ---------- Middleware ----------

export function bearerMiddleware(
  verifier: OAuthVerifier | null,
  resourceMetadataPath: string,
): MiddlewareHandler {
  return async (c, next) => {
    if (!verifier) return next(); // OAuth disabled — pass through.

    const auth = c.req.header("authorization") ?? c.req.header("Authorization");
    const challenge = `Bearer realm="modula", resource_metadata="${resourceMetadataPath}"`;

    if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
      throw new Unauthorized("missing bearer token", challenge);
    }
    const token = auth.slice("bearer ".length).trim();
    if (!token) throw new Unauthorized("empty bearer token", challenge);

    let payload: JWTPayload;
    try {
      payload = await verifier.verify(token);
    } catch (cause) {
      const reason = cause instanceof Error ? cause.message : String(cause);
      throw new Unauthorized(`invalid bearer token: ${reason}`, challenge);
    }

    if (payload.sub) c.set("oauth:subject" as never, payload.sub);
    if (payload.scope) c.set("oauth:scope"   as never, payload.scope);
    await next();
  };
}

export { Unauthorized };
