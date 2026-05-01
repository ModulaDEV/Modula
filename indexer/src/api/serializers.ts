/**
 * Postgres → JSON serializers.
 *
 * The pg driver hands us:
 *   bytea           → Node Buffer
 *   numeric(38,6)   → string  (kept as string to preserve precision)
 *   bigint / int8   → string  (same reason)
 *   timestamptz     → Date
 *
 * The frontend wants:
 *   addresses / ids → 0x-prefixed lowercase hex
 *   amounts         → string ("0.002100"), so JS Number can't lose digits
 *   timestamps      → ISO-8601 strings
 *
 * These helpers are the single boundary that converts. Routes must
 * pass row data through `serializeModel` / `serializeTick` / etc.
 * before sending it back as JSON — no bare DB rows in responses.
 */
import { byteaToHex } from "../listeners/hex.js";

export interface ModelRow {
  id:            Buffer;
  slug:          string;
  agency:        Buffer;
  app:           Buffer;
  creator:       Buffer;
  treasury:      Buffer;
  base_model:    string | null;
  model_type:    string | null;
  manifest_uri:  string | null;
  registered_at: Date;
  registered_tx: Buffer;
  // Aggregated columns added by list / detail joins:
  calls?:             string;
  total_paid_usdc?:   string;
  latest_supply?:     string | null;
  latest_price_usdc?: string | null;
  trend?:             string[] | null;
  // Health monitor columns (from migration 006_health.sql):
  health_status?:    "up" | "down" | null;
  last_healthy_at?:  Date | null;
}

export interface TickRow {
  block_number: string;
  tx_hash:      Buffer;
  kind:         "wrap" | "unwrap";
  supply_after: string;
  price_usdc:   string;
  ts:           Date;
}

export interface CallRow {
  tx_hash:    Buffer;
  agent:      Buffer;
  paid_usdc:  string;
  latency_ms: number;
  ts:         Date;
}

export function serializeModel(r: ModelRow): Record<string, unknown> {
  return {
    id:            byteaToHex(r.id),
    slug:          r.slug,
    agency:        byteaToHex(r.agency),
    app:           byteaToHex(r.app),
    creator:       byteaToHex(r.creator),
    treasury:      byteaToHex(r.treasury),
    base_model:    r.base_model,
    model_type:    r.model_type,
    manifest_uri:  r.manifest_uri,
    registered_at: r.registered_at.toISOString(),
    registered_tx: byteaToHex(r.registered_tx),
    calls:             r.calls           !== undefined ? Number(r.calls) : 0,
    total_paid_usdc:   r.total_paid_usdc ?? "0.000000",
    latest_supply:     r.latest_supply   != null ? Number(r.latest_supply) : null,
    latest_price_usdc: r.latest_price_usdc ?? null,
    trend:             r.trend ?? [],
    health_status:     r.health_status   ?? null,
    last_healthy_at:   r.last_healthy_at?.toISOString() ?? null,
  };
}

export function serializeTick(r: TickRow): Record<string, unknown> {
  return {
    block_number: Number(r.block_number),
    tx_hash:      byteaToHex(r.tx_hash),
    kind:         r.kind,
    supply_after: Number(r.supply_after),
    price_usdc:   r.price_usdc,
    ts:           r.ts.toISOString(),
  };
}

export function serializeCall(r: CallRow): Record<string, unknown> {
  return {
    tx_hash:    byteaToHex(r.tx_hash),
    agent:      byteaToHex(r.agent),
    paid_usdc:  r.paid_usdc,
    latency_ms: r.latency_ms,
    ts:         r.ts.toISOString(),
  };
}
