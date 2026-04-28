/**
 * GET /m/:agency/manifest.json
 *
 * Resolves a model's full registry record into a public manifest the
 * frontend (and curious humans) can read. Cache-Control is set so
 * downstream CDNs don't ping the gateway for every page hit.
 */
import { Hono } from "hono";
import type { Address } from "viem";
import type { AppDeps } from "../app.js";
import type { Clients } from "../chain/clients.js";
import type { TtlCache } from "../chain/cache.js";
import type { ModelRecord } from "../chain/registry.js";
import type { ModelManifest } from "../runtime.js";
import { readModelByAgency } from "../chain/registry.js";
import { fetchManifest } from "../runtime.js";
import { NotFound } from "../errors.js";

export interface ManifestDeps extends AppDeps {
  clients:       Clients;
  recordCache:   TtlCache<string, ModelRecord>;
  manifestCache: TtlCache<string, ModelManifest>;
}

export function manifest(deps: ManifestDeps): Hono {
  const app = new Hono();

  app.get("/", async (c) => {
    const agency = c.req.param("agency") as Address;
    if (!agency || !/^0x[0-9a-fA-F]{40}$/i.test(agency)) {
      return c.json({ error: { code: "bad_request", message: "invalid agency address" } }, 400);
    }

    let record: ModelRecord;
    try {
      record = await readModelByAgency(
        {
          clients:  deps.clients,
          registry: deps.config.addresses.registry,
          cache:    deps.recordCache,
        },
        agency,
      );
    } catch (err) {
      if (err instanceof NotFound) {
        return c.json({ error: { code: "not_found", message: err.message } }, 404);
      }
      throw err;
    }

    const manifest = await fetchManifest(
      { manifestCache: deps.manifestCache, log: deps.log },
      record.manifestURI,
    ).catch((err) => {
      deps.log.warn({ err, slug: record.slug }, "manifest_fetch_failed");
      return null;
    });

    c.header("Cache-Control", "public, max-age=30");

    return c.json({
      slug:        record.slug,
      agency:      record.agency,
      app:         record.app,
      creator:     record.creator,
      treasury:    record.treasury,
      baseModel:   record.baseModel,
      modelType:   record.modelType,
      manifestURI: record.manifestURI,
      registeredAt: Number(record.registeredAt),
      ...(manifest ?? {}),
    });
  });

  return app;
}
