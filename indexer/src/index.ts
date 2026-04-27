/**
 * Process entry.
 *
 * Boot order:
 *   1. Load + validate env.
 *   2. Stand up the structured logger.
 *   3. Open the pg pool, ping it.
 *   4. Open the viem client, log the chain head.
 *   5. Spawn the three listener loops under a shared AbortController.
 *
 * Two signals trigger graceful shutdown — SIGINT from local dev,
 * SIGTERM from the platform (Fly / Railway). Shutdown sequence:
 *   - abort the listener loops (each ticks-to-completion, then exits)
 *   - close the pg pool
 *   - exit 0
 */
import { serve }            from "@hono/node-server";

import { loadConfig }       from "./config.js";
import { createLogger }     from "./log.js";
import { createDatabase }   from "./db.js";
import { createClient }     from "./client.js";
import { startListeners }   from "./listeners/index.js";
import { createApi }        from "./api/server.js";

async function main(): Promise<void> {
  const config = loadConfig(process.env);
  const log    = createLogger({
    level:   config.LOG_LEVEL,
    pretty:  config.NODE_ENV === "development",
    service: "modula-indexer",
  });

  log.info(
    { chain: config.CHAIN, registry: config.addresses.registry },
    "indexer_boot",
  );

  const db     = createDatabase(config, log);
  const client = createClient(config);

  const [{ rows }, head] = await Promise.all([
    db.pool.query<{ now: Date }>("SELECT now() AS now"),
    client.getBlockNumber(),
  ]);
  log.info(
    { db_now: rows[0]?.now, chain_head: head.toString() },
    "indexer_dependencies_ok",
  );

  const abortCtrl = new AbortController();
  const listenersDone = startListeners({
    config,
    client,
    db,
    log,
    abort: abortCtrl.signal,
  }).catch((err) => log.error({ err }, "listeners_crashed"));

  const api = createApi({ config, db, client, log });
  const httpServer = serve({
    fetch:    api.fetch,
    hostname: config.HOST,
    port:     config.PORT,
  }, (info) => log.info({ host: info.address, port: info.port }, "api_listening"));

  const shutdown = (signal: string): void => {
    log.info({ signal }, "indexer_shutdown");
    abortCtrl.abort();
    httpServer.close();
    void listenersDone.finally(async () => {
      await db.close();
      process.exit(0);
    });
  };
  process.on("SIGINT",  () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error({ err }, "indexer_fatal");
  process.exit(1);
});
