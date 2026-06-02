"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useRef, useEffect } from "react";

export function WalletButton() {
  const { isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const btnBase: React.CSSProperties = {
    fontFamily: "var(--font-body)",
    fontSize: 14,
    fontWeight: 500,
    borderRadius: "var(--radius-sm)",
    cursor: "pointer",
    transition: "all var(--motion-fast) var(--ease)",
    border: "none",
    outline: "none",
  };

  if (isConnected) {
    return (
      <button
        onClick={() => disconnect()}
        style={{
          ...btnBase,
          padding: "7px 14px",
          background: "var(--surface-raised)",
          border: "1px solid var(--border)",
          color: "var(--muted)",
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--danger)"; e.currentTarget.style.color = "var(--danger)"; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.color = "var(--muted)"; }}
      >
        Disconnect
      </button>
    );
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          ...btnBase,
          padding: "8px 18px",
          background: "var(--fg)",
          color: "var(--bg)",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "var(--fg-2)"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "var(--fg)"; }}
      >
        Connect wallet
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: 44, width: 220,
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: "var(--radius-md)", boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
          padding: 6, zIndex: 50,
        }}>
          <div style={{
            fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
            textTransform: "uppercase" as const, color: "var(--meta)",
            padding: "6px 10px",
          }}>Select wallet</div>
          {connectors.map(c => (
            <button
              key={c.uid}
              onClick={() => { connect({ connector: c }); setOpen(false); }}
              style={{
                width: "100%", textAlign: "left", padding: "10px 10px",
                background: "transparent", border: "none", borderRadius: 6,
                fontSize: 14, fontFamily: "var(--font-body)", color: "var(--fg)",
                cursor: "pointer", transition: "background var(--motion-fast) var(--ease)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "var(--surface-raised)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
