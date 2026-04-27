/**
 * Structured logger.
 *
 * Mirrors @modula/gateway's logger — pino JSON to stdout in production,
 * pino-pretty for local dev. Same redaction list so secrets never leak.
 */
import pino from "pino";

export interface LoggerOptions {
  level:   string;
  pretty:  boolean;
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
        "*.DATABASE_URL",
        "*.api_key",
        "*.apiKey",
        "headers.authorization",
        "headers.cookie",
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
