/**
 * Shared types for the listener layer.
 */
import type { PublicClient } from "viem";
import type { Config }   from "../config.js";
import type { Database } from "../db.js";
import type { Logger }   from "../log.js";

/// Common dependency bundle every listener needs.
export interface ListenerDeps {
  config: Config;
  client: PublicClient;
  db:     Database;
  log:    Logger;
  abort:  AbortSignal;
}

/// Provider-imposed log range cap. Alchemy and Infura both honor 5_000
/// blocks per getLogs; some public RPCs cap lower. Set conservatively.
export const MAX_BLOCK_RANGE = 5_000n;

/// Minimal Listener handle so the orchestrator can start them uniformly.
export interface Listener {
  start(): Promise<void>;
}
