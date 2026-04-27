import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Integration tests spin up a Postgres container; allow plenty of
    // headroom for image pull on a cold CI runner.
    testTimeout: 120_000,
    hookTimeout: 120_000,
    // Run files sequentially — they share a single container per file
    // and creating one container per file in parallel oversaturates
    // CI runners.
    fileParallelism: false,
    pool: "forks",
  },
});
