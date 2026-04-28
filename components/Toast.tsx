"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

/**
 * Lightweight toast system — one provider mounts a fixed-position
 * stack at the top of the page; any client component can call
 * useToast().show("message") to push a new entry.
 *
 * The stack is intentionally minimal: a single message at a time
 * (replacing in place if a second one fires inside the duration), no
 * variants, no positioning options. The CA copy button is the first
 * caller and likely the only one for a while; the API is small enough
 * to extend later.
 */

interface ToastApi {
  show: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

interface ToastEntry {
  id:      number;
  message: string;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [entry, setEntry] = useState<ToastEntry | null>(null);
  const counter = useRef(0);
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string) => {
    counter.current += 1;
    setEntry({ id: counter.current, message });
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => setEntry(null), 2200);
  }, []);

  // Clean up on unmount so the timer doesn't fire after the provider
  // is gone (would be a no-op but lints complain).
  useEffect(() => {
    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="toast-root" aria-live="polite" aria-atomic="true">
        <AnimatePresence>
          {entry && (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0,   scale: 1 }}
              exit={{    opacity: 0, y: -8,  scale: 0.98 }}
              transition={{ duration: 0.22, ease: [0.2, 0.7, 0.2, 1] }}
              className="toast-card"
              role="status"
            >
              <span className="toast-ico">
                <Check size={13} strokeWidth={2.6} />
              </span>
              <span className="toast-msg">{entry.message}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .toast-root {
          position: fixed;
          top: calc(var(--nav-h) + 12px);
          left: 0;
          right: 0;
          display: flex;
          justify-content: center;
          z-index: 60;
          pointer-events: none;
          padding-inline: 16px;
        }
        .toast-card {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 9px 16px 9px 12px;
          border-radius: 999px;
          background: #0b1020;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: -0.005em;
          box-shadow:
            0 1px 0 rgba(255, 255, 255, 0.08) inset,
            0 18px 36px -18px rgba(11, 16, 32, 0.5);
          pointer-events: auto;
        }
        .toast-ico {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
          border-radius: 999px;
          background: var(--base-blue);
          color: #fff;
        }
        .toast-msg {
          white-space: nowrap;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Soft fallback — if a component calls useToast outside the
    // provider tree (e.g. in a Storybook story), we don't want the
    // build to crash; we just log a warning and no-op.
    return {
      show: (m) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[toast] show() called outside ToastProvider:", m);
        }
      },
    };
  }
  return ctx;
}
