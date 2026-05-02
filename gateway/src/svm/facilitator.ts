/**
 * SVM x402 facilitator client.
 *
 * Mirrors the EVM facilitator interface (gateway/src/x402/facilitator.ts)
 * but talks to a Solana-aware facilitator that knows how to:
 *   - deserialize a base64 SPL Token-2022 transfer transaction
 *   - verify the payer's signature against the included message
 *   - simulate the transfer against the cluster
 *   - on /settle, submit + confirm at the configured commitment
 *
 * The same wire shape is used for both networks (PaymentPayload,
 * PaymentRequirements) so the gateway middleware can dispatch on
 * network without re-implementing the request envelope.
 */
import type {
  PaymentPayload,
  PaymentRequirements,
  FacilitatorVerify,
  FacilitatorSettle,
} from "../x402/types.js";
import { UpstreamError } from "../errors.js";

export interface SvmFacilitatorClient {
  verify(payload: PaymentPayload, req: PaymentRequirements): Promise<FacilitatorVerify>;
  settle(payload: PaymentPayload, req: PaymentRequirements): Promise<FacilitatorSettle>;
}

export interface CreateSvmFacilitatorOptions {
  /** Facilitator base URL (e.g. https://x402.org/facilitator/svm). */
  baseUrl:    string;
  /** Optional bearer token for managed facilitators (Helius, Triton). */
  apiKey?:    string;
  fetchImpl?: typeof fetch;
  /** Per-call timeout. Default: 12s — Solana confirmation can be slow. */
  timeoutMs?: number;
}

export function createSvmFacilitator(
  opts: CreateSvmFacilitatorOptions,
): SvmFacilitatorClient {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const timeoutMs = opts.timeoutMs ?? 12_000;

  const post = async <T>(path: string, body: unknown): Promise<T> => {
    const ctrl = new AbortController();
    const t    = setTimeout(() => ctrl.abort(), timeoutMs);
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
          `svm facilitator ${path} → ${res.status}`,
          { body: text.slice(0, 256) },
        );
      }
      return JSON.parse(text) as T;
    } catch (e) {
      if (e instanceof UpstreamError) throw e;
      throw new UpstreamError(`svm facilitator ${path}`, e);
    } finally {
      clearTimeout(t);
    }
  };

  return {
    verify: (payload, req) =>
      post<FacilitatorVerify>("/verify", {
        paymentPayload:      payload,
        paymentRequirements: req,
      }),
    settle: (payload, req) =>
      post<FacilitatorSettle>("/settle", {
        paymentPayload:      payload,
        paymentRequirements: req,
      }),
  };
}
