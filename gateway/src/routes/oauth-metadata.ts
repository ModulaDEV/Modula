/**
 * GET /.well-known/oauth-protected-resource
 *
 * RFC 9728 Protected Resource Metadata. MCP clients fetch this to
 * discover which authorization server can mint tokens for the
 * gateway. Always served (whether OAuth is enabled or not) so MCP
 * inspectors can validate the metadata document exists.
 */
import { Hono } from "hono";

import { buildResourceMetadata } from "../oauth.js";
import type { Config } from "../config.js";

interface Deps { config: Config }

export function oauthMetadata(deps: Deps): Hono {
  const app = new Hono();

  app.get("/", (c) => {
    if (!deps.config.OAUTH_ISSUER) {
      // OAuth disabled — return a minimal stub so the well-known
      // path at least exists. Real auth servers return an array
      // even when there's only one.
      return c.json({
        resource:                 deps.config.OAUTH_RESOURCE ?? `http://${deps.config.HOST}:${deps.config.PORT}`,
        authorization_servers:    [],
        bearer_methods_supported: ["header"],
        scopes_supported:         [],
      });
    }
    return c.json(buildResourceMetadata(deps.config));
  });

  return app;
}
