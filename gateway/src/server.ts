/**
 * Gateway entry point.
 *
 * Wires Hono routes, error handling, structured logging, and graceful
 * shutdown. The actual MCP and x402 logic lives in their own modules
 * and is mounted here.
 */
import { serve }      from "@hono/node-server";
import { loadConfig } from "./config.js";
import { createLogger } from "./log.js";
import { isGatewayError, GatewayError } from "./errors.js";
import { createApp }  from "./app.js";

const config = loadConfig();
const log = createLogger({
  level:   config.LOG_LEVEL,
  pretty:  config.NODE_ENV !== "production",
  service: "modula-gateway",
});

log.info(
  {
    chain:    config.CHAIN,
    chainId:  config.addresses.chainId,
    registry: config.addresses.registry,
    accessRouter: config.addresses.accessRouter,
  },
  "boot",
);

const app = createApp({ config, log });

app.onError((err, c) => {
  if (isGatewayError(err)) {
    log.warn({ err: { code: err.code, message: err.message } }, "request_failed");
    return c.json(err.toJSON(), err.status as 400 | 402 | 404 | 500 | 502);
  }
  const wrapped = new GatewayError(
    "internal_error",
    500,
    "internal server error",
    err,
  );
  log.error({ err }, "request_unhandled");
  return c.json(wrapped.toJSON(), 500);
});

const server = serve(
  { fetch: app.fetch, port: config.PORT, hostname: config.HOST },
  (info) => log.info({ port: info.port }, "listening"),
);

const shutdown = (signal: string) => {
  log.info({ signal }, "shutdown");
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on("SIGINT",  () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
