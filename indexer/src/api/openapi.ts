/**
 * OpenAPI 3.1 spec for the Modula read API.
 *
 * Hand-maintained for v1 — three-figure-line route count keeps drift
 * manageable, and avoids the cost of refactoring every route handler
 * to @hono/zod-openapi's createRoute syntax. When the route count
 * doubles, swap in zod-openapi and generate this from the handlers.
 *
 * Served at GET /openapi.json. Frontends + integration partners
 * use it for typed client gen; Swagger UI at /docs (added in a
 * later commit) renders it.
 */

const COMMON_400 = {
  description: "Bad request — invalid query/body.",
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
};
const COMMON_404 = {
  description: "Not found.",
  content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
};

export function buildOpenApiDoc(opts: { baseUrl: string; version: string }) {
  return {
    openapi: "3.1.0",
    info: {
      title:       "Modula Read API",
      version:     opts.version,
      description: "Indexed view of the Modula on-chain registry on Base. Read-only — writes happen on chain or through the gateway.",
      contact:     { name: "Modula", url: "https://www.modulabase.org" },
      license:     { name: "MIT" },
    },
    servers: [{ url: opts.baseUrl }],
    tags: [
      { name: "models", description: "Registered Modula models." },
      { name: "stats",  description: "Protocol-wide counters." },
      { name: "health", description: "Liveness + indexer lag." },
    ],
    paths: {
      "/healthz": {
        get: {
          tags: ["health"],
          summary: "Liveness + chain head + cursor lag.",
          responses: {
            "200": {
              description: "Indexer is reachable; chain head, registry cursor, and lag are returned.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Health" } } },
            },
            "503": {
              description: "Indexer cannot reach pg or chain RPC.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/HealthError" } } },
            },
          },
        },
      },
      "/v1/models": {
        get: {
          tags: ["models"],
          summary: "List registered models.",
          parameters: [
            { name: "type",   in: "query", schema: { type: "string", maxLength: 64 }, description: "Exact match on model_type." },
            { name: "base",   in: "query", schema: { type: "string", maxLength: 64 }, description: "Exact match on base_model." },
            { name: "q",      in: "query", schema: { type: "string", maxLength: 128 }, description: "ILIKE match on slug." },
            { name: "limit",  in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
            { name: "offset", in: "query", schema: { type: "integer", minimum: 0, default: 0 } },
          ],
          responses: {
            "200": {
              description: "Paginated model list with aggregated stats and 12-point trend.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ModelList" } } },
            },
            "400": COMMON_400,
          },
        },
      },
      "/v1/models/{slug}": {
        get: {
          tags: ["models"],
          summary: "Get one model with recent ticks + calls.",
          parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": {
              description: "Model record with last 12 ticks and last 10 calls.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/ModelDetail" } } },
            },
            "404": COMMON_404,
          },
        },
      },
      "/v1/models/{slug}/ticks": {
        get: {
          tags: ["models"],
          summary: "Time-series curve ticks (charts + live polling).",
          parameters: [
            { name: "slug",  in: "path",  required: true, schema: { type: "string" } },
            { name: "since", in: "query", schema: { type: "string", format: "date-time" }, description: "ISO ts cursor; returns ticks newer than this. Omit for the latest `limit` ticks." },
            { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 1000, default: 100 } },
          ],
          responses: {
            "200": {
              description: "Ascending-by-ts ticks plus next_since cursor for live tailing.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/TickList" } } },
            },
            "400": COMMON_400,
            "404": COMMON_404,
          },
        },
      },
      "/v1/models/{slug}/revenue": {
        get: {
          tags: ["models"],
          summary: "Daily revenue + call-count buckets for the creator dashboard.",
          parameters: [
            { name: "slug",   in: "path",  required: true, schema: { type: "string" } },
            { name: "period", in: "query", schema: { type: "string", enum: ["7d", "30d"], default: "7d" }, description: "Window length. Buckets are zero-filled, one per UTC day." },
          ],
          responses: {
            "200": {
              description: "Buckets ordered ascending by day, plus window totals.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Revenue" } } },
            },
            "400": COMMON_400,
            "404": COMMON_404,
          },
        },
      },
      "/v1/stats": {
        get: {
          tags: ["stats"],
          summary: "Protocol-wide counters.",
          responses: {
            "200": {
              description: "Total models, total calls, total USDC routed.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/Stats" } } },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        // -------- shared --------
        HexBytes32:   { type: "string", pattern: "^0x[0-9a-fA-F]{64}$", example: "0x4a7fdc31...b12c", description: "0x-prefixed bytes32 hex." },
        HexAddress:   { type: "string", pattern: "^0x[0-9a-fA-F]{40}$", example: "0x4a7fdc31...b12c", description: "0x-prefixed 20-byte address." },
        UsdcAmount:   { type: "string", description: "Numeric(38,6) string. Use string to avoid JS Number precision loss.", example: "0.002100" },

        // -------- domain --------
        Model: {
          type: "object",
          required: ["id", "slug", "agency", "app", "creator", "treasury", "registered_at", "registered_tx", "calls", "total_paid_usdc", "trend"],
          properties: {
            id:                { $ref: "#/components/schemas/HexBytes32" },
            slug:              { type: "string" },
            agency:            { $ref: "#/components/schemas/HexAddress" },
            app:               { $ref: "#/components/schemas/HexAddress" },
            creator:           { $ref: "#/components/schemas/HexAddress" },
            treasury:          { $ref: "#/components/schemas/HexAddress" },
            base_model:        { type: "string", nullable: true },
            model_type:        { type: "string", nullable: true },
            manifest_uri:      { type: "string", nullable: true },
            registered_at:     { type: "string", format: "date-time" },
            registered_tx:     { $ref: "#/components/schemas/HexBytes32" },
            calls:             { type: "integer" },
            total_paid_usdc:   { $ref: "#/components/schemas/UsdcAmount" },
            latest_supply:     { type: "integer", nullable: true },
            latest_price_usdc: { $ref: "#/components/schemas/UsdcAmount", nullable: true },
            trend:             { type: "array", items: { $ref: "#/components/schemas/UsdcAmount" }, maxItems: 12, description: "Most recent 12 prices, oldest→newest." },
          },
        },
        Tick: {
          type: "object",
          required: ["block_number", "tx_hash", "kind", "supply_after", "price_usdc", "ts"],
          properties: {
            block_number: { type: "integer" },
            tx_hash:      { $ref: "#/components/schemas/HexBytes32" },
            kind:         { type: "string", enum: ["wrap", "unwrap"] },
            supply_after: { type: "integer" },
            price_usdc:   { $ref: "#/components/schemas/UsdcAmount" },
            ts:           { type: "string", format: "date-time" },
          },
        },
        Call: {
          type: "object",
          required: ["tx_hash", "agent", "paid_usdc", "latency_ms", "ts"],
          properties: {
            tx_hash:    { $ref: "#/components/schemas/HexBytes32" },
            agent:      { $ref: "#/components/schemas/HexAddress" },
            paid_usdc:  { $ref: "#/components/schemas/UsdcAmount" },
            latency_ms: { type: "integer" },
            ts:         { type: "string", format: "date-time" },
          },
        },

        // -------- list / detail wrappers --------
        ModelList: {
          type: "object",
          required: ["items", "total", "limit", "offset"],
          properties: {
            items:  { type: "array", items: { $ref: "#/components/schemas/Model" } },
            total:  { type: "integer" },
            limit:  { type: "integer" },
            offset: { type: "integer" },
          },
        },
        ModelDetail: {
          allOf: [
            { $ref: "#/components/schemas/Model" },
            {
              type: "object",
              required: ["recent_ticks", "recent_calls"],
              properties: {
                recent_ticks: { type: "array", items: { $ref: "#/components/schemas/Tick" }, maxItems: 12 },
                recent_calls: { type: "array", items: { $ref: "#/components/schemas/Call" }, maxItems: 10 },
              },
            },
          ],
        },
        TickList: {
          type: "object",
          required: ["items", "next_since"],
          properties: {
            items:      { type: "array", items: { $ref: "#/components/schemas/Tick" } },
            next_since: { type: "string", format: "date-time", nullable: true, description: "Pass back as ?since on the next request to get only new ticks." },
          },
        },
        RevenueBucket: {
          type: "object",
          required: ["day", "calls", "paid_usdc"],
          properties: {
            day:       { type: "string", format: "date", example: "2026-04-29" },
            calls:     { type: "integer" },
            paid_usdc: { $ref: "#/components/schemas/UsdcAmount" },
          },
        },
        Revenue: {
          type: "object",
          required: ["period", "buckets", "total_calls", "total_paid_usdc"],
          properties: {
            period:          { type: "string", enum: ["7d", "30d"] },
            buckets:         { type: "array", items: { $ref: "#/components/schemas/RevenueBucket" } },
            total_calls:     { type: "integer" },
            total_paid_usdc: { $ref: "#/components/schemas/UsdcAmount" },
          },
        },
        Stats: {
          type: "object",
          required: ["total_models", "total_calls", "total_usdc_routed"],
          properties: {
            total_models:      { type: "integer" },
            total_calls:       { type: "integer" },
            total_usdc_routed: { $ref: "#/components/schemas/UsdcAmount" },
          },
        },

        // -------- health --------
        Health: {
          type: "object",
          required: ["ok", "chain_head", "registry_cursor", "lag_blocks"],
          properties: {
            ok:               { type: "boolean", const: true },
            chain_head:       { type: "string", description: "Decimal block number as a string (uint64 doesn't fit JS Number)." },
            registry_cursor:  { type: "string" },
            lag_blocks:       { type: "string" },
          },
        },
        HealthError: {
          type: "object",
          required: ["ok", "error"],
          properties: {
            ok:    { type: "boolean", const: false },
            error: { type: "string" },
          },
        },

        Error: {
          type: "object",
          required: ["error"],
          properties: {
            error: {
              type: "object",
              required: ["code", "message"],
              properties: {
                code:    { type: "string", example: "not_found" },
                message: { type: "string" },
              },
            },
          },
        },
      },
    },
  } as const;
}
