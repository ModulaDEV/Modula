/**
 * GET /m/:agency/manifest.json
 *
 * Resolves a model's full registry record into a public manifest the
 * frontend (and curious humans) can read. Cache-Control is set so
 * downstream CDNs don't ping the gateway for every page hit.
 */
import { Hono } from "hono";
import type { AppDeps } from "../app.js";

export function manifest(_deps: AppDeps): Hono {
  const app = new Hono();

  app.get("/", (c) => {
    // Implementation lands when src/chain/registry.ts is wired in.
    // Return 503 for now so the route is reachable but obviously not
    // yet implemented.
    c.header("Cache-Control", "public, max-age=30");
    return c.json(
      { error: { code: "not_implemented", message: "manifest read not wired yet" } },
      503,
    );
  });

  return app;
}
