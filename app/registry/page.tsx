import Link from "next/link";
import { ArrowUpRight, Search, Filter } from "lucide-react";
import { MODELS, type RegistryModel } from "@/data/models";
import { listModels } from "@/lib/api";
import { toRegistryModel } from "@/lib/adapters";
import { siteConfig } from "@/site.config";

export const metadata = {
  title: "Registry",
  description:
    "Browse the Modula registry — fine-tuned AI models registered on-chain via ERC-7527, each with an MCP endpoint and a bonding-curve price.",
};

export const revalidate = 30;

export default async function RegistryPage() {
  // Server-side fetch with graceful fallback to mock data so the page
  // stays renderable in dev (no indexer running) and during platform
  // failover.
  let rows: readonly RegistryModel[] = MODELS;
  let total = MODELS.length;
  try {
    const res = await listModels({ limit: 50 });
    if (res.items.length > 0) {
      rows  = res.items.map(toRegistryModel);
      total = res.total;
    }
  } catch (err) {
    console.warn("[registry] indexer fetch failed, using mock", err);
  }

  return (
    <section className="section" style={{ paddingTop: "5rem" }}>
      <div className="container">
        <span className="kicker">
          <span className="dot" />
          On-chain registry
        </span>
        <h1
          style={{
            fontSize: "clamp(2.2rem, 5vw, 3.4rem)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: "0.75rem 0 1rem",
            lineHeight: 1.1,
          }}
        >
          Browse every registered model.
        </h1>
        <p
          style={{
            color: "var(--ink-60)",
            fontSize: 16.5,
            maxWidth: "42rem",
            lineHeight: 1.6,
            marginBottom: "2rem",
          }}
        >
          Every row below is an ERC-7527 model token on Base. Click through to
          see the MCP endpoint, the bonding curve, the creator treasury, and
          recent calls.
        </p>

        <div
          className="card"
          style={{
            padding: 0,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.9rem 1rem",
              borderBottom: "1px solid var(--border)",
              background: "var(--bg-soft)",
            }}
          >
            <Search size={14} style={{ color: "var(--ink-40)" }} />
            <div
              className="mono"
              style={{ fontSize: 12, color: "var(--ink-60)" }}
            >
              {rows.length} of {total.toLocaleString()} models shown · filters coming soon
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              {["All", "LoRA", "Adapter", "Small", "Domain"].map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 12,
                    padding: "0.3rem 0.6rem",
                    borderRadius: 6,
                    border: "1px solid var(--border)",
                    color: "var(--ink-60)",
                    background: t === "All" ? "var(--brand-soft)" : "transparent",
                    borderColor: t === "All" ? "var(--brand-border)" : "var(--border)",
                  }}
                >
                  {t}
                </span>
              ))}
              <span
                className="btn btn-sm"
                style={{ fontSize: 12, padding: "0.3rem 0.65rem" }}
              >
                <Filter size={12} /> Filter
              </span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13.5,
                minWidth: 720,
              }}
            >
              <thead>
                <tr
                  style={{
                    textAlign: "left",
                    color: "var(--ink-40)",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Model</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Type</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Base</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Calls</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>USDC / call</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Curve</th>
                  <th style={{ padding: "0.85rem 1rem", fontWeight: 600 }}>Endpoint</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr
                    key={m.id + m.name}
                    style={{ borderTop: "1px solid var(--border)" }}
                  >
                    <td style={{ padding: "0.95rem 1rem" }}>
                      <Link
                        href={`/registry/${m.name}`}
                        style={{ fontWeight: 600, color: "inherit", textDecoration: "none" }}
                      >
                        {m.name}
                      </Link>
                      <div
                        className="mono"
                        style={{
                          fontSize: 11,
                          color: "var(--ink-40)",
                          marginTop: 2,
                        }}
                      >
                        {m.id}
                      </div>
                    </td>
                    <td style={{ padding: "0.95rem 1rem" }}>
                      <span className="chip">{m.type}</span>
                    </td>
                    <td
                      className="mono"
                      style={{ padding: "0.95rem 1rem", fontSize: 12.5 }}
                    >
                      {m.base}
                    </td>
                    <td style={{ padding: "0.95rem 1rem" }}>{m.calls}</td>
                    <td
                      className="mono"
                      style={{ padding: "0.95rem 1rem", fontSize: 12.5 }}
                    >
                      ${m.price}
                    </td>
                    <td
                      style={{
                        padding: "0.95rem 1rem",
                        color: "var(--base-blue-600)",
                        fontWeight: 600,
                      }}
                    >
                      {m.curveMultiplier}
                    </td>
                    <td style={{ padding: "0.6rem 1rem" }}>
                      <Link
                        href={`/registry/${m.name}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 12,
                          color: "var(--base-blue-600)",
                        }}
                      >
                        Open MCP <ArrowUpRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div
          style={{
            marginTop: "2rem",
            padding: "1.5rem",
            borderRadius: 14,
            border: "1px dashed var(--brand-border)",
            background: "var(--brand-softer)",
            textAlign: "center",
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>
            Have a fine-tuned model?
          </div>
          <p style={{ color: "var(--ink-60)", fontSize: 14, margin: "0 0 1rem" }}>
            Registration is permissionless — no approval, no application.
          </p>
          <Link
            href={`${siteConfig.githubUrl}/blob/main/README.md`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-primary btn-sm"
          >
            Start the quickstart
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
