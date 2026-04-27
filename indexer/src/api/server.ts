/**
 * Read API server.
 *
 * One Hono app exposing the four routes the frontend depends on
 * (added in subsequent commits) plus /healthz. Mounted into the
 * indexer process — same pg pool, same viem client, same logger.
 *
 * CORS: open. The read API serves anonymous reads only; writes happen
 * on chain or through the gateway, never here.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";

import { healthz }   from "./routes/healthz.js";
import { models }    from "./routes/models.js";
import { ticks }     from "./routes/ticks.js";
import { stats }     from "./routes/stats.js";
import { openapi }   from "./routes/openapi.js";
import { jsonError } from "./errors.js";
import type { Config }       from "../config.js";
import type { Database }     from "../db.js";
import type { Logger }       from "../log.js";
import type { PublicClient } from "viem";

export interface ApiDeps {
  config: Config;
  db:     Database;
  client: PublicClient;
  log:    Logger;
}

export function createApi(deps: ApiDeps): Hono {
  const app = new Hono();

  app.use("*", cors({ origin: "*" }));

  app.route("/healthz",                  healthz(deps));
  app.route("/v1/models",                models(deps));
  app.route("/v1/models/:slug/ticks",    ticks(deps));
  app.route("/v1/stats",                 stats(deps));
  app.route("/",                         openapi(deps));

  app.notFound((c) =>
    c.json({ error: { code: "not_found", message: "no route" } }, 404),
  );

  app.onError((err, c) => {
    deps.log.error({ err, path: c.req.path }, "api_error");
    return jsonError(c, err);
  });

  return app;
}
