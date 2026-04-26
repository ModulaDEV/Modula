/**
 * Read-side helpers for the ModulaRegistry.
 *
 * Two flows:
 *   - readModelByAgency(agency)  — used by every MCP request
 *   - readModelBySlug(slug)      — used by manifest endpoint, register
 */
import { keccak256, stringToBytes, type Address } from "viem";
import { modulaRegistryAbi } from "@modula/abi/registry";
import type { Clients }      from "./clients.js";
import type { TtlCache }     from "./cache.js";
import { NotFound }          from "../errors.js";

/// @notice The registry's Record struct, mirrored as a TS type.
export interface ModelRecord {
  id:           `0x${string}`;
  agency:       Address;
  app:          Address;
  treasury:     Address;
  creator:      Address;
  slug:         string;
  baseModel:    string;
  modelType:    string;
  manifestURI:  string;
  registeredAt: bigint;
}

interface Deps {
  clients:  Clients;
  registry: Address;
  cache:    TtlCache<string, ModelRecord>;
}

/// @notice Resolve a Record by Agency address. Throws NotFound when
///         the agency is not registered.
export async function readModelByAgency(deps: Deps, agency: Address): Promise<ModelRecord> {
  return deps.cache.getOrLoad(`agency:${agency.toLowerCase()}`, async () => {
    const id = await deps.clients.read.readContract({
      address: deps.registry,
      abi:     modulaRegistryAbi,
      functionName: "byAgency",
      args: [agency],
    });
    if (id === ("0x" + "00".repeat(32) as `0x${string}`)) {
      throw new NotFound(`agency ${agency}`);
    }
    return readModelByIdInternal(deps, id);
  }, 30_000);
}

/// @notice Resolve a Record by slug.
export async function readModelBySlug(deps: Deps, slug: string): Promise<ModelRecord> {
  const id = keccak256(stringToBytes(slug)) as `0x${string}`;
  return deps.cache.getOrLoad(`id:${id}`, () => readModelByIdInternal(deps, id), 30_000);
}

async function readModelByIdInternal(deps: Deps, id: `0x${string}`): Promise<ModelRecord> {
  const r = await deps.clients.read.readContract({
    address: deps.registry,
    abi:     modulaRegistryAbi,
    functionName: "records",
    args: [id],
  });
  if (r.agency === "0x0000000000000000000000000000000000000000") {
    throw new NotFound(`model ${id}`);
  }
  return {
    id,
    agency:       r.agency,
    app:          r.app,
    treasury:     r.treasury,
    creator:      r.creator,
    slug:         r.slug,
    baseModel:    r.baseModel,
    modelType:    r.modelType,
    manifestURI:  r.manifestURI,
    registeredAt: r.registeredAt,
  };
}
