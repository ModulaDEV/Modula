/**
 * Read-API client. Wraps the @modula/indexer HTTP surface.
 */
import type {
  ListModelsOptions,
  ListResponse,
  ListTicksOptions,
  ModelDetailDto,
  ModelDto,
  StatsDto,
  TickDto,
  SvmCallDto,
} from "./types.js";

export interface RegistryClientOptions {
  baseUrl: string;
  fetch?:  typeof fetch;
}

export class RegistryClient {
  private readonly baseUrl: string;
  private readonly fetchFn: typeof fetch;

  constructor(opts: RegistryClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.fetchFn = opts.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /** Alias for listModels. */
  list(opts: ListModelsOptions = {}) { return this.listModels(opts); }
  /** Alias for getModel. */
  get(slug: string) { return this.getModel(slug); }

  async listModels(opts: ListModelsOptions = {}): Promise<ListResponse<ModelDto>> {
    const url = new URL(`${this.baseUrl}/v1/models`);
    for (const [k, v] of Object.entries(opts)) {
      if (v !== undefined) url.searchParams.set(k, String(v));
    }
    return this.json(url);
  }

  async getModel(slug: string): Promise<ModelDetailDto> {
    return this.json(new URL(`${this.baseUrl}/v1/models/${encodeURIComponent(slug)}`));
  }

  async listTicks(slug: string, opts: ListTicksOptions = {}): Promise<{ items: TickDto[]; next_since: string | null }> {
    const url = new URL(`${this.baseUrl}/v1/models/${encodeURIComponent(slug)}/ticks`);
    if (opts.since) url.searchParams.set("since", opts.since);
    if (opts.limit) url.searchParams.set("limit", String(opts.limit));
    return this.json(url);
  }

  async getStats(): Promise<StatsDto> {
    return this.json(new URL(`${this.baseUrl}/v1/stats`));
  }

  /**
   * Paginated history of SVM-paid calls for one model.
   *
   * Symmetric with `recent_calls` on getModel() but covers the SVM
   * rail and is paginated on its own endpoint. Returns base58 tx
   * signatures and base58 payer pubkeys, not 0x EVM addresses.
   */
  async getSvmCalls(
    slug: string,
    opts: { limit?: number; offset?: number } = {},
  ): Promise<ListResponse<SvmCallDto>> {
    const url = new URL(`${this.baseUrl}/v1/models/${encodeURIComponent(slug)}/svm-calls`);
    if (opts.limit !== undefined)  url.searchParams.set("limit",  String(opts.limit));
    if (opts.offset !== undefined) url.searchParams.set("offset", String(opts.offset));
    return this.json(url);
  }

  // ---------- internals ----------

  private async json<T>(url: URL): Promise<T> {
    const res = await this.fetchFn(url, { headers: { accept: "application/json" } });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Modula registry ${res.status} ${res.statusText}${body ? ` · ${body.slice(0, 200)}` : ""}`);
    }
    return (await res.json()) as T;
  }
}
