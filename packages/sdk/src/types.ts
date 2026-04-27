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

export interface ModelDetailDto extends ModelDto {
  recent_ticks: TickDto[];
  recent_calls: CallDto[];
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
}

export interface ListModelsOptions {
  type?:   string;
  base?:   string;
  q?:      string;
  limit?:  number;
  offset?: number;
}

export interface ListTicksOptions {
  since?: string;
  limit?: number;
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
