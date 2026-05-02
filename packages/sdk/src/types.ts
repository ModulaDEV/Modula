/**
 * Public response types from the Modula read API.
 *
 * These mirror indexer/src/api/serializers.ts and the OpenAPI doc
 * exactly. Kept duplicated (rather than re-exported from the
 * indexer workspace) so the SDK is shippable to npm without the
 * private indexer package as a peer dep.
 */

export interface ModelDto {
  id:                string;
  slug:              string;
  agency:            string;
  app:               string;
  creator:           string;
  treasury:          string;
  base_model:        string | null;
  model_type:        string | null;
  manifest_uri:      string | null;
  registered_at:     string;
  registered_tx:     string;
  calls:             number;
  total_paid_usdc:   string;
  latest_supply:     number | null;
  latest_price_usdc: string | null;
  trend:             string[];
  health_status:     "up" | "down" | null;
  last_healthy_at:   string | null;
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

/**
 * Cross-rail counts for one model. Returned alongside the unified
 * top-level totals on /v1/models/:slug and /v1/stats so dashboards
 * can render either rail independently.
 */
export interface RailBreakdown {
  evm: { total_calls: number; total_paid_usdc: string };
  svm: { total_calls: number; total_paid_usdc: string };
}

export interface ModelDetailDto extends ModelDto {
  recent_ticks: TickDto[];
  recent_calls: CallDto[];
  /// EVM + SVM breakdown of `calls` and `total_paid_usdc`.
  by_rail:      RailBreakdown;
}

export interface ListResponse<T> {
  items:  T[];
  total:  number;
  limit:  number;
  offset: number;
}

export interface StatsDto {
  total_models:      number;
  total_calls:       number;
  total_usdc_routed: string;
  /// EVM + SVM breakdown of `total_calls` and `total_usdc_routed`.
  by_rail:           RailBreakdown;
}

export interface ListModelsOptions {
  type?:   string;
  base?:   string;
  q?:      string;
  tag?:    string;
  limit?:  number;
  offset?: number;
}

export interface ListTicksOptions {
  since?: string;
  limit?: number;
}

/**
 * One row from /v1/models/:slug/svm-calls — a single SVM-paid
 * inference call. Symmetric with CallDto (the EVM equivalent) but
 * with base58 fields where EVM uses 0x hex.
 */
export interface SvmCallDto {
  tx_signature: string;                 // base58 Solana tx signature
  agent_pubkey: string;                 // base58 payer pubkey
  paid_usdc:    string;                 // exact 6dp ("1.500000")
  network:      "solana" | "solana-devnet";
  slot:         number;
  ts:           string;                 // ISO-8601
  latency_ms:   number | null;
}

export interface MCPToolDescriptor {
  name:         string;
  title?:       string;
  description?: string;
  inputSchema?: Record<string, unknown>;
  outputSchema?: Record<string, unknown>;
}

export interface MCPCallResult {
  content:           Array<{ type: string; text?: string;[k: string]: unknown }>;
  structuredContent?: unknown;
  isError?:          boolean;
}

/// Raised when the gateway responds 402 Payment Required and the
/// SDK does not have a signer configured to auto-pay. Callers can
/// catch and handle the payment manually.
export class PaymentRequiredError extends Error {
  constructor(public requirementsBase64: string, public readonly url: string) {
    super(`Payment required for ${url}`);
    this.name = "PaymentRequiredError";
  }
}
