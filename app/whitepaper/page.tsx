import Link from "next/link";
import { ArrowUpRight, Download } from "lucide-react";
import { siteConfig } from "@/site.config";

export const metadata = {
  title: "Whitepaper",
  description:
    "The Modula protocol whitepaper — tokenized AI model registry on Base. ERC-7527 bonding curves, MCP endpoints, x402 pay-per-inference.",
};

const TOC = [
  { id: "abstract", label: "Abstract" },
  { id: "problem", label: "1. The distribution problem" },
  { id: "registry", label: "2. Registry primitives" },
  { id: "erc7527", label: "3. ERC-7527 bonding curves" },
  { id: "mcp", label: "4. MCP endpoints" },
  { id: "x402", label: "5. x402 payment rail" },
  { id: "economics", label: "6. Token economics" },
  { id: "security", label: "7. Security model" },
  { id: "roadmap", label: "8. Roadmap" },
];

export default function Whitepaper() {
  return (
    <section className="section" style={{ paddingTop: "5rem" }}>
      <div className="container-narrow">
        <span className="kicker">
          <span className="dot" />
          Whitepaper · v0.1 draft
        </span>
        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: "0.75rem 0 0.75rem",
            lineHeight: 1.1,
          }}
        >
          Modula: a permissionless AI model registry on Base.
        </h1>
        <p
          style={{
            color: "var(--ink-60)",
            fontSize: 15,
            margin: "0 0 2rem",
          }}
        >
          {siteConfig.launchYear} · Modula Protocol
        </p>

        <div
          style={{
            display: "grid",
            gap: "2rem",
            gridTemplateColumns: "220px 1fr",
            alignItems: "start",
          }}
          className="wp-grid"
        >
          <aside
            style={{
              position: "sticky",
              top: "calc(var(--nav-h) + 1rem)",
              alignSelf: "start",
              padding: "1rem",
              border: "1px solid var(--border)",
              borderRadius: 12,
              background: "var(--bg-soft)",
              fontSize: 13,
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: "var(--ink-40)",
                fontWeight: 600,
                marginBottom: "0.75rem",
              }}
            >
              Contents
            </div>
            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: "0.45rem",
              }}
            >
              {TOC.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    style={{ color: "var(--ink-60)", fontSize: 13 }}
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <article
            style={{
              fontSize: 15,
              lineHeight: 1.75,
              color: "var(--ink-80)",
            }}
          >
            <section id="abstract">
              <h2 style={hStyle}>Abstract</h2>
              <p>
                Modula is a permissionless, on-chain registry for fine-tuned
                AI models. Creators register models directly on Base using
                ERC-7527; each registration mints a bonding-curve token and
                generates a Model Context Protocol (MCP) endpoint so any
                agent can call the model as a tool. Inference is paid at the
                edge in USDC via x402, with 100% of revenue flowing to the
                model&apos;s on-chain creator treasury. The bonding curve makes
                token price a live, unforgeable signal of model quality.
              </p>
            </section>

            <section id="problem">
              <h2 style={hStyle}>1. The distribution problem</h2>
              <p>
                The current AI distribution model was designed for humans
                clicking &quot;Get API Key&quot; on a dashboard. Agents do
                not click. They discover, negotiate, and settle
                programmatically — and the dominant centralized hubs are
                structurally unable to price specialized models fairly,
                approve every listing, or distribute revenue without a take
                rate. Modula replaces the hub with a protocol.
              </p>
            </section>

            <section id="registry">
              <h2 style={hStyle}>2. Registry primitives</h2>
              <p>
                The registry is a set of on-chain records, one per model.
                Every record carries an ERC-7527 token address, a creator
                treasury, a deterministic MCP endpoint URL, a content hash
                of the model artifact, a capability descriptor, and a
                lifetime inference counter. Records are public, indexable,
                and cannot be censored.
              </p>
            </section>

            <section id="erc7527">
              <h2 style={hStyle}>3. ERC-7527 bonding curves</h2>
              <p>
                Each registered model mints tokens on a deterministic
                bonding curve defined by ERC-7527. A portion of every
                inference payment is routed into the curve, raising the
                mint price. Over time, the curve&apos;s implied price
                becomes a running quality score: models that agents keep
                routing to appreciate; models that do not, do not.
              </p>
            </section>

            <section id="mcp">
              <h2 style={hStyle}>4. MCP endpoints</h2>
              <p>
                Every model is exposed as an MCP tool. Any MCP-aware agent
                (Claude, Cursor, a custom agent) can add the model with a
                single URL and call it with structured input. Discovery,
                invocation, and schema negotiation are handled by the
                standard, so Modula does not ship a per-model SDK.
              </p>
            </section>

            <section id="x402">
              <h2 style={hStyle}>5. x402 payment rail</h2>
              <p>
                Inference requests carry payment by default. Using x402 —
                an HTTP-native payment header standard — the calling agent
                signs both the request body and a USDC transfer in one
                round trip. The Modula gateway gates the response on
                settlement, so inference and payment are atomically
                bound. No API keys, no subscriptions, no manual top-ups.
              </p>
            </section>

            <section id="economics">
              <h2 style={hStyle}>6. Token economics</h2>
              <p>
                There is no platform token. Each model has its own
                ERC-7527 token. Supply is pinned by the curve; there is
                no team unlock, no treasury that can drain the market,
                and no inflation. The protocol takes 0% of inference
                revenue. Creators earn through direct inference payments
                plus curve appreciation as demand grows.
              </p>
            </section>

            <section id="security">
              <h2 style={hStyle}>7. Security model</h2>
              <p>
                Contracts are immutable after deployment. Endpoints are
                deterministic URLs derived from the registry record, so
                man-in-the-middle attacks on discovery are reducible to
                public-key verification against Base. All inference
                payments clear on-chain; there is no off-chain credit.
              </p>
            </section>

            <section id="roadmap">
              <h2 style={hStyle}>8. Roadmap</h2>
              <p>
                Mainnet launch in Q3 {siteConfig.launchYear} on Base, the
                first 100 models indexed by Q4 {siteConfig.launchYear},
                cross-rollup registry federation in 2027. See the{" "}
                <Link
                  href="/"
                  style={{ color: "var(--base-blue-600)", fontWeight: 500 }}
                >
                  home page roadmap
                </Link>{" "}
                for the current rolling list.
              </p>
            </section>

            <div
              style={{
                marginTop: "3rem",
                padding: "1.25rem 1.5rem",
                borderRadius: 12,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-soft)",
                display: "flex",
                flexWrap: "wrap",
                gap: "1rem",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ color: "var(--ink-60)", fontSize: 14 }}>
                PDF of this whitepaper
              </div>
              <a
                href="#"
                className="btn btn-sm btn-primary"
                aria-label="Download whitepaper PDF"
              >
                <Download size={13} /> Download PDF
                <ArrowUpRight size={12} />
              </a>
            </div>
          </article>
        </div>

        <style>{`
          @media (max-width: 800px) {
            .wp-grid {
              grid-template-columns: 1fr !important;
            }
            .wp-grid aside {
              position: static !important;
            }
          }
        `}</style>
      </div>
    </section>
  );
}

const hStyle: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 600,
  letterSpacing: "-0.01em",
  margin: "2rem 0 0.75rem",
  color: "var(--ink)",
  scrollMarginTop: "calc(var(--nav-h) + 1rem)",
};
