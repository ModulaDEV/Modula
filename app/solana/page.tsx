import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { siteConfig } from "@/site.config";

export const metadata = {
  title: "Modula on Solana — one protocol, two settlement layers",
  description:
    "Modula is expanding to Solana. Base remains home — core contracts, registry, and $MODULA stay on Base, unchanged. Solana adds an x402 settlement path so agents on SVM can pay Modula models in USDC.",
};

const STATUS_DOT = {
  done: { Icon: CheckCircle2, color: "var(--solana)" },
  prog: { Icon: Loader2,      color: "#f59e0b" },
  plan: { Icon: Circle,       color: "var(--ink-40)" },
} as const;

type Status = keyof typeof STATUS_DOT;

const STATUS: Array<{ status: Status; label: string }> = [
  { status: "done", label: "Frontend dual-chain messaging shipped" },
  { status: "done", label: "SOLANA.md architecture doc" },
  { status: "prog", label: "Gateway SVM x402 settlement path — scaffolded, behind SVM_ENABLED flag" },
  { status: "prog", label: "SDK SVM autopay surface — modula.callSvm()" },
  { status: "prog", label: "Indexer SVM event source — schema + cursor" },
  { status: "plan", label: "SVM facilitator deployed + SVM_ENABLED=true on production" },
  { status: "plan", label: "Default SvmTransferBuilder ships in @modula/sdk-solana" },
  { status: "plan", label: "Solana-native token launch (PumpFun)" },
  { status: "plan", label: "wXRP integration" },
];

export default function SolanaPage() {
  return (
    <section className="section" style={{ paddingTop: "5rem" }}>
      <div className="container" style={{ maxWidth: 880 }}>
        <span
          className="kicker"
          style={{ color: "var(--solana)", borderColor: "var(--solana-border)" }}
        >
          <span className="dot" style={{ background: "var(--solana)" }} />
          Solana expansion
        </span>

        <h1
          style={{
            fontSize: "clamp(2.4rem, 5.5vw, 3.6rem)",
            fontWeight: 700,
            letterSpacing: "-0.035em",
            margin: "0.75rem 0 1rem",
            lineHeight: 1.05,
          }}
        >
          One protocol. <span style={{ color: "var(--solana)" }}>Two settlement layers.</span>
        </h1>

        <p
          style={{
            color: "var(--ink-60)",
            fontSize: 17,
            maxWidth: "44rem",
            lineHeight: 1.6,
            marginBottom: "2.5rem",
          }}
        >
          Modula launched on{" "}
          <a href="https://base.org" target="_blank" rel="noopener noreferrer"
             style={{ color: "var(--base-blue)", textDecoration: "none", fontWeight: 600 }}>
            Base
          </a>{" "}
          and is expanding to{" "}
          <a href="https://solana.com" target="_blank" rel="noopener noreferrer"
             style={{ color: "var(--solana)", textDecoration: "none", fontWeight: 600 }}>
            Solana
          </a>.
          Base is home — core contracts, the model registry, and $MODULA stay on
          Base, unchanged. Solana adds a second x402 settlement path so agents on
          SVM can pay Modula models in USDC over their native rail.
        </p>

        <div style={{ display: "grid", gap: "1.5rem", gridTemplateColumns: "1fr 1fr", marginBottom: "3rem" }}
             className="solana-grid">
          <Card title="What stays on Base">
            <ul style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.65 }}>
              <li>ERC-7527 bonding-curve contracts</li>
              <li>Model registry — single source of truth</li>
              <li>$MODULA token + holder discount, unchanged</li>
              <li>All future protocol development</li>
            </ul>
          </Card>
          <Card title="What gets built on Solana" accent>
            <ul style={{ margin: 0, paddingLeft: "1.1rem", lineHeight: 1.65 }}>
              <li>x402 settlement path on SVM</li>
              <li>Solana-native SDK adapter</li>
              <li>Cross-chain model discovery</li>
              <li>Solana-native community token (PumpFun)</li>
            </ul>
          </Card>
        </div>

        <Callout>
          <strong>Two tokens, one protocol.</strong> $MODULA on Base is the
          protocol token — same address, same supply, same holder discount.
          The Solana token is a separate Solana-native community token with its
          own utility on Solana-settled inference. Not bridged. Not wrapped.
          Not a migration.
        </Callout>

        <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 1.9rem)", fontWeight: 700, letterSpacing: "-0.02em",
                     margin: "3rem 0 1rem" }}>
          Status
        </h2>
        <div className="card" style={{ padding: "1.5rem", borderRadius: 16 }}>
          <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            {STATUS.map((s, i) => {
              const dot = STATUS_DOT[s.status];
              const Icon = dot.Icon;
              return (
                <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14.5,
                                     color: s.status === "plan" ? "var(--ink-40)" : "var(--ink-80)" }}>
                  <Icon size={16} color={dot.color} style={s.status === "prog" ? { animation: "spin 2s linear infinite" } : undefined} />
                  <span>{s.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <h2 style={{ fontSize: "clamp(1.5rem, 3vw, 1.9rem)", fontWeight: 700, letterSpacing: "-0.02em",
                     margin: "3rem 0 1rem" }}>
          Read more
        </h2>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <DocLink href={`${siteConfig.githubUrl}/blob/main/SOLANA.md`} label="SOLANA.md — full architecture" />
          <DocLink href={`${siteConfig.githubUrl}/blob/main/CHANGELOG.md`} label="CHANGELOG — what shipped" />
          <DocLink href={`${siteConfig.githubUrl}/tree/main/gateway/src/svm`} label="gateway/src/svm — source" />
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 720px) {
          .solana-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  );
}

function Card({ title, children, accent }: { title: string; children: React.ReactNode; accent?: boolean }) {
  return (
    <div className="card" style={{
      padding: "1.4rem 1.5rem",
      borderRadius: 14,
      borderColor: accent ? "var(--solana-border)" : "var(--border)",
      background: accent ? "var(--solana-soft)" : "var(--bg-elev)",
    }}>
      <div style={{ fontWeight: 700, marginBottom: "0.6rem", fontSize: 14,
                    color: accent ? "var(--solana)" : "var(--ink)",
                    letterSpacing: "-0.005em" }}>
        {title}
      </div>
      <div style={{ color: "var(--ink-60)", fontSize: 14 }}>{children}</div>
    </div>
  );
}

function Callout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: "1.25rem 1.5rem",
      borderRadius: 12,
      borderLeft: "3px solid var(--solana)",
      background: "var(--solana-soft)",
      color: "var(--ink-80)",
      fontSize: 14.5,
      lineHeight: 1.65,
    }}>
      {children}
    </div>
  );
}

function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "0.55rem 0.9rem",
        borderRadius: 999,
        border: "1px solid var(--border)",
        fontSize: 13.5,
        color: "var(--ink-80)",
        textDecoration: "none",
        background: "var(--bg-elev)",
      }}
    >
      {label}
      <ArrowUpRight size={13} />
    </Link>
  );
}
