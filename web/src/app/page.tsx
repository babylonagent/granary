"use client";

import { useAccount } from "wagmi";
import { useEffect, useState, useMemo } from "react";
import { WalletButton } from "@/components/WalletButton";

/* ── types ─────────────────────────────────────────────────────────── */
interface Pool {
  chain: string; project: string; symbol: string; tvlUsd: number;
  apy: number; apyBase: number | null; apyReward: number | null;
  stablecoin: boolean; ilRisk: string; exposure: string;
  category: string; apyPct1D: number; apyPct7D: number; apyPct30D: number;
}

/* ── formatting ────────────────────────────────────────────────────── */
function tvl(n: number) {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

/* ── stat card ─────────────────────────────────────────────────────── */
function Stat({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.08em", color: "var(--meta)", textTransform: "uppercase" as const }}>{label}</span>
      <span style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.1, color: "var(--fg)" }}>{value}</span>
      <span style={{ fontSize: 13, color: "var(--muted)" }}>{detail}</span>
    </div>
  );
}

/* ── trend indicator ───────────────────────────────────────────────── */
function Trend({ value }: { value: number }) {
  if (!value && value !== 0) return <span style={{ color: "var(--meta)", fontSize: 12 }}>—</span>;
  const up = value > 0; const down = value < 0;
  const color = up ? "var(--success)" : down ? "var(--danger)" : "var(--meta)";
  const arrow = up ? "↑" : down ? "↓" : "→";
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 500, color, letterSpacing: "0.02em" }}>{arrow} {Math.abs(value).toFixed(1)}%</span>;
}

/* ── category badge ────────────────────────────────────────────────── */
const CAT_STYLE: Record<string, { bg: string; fg: string }> = {
  lending: { bg: "#e8f5e9", fg: "#2e7d32" },
  yield:   { bg: "#fff8e1", fg: "#f57f17" },
  lp:      { bg: "#f3e5f5", fg: "#7b1fa2" },
};
function Badge({ cat }: { cat: string }) {
  const s = CAT_STYLE[cat] || { bg: "var(--surface-raised)", fg: "var(--muted)" };
  return <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" as const, background: s.bg, color: s.fg, padding: "2px 8px", borderRadius: "var(--radius-pill)", lineHeight: 1.6 }}>{cat}</span>;
}

/* ── skeleton ──────────────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "24px 0" }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ display: "flex", gap: 16, alignItems: "center", padding: "0 24px" }}>
          <div style={{ width: 60, height: 18, background: "var(--border-soft)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: 80, height: 18, background: "var(--border-soft)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.1s" }} />
          <div style={{ width: 120, height: 18, background: "var(--border-soft)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.2s" }} />
          <div style={{ flex: 1 }} />
          <div style={{ width: 60, height: 18, background: "var(--border-soft)", borderRadius: 6, animation: "pulse 1.5s ease-in-out infinite", animationDelay: "0.3s" }} />
        </div>
      ))}
      <style>{`@keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }`}</style>
    </div>
  );
}

/* ── ticker (smart money movements) ────────────────────────────────── */
function Ticker({ pools }: { pools: Pool[] }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate ticker items from actual pool data, update with fresh data
  const tickerItems = useMemo(() => {
    if (!pools.length) return [];
    const sorted = [...pools].sort((a, b) => b.apy - a.apy);
    const items: string[] = [];
    // Top movers - positive changes
    const gainers = sorted.filter(p => p.apyPct7D > 0.5).slice(0, 3);
    if (gainers.length) {
      items.push(gainers.map(p => `${p.symbol} (${p.project}) +${p.apyPct7D.toFixed(2)}%`).join("  •  "));
    }
    // Top yields
    const topYields = sorted.slice(0, 3);
    items.push(topYields.map(p => `${p.symbol} (${p.project}) ${p.apy.toFixed(1)}% APY`).join("  •  "));
    // Stablecoin highlights
    const stables = sorted.filter(p => p.stablecoin && p.apy > 3).slice(0, 3);
    if (stables.length) {
      items.push(stables.map(p => `${p.symbol} (${p.project}) ${p.apy.toFixed(1)}%`).join("  •  "));
    }
    return items.length ? items : ["Granary — Base DeFi Yield Terminal"];
  }, [pools]);

  const content = tickerItems.join("  •  ");

  if (!mounted) return (
    <div style={{
      overflow: "hidden", whiteSpace: "nowrap",
      background: "var(--surface-raised)", borderBottom: "1px solid var(--border)",
      fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.02em", height: 32, display: "flex", alignItems: "center",
    }} />
  );

  return (
    <div style={{
      overflow: "hidden", whiteSpace: "nowrap",
      background: "var(--surface-raised)", borderBottom: "1px solid var(--border)",
      fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", letterSpacing: "0.02em", height: 32, display: "flex", alignItems: "center",
    }}>
      <div style={{ display: "flex", animation: "ticker 40s linear infinite" }}>
        {/* Double the content for seamless loop */}
        <span style={{ paddingRight: 80 }}>{content}  •  </span>
        <span style={{ paddingRight: 80 }}>{content}  •  </span>
        <span style={{ paddingRight: 80 }}>{content}  •  </span>
        <span style={{ paddingRight: 80 }}>{content}  •  </span>
      </div>
      <style>{`@keyframes ticker { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
    </div>
  );
}

/* ── page ──────────────────────────────────────────────────────────── */
export default function Home() {
  const { address, isConnected } = useAccount();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [minTvl, setMinTvl] = useState(50);
  const [showRisky, setShowRisky] = useState(false); // NEW: safe mode toggle

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/yields", { signal: controller.signal })
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setPools(d.pools || []); })
      .catch(e => { if (e.name !== "AbortError") setError("Network error — check connection and retry."); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    return pools.filter(p => {
      if (!showRisky) {
        if (p.tvlUsd < 100_000) return false;
        if ((p.apy || 0) > 20) return false; // Filter APY > 20% as risky
      }
      if (search && !p.symbol.toUpperCase().includes(search.toUpperCase())) return false;
      if (cat && p.category !== cat) return false;
      if (p.tvlUsd < minTvl * 1000) return false;
      return true;
    });
  }, [pools, search, cat, minTvl, showRisky]);

  const topApy = filtered[0];
  const stableTop = filtered.find(p => p.stablecoin);
  const totalTvl = pools.reduce((s, p) => s + (p.tvlUsd || 0), 0);
  const protocols = new Set(pools.map(p => p.project)).size;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

      {/* ── NAV ────────────────────────────────────────────────────── */}
      <nav style={{ position: "sticky", top: 0, zIndex: 40, background: "rgba(250,250,250,0.88)", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 24, color: "var(--fg)", letterSpacing: "-0.02em" }}>GRANARY</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--meta)", letterSpacing: "0.04em", textTransform: "uppercase" }}>powered by babylon agent</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {isConnected && address && <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--muted)", letterSpacing: "0.02em" }}>{address.slice(0, 6)}…{address.slice(-4)}</span>}
            <WalletButton />
          </div>
        </div>
      </nav>

      {/* ── TICKER ─────────────────────────────────────────────────── */}
      <Ticker pools={pools} />

      {/* ── STATS ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "32px 24px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 1, background: "var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden", boxShadow: "var(--elev-ring)" }}>
          {[
            { label: "Best yield", value: loading ? "…" : `${topApy?.apy?.toFixed(1) ?? "—"}%`, detail: topApy ? `${topApy.symbol} · ${topApy.project}` : "—" },
            { label: "Best stablecoin", value: loading ? "…" : `${stableTop?.apy?.toFixed(1) ?? "—"}%`, detail: stableTop ? `${stableTop.symbol} · ${stableTop.project}` : "—" },
            { label: "Protocols", value: loading ? "…" : `${protocols}`, detail: "Active on Base" },
            { label: "Total TVL", value: loading ? "…" : tvl(totalTvl), detail: `${pools.length.toLocaleString()} pools` },
          ].map(c => <div key={c.label} style={{ background: "var(--surface)", padding: "20px 24px" }}><Stat {...c} /></div>)}
        </div>
      </section>

      {/* ── FILTERS ────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "24px 24px 0" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          {/* search */}
          <div style={{ position: "relative", flex: "1 1 200px", maxWidth: 280 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--meta)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text" placeholder="Search token…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", padding: "8px 12px 8px 36px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", background: "var(--surface)", color: "var(--fg)", fontSize: 14, fontFamily: "var(--font-body)", outline: "none", transition: "border-color var(--motion-fast) var(--ease)" }}
              onFocus={e => (e.currentTarget.style.borderColor = "var(--accent)")} onBlur={e => (e.currentTarget.style.borderColor = "var(--border)")}
            />
          </div>

          {/* category — styled */}
          <select value={cat} onChange={e => setCat(e.target.value)} style={{ 
            padding: "8px 32px 8px 12px", 
            border: "1px solid var(--border)", 
            borderRadius: "var(--radius-sm)", 
            background: "var(--surface)", 
            color: "var(--fg)", 
            fontSize: 14, 
            fontFamily: "var(--font-body)", 
            cursor: "pointer",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b6b6b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            backgroundSize: "12px"
          }}>
            <option value="">All types</option>
            <option value="lending">Lending</option>
            <option value="yield">Yield vaults</option>
            <option value="lp">Liquidity pools</option>
          </select>

          {/* min tvl — styled */}
          <select value={minTvl} onChange={e => setMinTvl(Number(e.target.value))} style={{ 
            padding: "8px 32px 8px 12px", 
            border: "1px solid var(--border)", 
            borderRadius: "var(--radius-sm)", 
            background: "var(--surface)", 
            color: "var(--fg)", 
            fontSize: 14, 
            fontFamily: "var(--font-body)", 
            cursor: "pointer",
            appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b6b6b' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
            backgroundSize: "12px"
          }}>
            <option value={0}>Any TVL</option>
            <option value={10}>$10K+</option>
            <option value={50}>$50K+</option>
            <option value={100}>$100K+</option>
            <option value={500}>$500K+</option>
            <option value={1000}>$1M+</option>
          </select>

          {/* SAFE MODE TOGGLE — styled */}
          <label style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 10, 
            fontSize: 13, 
            color: "var(--fg)", 
            cursor: "pointer", 
            userSelect: "none",
            padding: "8px 12px",
            background: "var(--surface-raised)",
            borderRadius: "var(--radius-sm)",
            border: "1px solid var(--border)",
            transition: "all var(--motion-fast) var(--ease)"
          }}>
            <input 
              type="checkbox" 
              checked={!showRisky} 
              onChange={e => setShowRisky(!e.target.checked)} 
              style={{ 
                accentColor: "var(--accent)",
                width: 16,
                height: 16,
                cursor: "pointer"
              }} 
            />
            <span>Safe mode</span>
          </label>

          <span style={{ marginLeft: "auto", fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--meta)", letterSpacing: "0.02em" }}>
            {loading ? "Loading…" : `${filtered.length} of ${pools.length}`}
          </span>
        </div>
      </section>

      {/* ── TABLE ──────────────────────────────────────────────────── */}
      <section style={{ maxWidth: 1120, margin: "0 auto", padding: "16px 24px 48px" }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", overflow: "hidden" }}>
          {loading ? <Skeleton /> : error ? (
            <div style={{ padding: 48, textAlign: "center" }}>
              <p style={{ fontSize: 15, color: "var(--danger)", fontWeight: 500 }}>{error}</p>
              <button onClick={() => window.location.reload()} style={{ marginTop: 16, padding: "8px 20px", background: "var(--surface-raised)", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", fontSize: 14, color: "var(--fg)", cursor: "pointer" }}>Retry</button>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["APY", "Asset", "Protocol", "Type", "TVL", "7d", ""].map((h, i) => (
                      <th key={h || i} style={{ padding: "12px 16px", textAlign: i === 0 || i === 4 || i === 5 ? "right" : "left", fontFamily: "var(--font-mono)", fontSize: 10, fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "var(--meta)", whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map((p, i) => (
                    <tr key={`${p.project}-${p.symbol}-${i}`} style={{ borderBottom: "1px solid var(--border-soft)", transition: "background var(--motion-fast) var(--ease)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-raised)")} onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: "var(--fg)", whiteSpace: "nowrap" }}>{p.apy.toFixed(2)}%</td>
                      <td style={{ padding: "14px 16px", fontWeight: 500, fontSize: 14, color: "var(--fg)" }}>{p.symbol}{p.stablecoin && <span style={{ marginLeft: 8, fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" as const, background: "#e8f5e9", color: "#2e7d32", padding: "1px 6px", borderRadius: "var(--radius-pill)" }}>Stable</span>}</td>
                      <td style={{ padding: "14px 16px", fontSize: 13, color: "var(--muted)" }}>{p.project}</td>
                      <td style={{ padding: "14px 16px" }}><Badge cat={p.category} /></td>
                      <td style={{ padding: "14px 16px", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--muted)" }}>{tvl(p.tvlUsd)}</td>
                      <td style={{ padding: "14px 16px", textAlign: "right" }}><Trend value={p.apyPct7D} /></td>
                      <td style={{ padding: "14px 16px", width: 60 }}>{p.ilRisk === "yes" && <span style={{ fontFamily: "var(--font-mono)", fontSize: 9, letterSpacing: "0.08em", textTransform: "uppercase" as const, background: "#fce4ec", color: "#c62828", padding: "1px 6px", borderRadius: "var(--radius-pill)" }}>IL</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div style={{ padding: 48, textAlign: "center" }}><p style={{ fontSize: 15, color: "var(--muted)", fontWeight: 500 }}>No pools match your filters</p></div>}
            </div>
          )}
        </div>
      </section>

      <footer style={{ borderTop: "1px solid var(--border)", padding: "20px 24px", textAlign: "center" }}>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.04em", color: "var(--meta)" }}>Data from DefiLlama · Updated every 5 min · {pools.length.toLocaleString()} Base pools</p>
      </footer>
    </div>
  );
}
