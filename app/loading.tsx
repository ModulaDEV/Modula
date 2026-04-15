export default function Loading() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        minHeight: "60vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0.9rem 1.3rem",
          border: "1px solid var(--brand-border)",
          background: "var(--brand-soft)",
          borderRadius: 999,
          color: "var(--base-blue-600)",
          fontSize: 13,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--brand)",
            boxShadow: "0 0 12px var(--brand-glow)",
            animation: "pulse 1.4s ease-in-out infinite",
          }}
        />
        Querying the Modula registry…
      </div>
    </div>
  );
}
