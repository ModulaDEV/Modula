/**
 * Typed client for the @modula/indexer read API.
 *
 * Server-side only — every consumer is a Server Component or a route
 * handler. We keep `INDEXER_URL` server-side (no NEXT_PUBLIC_ prefix)
 * so the URL never ships to the browser; client components receive
 * data through props.
 *
 * All routes return the shapes documented in `indexer/src/api/serializers.ts`.
 * This file is the contract — keep it in sync when the read API
 * adds/removes fields.
 */

const INDEXER_URL = process.env.INDEXER_URL ?? "http://localhost:8788";

// ---------- DTOs ----------

export interface ModelDto {
  id:                string;   // 0x... bytes32
  slug:              string;
  agency:            string;   // 0x... address
  app:               string;
  creator:           string;
  treasury:          string;
  base_model:        string | null;
  model_type:        string | null;
  manifest_uri:      string | null;
  registered_at:     string;   // ISO
  registered_tx:     string;   // 0x... bytes32
  calls:             number;
  total_paid_usdc:   string;   // exact 6-dp
  latest_supply:     number | null;
  latest_price_usdc: string | null;
  trend:             string[]; // up to 12 oldest→newest prices
}

export interface TickDto {
  block_number: number;
  tx_hash:      string;
  kind:         "wrap" | "unwrap";
  supply_after: number;
  price_usdc:   string;
  ts:           string;
}

export interface CallDto {
  tx_hash:    string;
  agent:      string;
  paid_usdc:  string;
  latency_ms: number;
  ts:         string;
}

export interface ListResponse<T> {
  items:  T[];
  total:  number;
  limit:  number;
  offset: number;
}

export interface ModelDetailDto extends ModelDto {
  recent_ticks: TickDto[];
  recent_calls: CallDto[];
}

export interface StatsDto {
  total_models:      number;
  total_calls:       number;
  total_usdc_routed: string;
}

export interface RevenueBucketDto {
  day:       string;   // YYYY-MM-DD (UTC)
  calls:     number;
  paid_usdc: string;   // exact 6-dp
}

export type RevenuePeriod = "7d" | "30d";

export interface RevenueDto {
  period:          RevenuePeriod;
  buckets:         RevenueBucketDto[];
  total_calls:     number;
  total_paid_usdc: string;
}

// ---------- Fetchers ----------

interface ListOptions {
  type?:   string;
  base?:   string;
  q?:      string;
  tag?:    string;
  limit?:  number;
  offset?: number;
}

/** Revalidate at most every N seconds (Next.js fetch cache). */
const DEFAULT_REVALIDATE = 30;

export async function listModels(opts: ListOptions = {}): Promise<ListResponse<ModelDto>> {
  const url = new URL("/v1/models", INDEXER_URL);
  for (const [k, v] of Object.entries(opts)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  return jsonGet<ListResponse<ModelDto>>(url);
}

export async function getModel(slug: string): Promise<ModelDetailDto> {
  return jsonGet<ModelDetailDto>(new URL(`/v1/models/${encodeURIComponent(slug)}`, INDEXER_URL));
}

export async function listTicks(slug: string, opts: { since?: string; limit?: number } = {}): Promise<{ items: TickDto[]; next_since: string | null }> {
  const url = new URL(`/v1/models/${encodeURIComponent(slug)}/ticks`, INDEXER_URL);
  if (opts.since) url.searchParams.set("since", opts.since);
  if (opts.limit) url.searchParams.set("limit", String(opts.limit));
  return jsonGet(url);
}

export async function getStats(): Promise<StatsDto> {
  return jsonGet<StatsDto>(new URL("/v1/stats", INDEXER_URL));
}

export async function getRevenue(slug: string, period: RevenuePeriod = "7d"): Promise<RevenueDto> {
  const url = new URL(`/v1/models/${encodeURIComponent(slug)}/revenue`, INDEXER_URL);
  url.searchParams.set("period", period);
  return jsonGet<RevenueDto>(url);
}

// ---------- Internals ----------

async function jsonGet<T>(url: URL): Promise<T> {
  const res = await fetch(url, {
    next: { revalidate: DEFAULT_REVALIDATE },
    headers: { accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`indexer ${res.status} ${res.statusText} on ${url.pathname}`);
  }
  return (await res.json()) as T;
}
