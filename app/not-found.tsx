import Link from "next/link";
import { Home, ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { siteConfig } from "@/site.config";

export default function NotFound() {
  return (
    <section
      className="section"
      style={{ paddingBlock: "clamp(5rem, 12vw, 9rem)" }}
    >
      <div
        className="container-narrow"
        style={{ textAlign: "center", display: "grid", placeItems: "center" }}
      >
        <Logo size={64} />
        <div className="kicker" style={{ marginTop: "1.5rem" }}>
          <span className="dot" />
          Error 404
        </div>
        <h1
          style={{
            fontSize: "clamp(2.25rem, 5vw, 3.6rem)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            lineHeight: 1.1,
            margin: "1rem 0 1rem",
            textWrap: "balance",
          }}
        >
          This route isn&apos;t in the registry.
        </h1>
        <p
          style={{
            color: "var(--ink-60)",
            fontSize: 16,
            maxWidth: "40rem",
            lineHeight: 1.6,
            margin: "0 0 1.75rem",
          }}
        >
          The page you requested doesn&apos;t exist — or it hasn&apos;t been
          registered yet. Modula&apos;s registry is permissionless, but URLs are
          not.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/" className="btn btn-primary">
            <Home size={15} /> Back to home
          </Link>
          <Link href={siteConfig.registryPath} className="btn">
            <ArrowLeft size={15} /> Browse the registry
          </Link>
        </div>
      </div>
    </section>
  );
}
