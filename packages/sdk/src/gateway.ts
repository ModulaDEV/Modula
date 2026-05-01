/**
 * MCP gateway client.
 *
 * v0.1 surface:
 *   - listTools(agency)                          → MCPToolDescriptor[]
 *   - callTool(agency, name, args, opts?)        → MCPCallResult
 *   - callToolWithAutoPay(agency, name, args, signer, opts?) → MCPCallResult
 *   - streamTool(agency, name, args, signer, opts?) → AsyncIterableIterator<string>
 */
import {
  PaymentRequiredError,
  type MCPCallResult,
  type MCPToolDescriptor,
} from "./types.js";
import { signPayment, decodeRequirements, type AutoPaySigner } from "./autopay.js";

export interface GatewayClientOptions {
  /** Base URL of the gateway, e.g. "https://mcp.modulabase.org". */
  baseUrl: string;
  /** Optional bearer token (when OAUTH_ENABLED on the gateway). */
  bearer?: string;
  fetch?:  typeof fetch;
}

export interface CallToolOptions {
  /** Pre-signed PAYMENT-SIGNATURE header value (base64 EIP-3009 auth). */
  paymentSignature?: string;
  signal?: AbortSignal;
}

export interface AutoPayOptions {
  signal?: AbortSignal;
}

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id:      number;
  method:  string;
  params?: unknown;
}

interface JsonRpcResponse<T> {
  jsonrpc: "2.0";
  id:      number;
  result?: T;
  error?:  { code: number; message: string };
}

export class GatewayClient {
  private readonly baseUrl: string;
  private readonly bearer:  string | undefined;
  private readonly fetchFn: typeof fetch;
  private nextId = 1;

  constructor(opts: GatewayClientOptions) {
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.bearer  = opts.bearer;
    this.fetchFn = opts.fetch ?? globalThis.fetch.bind(globalThis);
  }

  async listTools(agency: string): Promise<MCPToolDescriptor[]> {
    const res = await this.rpc<{ tools: MCPToolDescriptor[] }>(
      agency,
      "tools/list",
      {},
    );
    return res.tools;
  }

  async callTool(
    agency: string,
    name: string,
    args: unknown,
    opts: CallToolOptions = {},
  ): Promise<MCPCallResult> {
    return this.rpc<MCPCallResult>(
      agency,
      "tools/call",
      { name, arguments: args },
      opts,
    );
  }

  /**
   * Call a tool, automatically signing an EIP-3009 USDC authorization when
   * the gateway returns 402. Requires `signer` — a viem WalletClient or any
   * object that implements `{ address, signTypedData }`.
   */
  async callToolWithAutoPay(
    agency: string,
    name: string,
    args: unknown,
    signer: AutoPaySigner,
    opts: AutoPayOptions = {},
  ): Promise<MCPCallResult> {
    try {
      return await this.callTool(agency, name, args, { signal: opts.signal });
    } catch (err) {
      if (!(err instanceof PaymentRequiredError)) throw err;

      const reqs = decodeRequirements(err.requirementsBase64);
      const paymentSignature = await signPayment(reqs, signer);

      return this.callTool(agency, name, args, {
        paymentSignature,
        signal: opts.signal,
      });
    }
  }

  /**
   * Stream a model tool's output as SSE chunks.
   *
   * Opens a POST to `POST /m/:agency/mcp/stream` on the gateway and
   * yields one string per `data:` line. Payment is signed on first
   * attempt; a 402 response triggers auto-pay and a single retry.
   */
  async *streamTool(
    agency: string,
    name: string,
    args: unknown,
    signer: AutoPaySigner,
    opts: AutoPayOptions = {},
  ): AsyncIterableIterator<string> {
    let sig: string | undefined;
    try {
      yield* this._stream(agency, name, args, sig, opts.signal);
      return;
    } catch (err) {
      if (!(err instanceof PaymentRequiredError)) throw err;
      const reqs = decodeRequirements(err.requirementsBase64);
      sig = await signPayment(reqs, signer);
    }
    yield* this._stream(agency, name, args, sig, opts.signal);
  }

  // ---------- internals ----------

  private async *_stream(
    agency: string,
    name: string,
    args: unknown,
    sig: string | undefined,
    signal?: AbortSignal,
  ): AsyncIterableIterator<string> {
    const url = `${this.baseUrl}/m/${agency}/mcp/stream`;
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept:         "text/event-stream",
    };
    if (this.bearer) headers["authorization"] = `Bearer ${this.bearer}`;
    if (sig) headers["PAYMENT-SIGNATURE"] = sig;

    const res = await this.fetchFn(url, {
      method: "POST",
      headers,
      signal,
      body: JSON.stringify({
        jsonrpc: "2.0",
        id:      this.nextId++,
        method:  "tools/call",
        params:  { name, arguments: args },
      }),
    });

    if (res.status === 402) {
      const requirements = res.headers.get("PAYMENT-REQUIRED") ?? "";
      throw new PaymentRequiredError(requirements, url);
    }

    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      throw new Error(`Modula gateway stream ${res.status}: ${text.slice(0, 200)}`);
    }

    const reader  = res.body.getReader();
    const dec     = new TextDecoder();
    let   buf     = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) yield line.slice(6);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  private async rpc<T>(
    agency: string,
    method: string,
    params: unknown,
    opts: CallToolOptions = {},
  ): Promise<T> {
    const url = `${this.baseUrl}/m/${agency}/mcp`;
    const headers: Record<string, string> = {
      "content-type": "application/json",
      accept:         "application/json",
    };
    if (this.bearer) headers["authorization"] = `Bearer ${this.bearer}`;
    if (opts.paymentSignature) headers["PAYMENT-SIGNATURE"] = opts.paymentSignature;

    const body: JsonRpcRequest = {
      jsonrpc: "2.0",
      id:      this.nextId++,
      method,
      params,
    };

    const res = await this.fetchFn(url, {
      method:  "POST",
      headers,
      body:    JSON.stringify(body),
      signal:  opts.signal,
    });

    if (res.status === 402) {
      const requirements = res.headers.get("PAYMENT-REQUIRED") ?? "";
      throw new PaymentRequiredError(requirements, url);
    }

    const text = await res.text();
    let json:  JsonRpcResponse<T>;
    try {
      json = JSON.parse(text) as JsonRpcResponse<T>;
    } catch {
      throw new Error(`Modula gateway ${res.status}: non-JSON response · ${text.slice(0, 200)}`);
    }

    if (json.error) {
      throw new Error(`Modula gateway ${json.error.code}: ${json.error.message}`);
    }
    if (json.result === undefined) {
      throw new Error("Modula gateway returned no result");
    }
    return json.result;
  }
}
