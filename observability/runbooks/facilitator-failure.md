# Runbook — Facilitator failure rate > 5%

**Severity:** critical · **Service:** `@modula/gateway` · `x402`

## Why this fires

x402 payment verify / settle round-trips to the Coinbase CDP
facilitator are failing for more than 5% of requests over 5
minutes. Agents see 402s that don't recover, or accepted payments
that don't settle.

## Triage in order

1. **Check Coinbase status** — `https://status.coinbase.com`.
   If x402 is degraded upstream, our only mitigation is failover
   (step 4).

2. **Check API key validity** — gateway logs the failure response
   from the facilitator. A `401 Unauthorized` from the facilitator
   means our `X402_FACILITATOR_API_KEY` is bad (rotated, expired,
   revoked). Mint a new key in the CDP dashboard, set via
   `flyctl secrets set X402_FACILITATOR_API_KEY=...`, redeploy.

3. **Check rate limits** — the free tier covers 1k tx/month. A
   `429` from the facilitator means we exhausted quota. Either
   upgrade the plan or fail over (step 4).

4. **Failover to backup facilitator.** The x402 spec is open;
   alternatives include the public x402 Foundation facilitator.
   Set:

   ```bash
   flyctl secrets set \
     X402_FACILITATOR_URL=https://facilitator.x402.org \
     X402_FACILITATOR_API_KEY=...
   flyctl deploy
   ```

   Code change isn't needed — the facilitator client respects
   whatever URL is configured.

## What gets affected

- **Tools/call** failures don't capture payment (UpstreamError
  bubbles before settle is invoked, so the EIP-3009 authorization
  expires uncharged). This is the right behavior; users are not
  double-charged.
- **Tools/list** is unaffected (no payment path).

## Don't do

- Don't disable x402 entirely (`X402_ENABLED=false`) — that lets
  inference happen for free, which violates Invariant 3 of the
  protocol (atomic payment + call).
