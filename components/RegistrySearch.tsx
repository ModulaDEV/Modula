"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Search } from "lucide-react";

export function RegistrySearch() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = e.target.value.trim();
      const params = new URLSearchParams(searchParams.toString());
      if (q) {
        params.set("q", q);
      } else {
        params.delete("q");
      }
      // Debounce via startTransition — no external dep needed
      startTransition(() => {
        router.replace(`/registry?${params.toString()}`, { scroll: false });
      });
    },
    [router, searchParams],
  );

  return (
    <div style={{ position: "relative", flex: 1, minWidth: 180 }}>
      <Search
        size={13}
        style={{
          position: "absolute",
          left: 10,
          top: "50%",
          transform: "translateY(-50%)",
          color: "var(--ink-40)",
          pointerEvents: "none",
        }}
      />
      <input
        type="search"
        defaultValue={searchParams.get("q") ?? ""}
        onChange={handleChange}
        placeholder="Search models…"
        style={{
          width: "100%",
          paddingLeft: 30,
          paddingRight: 10,
          paddingTop: 6,
          paddingBottom: 6,
          fontSize: 12.5,
          border: "1px solid var(--border)",
          borderRadius: 8,
          background: "transparent",
          color: "var(--ink)",
          outline: "none",
          fontFamily: "inherit",
        }}
      />
    </div>
  );
}
