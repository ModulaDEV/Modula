/**
 * Structured logger.
 *
 * pino in production for JSON output to stdout (Fly + Railway both
 * ingest stdout-json natively into their log pipelines), pino-pretty
 * in development for human-readable colorised output.
 */
import pino from "pino";

export interface LoggerOptions {
  level: string;
  pretty: boolean;
  service: string;
}

export function createLogger(opts: LoggerOptions): pino.Logger {
  return pino({
    level: opts.level,
    base:  { service: opts.service, version: "0.1.0" },
    redact: {
      paths: [
        "*.PRIVATE_KEY",
        "*.private_key",
        "*.privateKey",
        "*.GATEWAY_SIGNER_PRIVATE_KEY",
        "*.X402_FACILITATOR_API_KEY",
        "*.api_key",
        "*.apiKey",
        "headers.authorization",
        "headers.cookie",
        "headers.PAYMENT-SIGNATURE",
      ],
      censor: "[redacted]",
    },
    transport: opts.pretty
      ? {
          target: "pino-pretty",
          options: { colorize: true, singleLine: false, translateTime: "HH:MM:ss.l" },
        }
      : undefined,
  });
}

export type Logger = pino.Logger;
