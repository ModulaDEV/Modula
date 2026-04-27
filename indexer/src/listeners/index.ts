/**
 * Listener orchestrator.
 *
 * Spawns the three listeners in parallel under one shared abort signal.
 * Returns a promise that resolves when all loops have exited, so the
 * entry point can wait on graceful shutdown before closing the DB.
 */
import { createRegistryListener } from "./registry.js";
import { createCurveListener }    from "./curve.js";
import { createAccessListener }   from "./access.js";
import type { ListenerDeps }      from "./types.js";

export async function startListeners(deps: ListenerDeps): Promise<void> {
  const listeners = [
    createRegistryListener(deps),
    createCurveListener(deps),
    createAccessListener(deps),
  ];
  await Promise.all(listeners.map((l) => l.start()));
}
