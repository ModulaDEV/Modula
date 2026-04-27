/**
 * Generic polling loop with abort + interval pacing.
 *
 * Each listener implements a `tick()` that does one bounded unit of
 * work (catch the cursor up by a chunk of blocks, ingest events, save
 * the cursor). The loop calls tick on a steady cadence until the abort
 * signal fires.
 *
 * If a tick takes longer than the interval, the loop runs back-to-back
 * with no extra wait — we never compound wait + work latency.
 */
import type { Logger } from "../log.js";

export interface PollDeps {
  name:       string;
  intervalMs: number;
  abort:      AbortSignal;
  log:        Logger;
  tick:       () => Promise<void>;
}

export async function pollLoop(deps: PollDeps): Promise<void> {
  deps.log.info({ listener: deps.name, intervalMs: deps.intervalMs }, "listener_start");

  while (!deps.abort.aborted) {
    const t0 = performance.now();
    try {
      await deps.tick();
    } catch (err) {
      deps.log.error({ err, listener: deps.name }, "listener_tick_failed");
    }
    const elapsed   = performance.now() - t0;
    const remaining = Math.max(0, deps.intervalMs - elapsed);
    if (remaining > 0) await sleep(remaining, deps.abort);
  }

  deps.log.info({ listener: deps.name }, "listener_stop");
}

function sleep(ms: number, abort: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (abort.aborted) return resolve();
    const t = setTimeout(() => {
      abort.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(t);
      resolve();
    };
    abort.addEventListener("abort", onAbort, { once: true });
  });
}
