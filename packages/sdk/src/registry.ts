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
