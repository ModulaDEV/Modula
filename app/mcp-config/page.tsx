import { McpConfigClient } from "./McpConfigClient";

export const metadata = {
  title: "MCP Config Generator",
  description:
    "Generate a ready-to-paste MCP server config for any Modula model. Works with Claude Desktop, Cursor, and VS Code.",
};

export default function McpConfigPage() {
  return (
    <section className="section" style={{ paddingTop: "5rem" }}>
      <div className="container-narrow">
        <span className="kicker">
          <span className="dot" />
          Tools · Agent setup
        </span>
        <h1
          style={{
            fontSize: "clamp(2rem, 4.5vw, 3rem)",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            margin: "0.75rem 0 0.5rem",
            lineHeight: 1.1,
          }}
        >
          MCP config generator.
        </h1>
        <p
          style={{
            color: "var(--ink-60)",
            fontSize: 15,
            margin: "0 0 2.5rem",
            maxWidth: 520,
            lineHeight: 1.65,
          }}
        >
          Pick a model, pick your MCP client, and get a snippet ready to paste.
          No API key. No SDK. Just a URL — payment flows automatically via x402.
        </p>

        <McpConfigClient />
      </div>
    </section>
  );
}
