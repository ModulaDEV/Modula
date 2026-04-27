/**
 * x402 facilitator client.
 *
 * Talks to a remote x402 facilitator over HTTP. By default we point at
 * the Coinbase CDP-hosted facilitator; the same client works against
 * any facilitator that implements the public x402 spec, so we can
 * swap to a self-hosted one by changing X402_FACILITATOR_URL.
 */
import type {
  PaymentPayload,
  PaymentRequirements,
  FacilitatorVerify,
  FacilitatorSettle,
} from "./types.js";
import { UpstreamError } from "../errors.js";

export interface FacilitatorClient {
  verify(payload: PaymentPayload, req: PaymentRequirements): Promise<FacilitatorVerify>;
  settle(payload: PaymentPayload, req: PaymentRequirements): Promise<FacilitatorSettle>;
}

export interface CreateFacilitatorOptions {
  baseUrl: string;
  /**
   * Optional bearer token. The public x402.org facilitator runs
   * unauthenticated; managed facilitators (Coinbase CDP, self-hosted)
   * can require a key. Omit for the public path.
   */
  apiKey?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export function createFacilitator(opts: CreateFacilitatorOptions): FacilitatorClient {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 8_000;

  const post = async <T>(path: string, body: unknown): Promise<T> => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (opts.apiKey) headers["authorization"] = `Bearer ${opts.apiKey}`;
    try {
      const res = await fetchImpl(opts.baseUrl + path, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      const text = await res.text();
      if (!res.ok) {
        throw new UpstreamError(
          `facilitator ${path} → ${res.status}`,
          { body: text.slice(0, 256) },
        );
      }
      return JSON.parse(text) as T;
    } catch (e) {
      if (e instanceof UpstreamError) throw e;
      throw new UpstreamError(`facilitator ${path}`, e);
    } finally {
      clearTimeout(t);
    }
  };

  return {
    verify: (payload, req) =>
      post<FacilitatorVerify>("/verify", { paymentPayload: payload, paymentRequirements: req }),
    settle: (payload, req) =>
      post<FacilitatorSettle>("/settle", { paymentPayload: payload, paymentRequirements: req }),
  };
}
