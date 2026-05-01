#!/usr/bin/env tsx
/**
 * Modula CLI entry point.
 *
 * Usage:
 *   npx @modula/cli register
 */
import { register } from "../src/register.js";

const [, , command, ...rest] = process.argv;

async function main() {
  switch (command) {
    case "register":
      await register();
      break;
    default:
      console.error(`Unknown command: ${command ?? "(none)"}`);
      console.error("Usage: modula <command>");
      console.error("Commands:");
      console.error("  register   — interactively register a new model on-chain");
      process.exit(1);
  }
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : String(err));
  process.exit(1);
});
