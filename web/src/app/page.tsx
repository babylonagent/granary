"use client";

import { useAccount } from "wagmi";
import { useEffect, useState, useMemo } from "react";
import { WalletButton } from "@/components/WalletButton";

// -- types ---------------------------------------------------------------
interface Pool {
  chain: string; project: string; symbol: string; tvlUsd: number;
  apy: number; apyBase: number | null; apyReward: number | null;
  stablecoin: boolean; ilRisk: string; exposure: string;
  category: string; apyPct1D: number; apyPct7D: number; apyPct30D: number;
}

// -- helpers --------------------------------------------------------------
const CATEGORY_BADGE: Record<string, string> = {
  lending: "bg-emerald-50 text-emerald-700 border-emerald-200",
  yield:   "bg-amber-50  text-amber-700  border-amber-200",
  lp:      "bg-purple-50 text-purple-700 border-purple-200",
};

function Trend({ value }: { value: number }) {
  const up = value > 0; const down = value < 0;
  const cls = up ? "text-emerald-600" : down ? "text-red-500" : "text-gray-400";
  const arrow = up ? "▲" : down ? "▼" : "─";
  const pct = Math.abs(value).toFixed(1);
  return <span className={`${cls} text-[11px] ml-1 tabular-nums font-medium`}>{arrow} {pct}%</span>;
}

function tvlFmt(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// -- stat cards -----------------------------------------------------------
function Stats({ pools }: { pools: Pool[] }) {
  const top = pools[0];
  const stablePools = pools.filter((p) => p.stablecoin);
  const bestStable = stablePools[0];
  const totalTVL = pools.reduce((s, p) => s + (p.tvlUsd || 0), 0);

  const cards = [
    { label: "Best APY", value: `${top?.apy?.toFixed(1) ?? "—"}%`,
      sub: top ? `${top.symbol} · ${top.project}` : "Loading…", accent: "text-slate-800" },
    { label: "Best Stablecoin", value: `${bestStable?.apy?.toFixed(1) ?? "—"}%`,
      sub: bestStable ? `${bestStable.symbol} · ${bestStable.project}` : "Filter stablecoins ↘",
      accent: "text-slate-800" },
    { label: "Total Pools Tracked", value: pools.length.toLocaleString(),
      sub: "Across 20+ protocols", accent: "text-slate-800" },
    { label: "Aggregate TVL", value: tvlFmt(totalTVL),
      sub: "All Base DeFi pools", accent: "text-slate-800" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold mb-1">{c.label}</div>
          <div className={`text-xl font-bold ${c.accent} tabular-nums`}>{c.value}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}

// -- pool row -------------------------------------------------------------
function PoolRow({ pool }: { pool: Pool }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors">
      <td className="py-3.5 pl-6 pr-4 font-mono font-bold text-right text-base text-slate-900 tabular-nums">
        {pool.apy.toFixed(2)}%
      </td>
      <td className="py-3.5 px-4 font-semibold text-slate-800">
        {pool.symbol}
        {pool.stablecoin && (
          <span className="ml-2 text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.5 rounded-full font-medium">STABLE</span>
        )}
      </td>
      <td className="py-3.5 px-4 text-slate-500 text-sm">{pool.project}</td>
      <td className="py-3.5 px-4">
        <span className={`text-[11px] uppercase tracking-wider font-semibold border rounded-full px-2.5 py-0.5 ${CATEGORY_BADGE[pool.category] || "bg-slate-50 text-slate-500 border-slate-200"}`}>
          {pool.category}
        </span>
      </td>
      <td className="py-3.5 px-4 text-right text-slate-500 text-sm tabular-nums">{tvlFmt(pool.tvlUsd)}</td>
      <td className="py-3.5 px-4 text-right">
        <Trend value={pool.apyPct7D} />
      </td>
      <td className="py-3.5 pr-6 pl-4">
        {pool.ilRisk === "yes" && (
          <span className="text-[10px] bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-full font-semibold">IL RISK</span>
        )}
      </td>
    </tr>
  );
}

// -- skeleton -------------------------------------------------------------
function Skeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex gap-4 animate-pulse px-6">
          <div className="h-6 w-16 bg-slate-100 rounded" />
          <div className="h-6 w-20 bg-slate-100 rounded" />
          <div className="h-6 w-28 bg-slate-100 rounded" />
          <div className="h-6 w-16 bg-slate-100 rounded ml-auto" />
        </div>
      ))}
    </div>
  );
}

// -- page -----------------------------------------------------------------
export default function Home() {
  const { address, isConnected } = useAccount();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [minTvl, setMinTvl] = useState(50); // $50K default

  useEffect(() => {
    fetch("/api/yields")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setPools(d.pools || []);
      })
      .catch(() => setError("Failed to load yield data"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(
    () =>
      pools.filter((p) => {
        if (filter && !p.symbol.toUpperCase().includes(filter.toUpperCase())) return false;
        if (catFilter && p.category !== catFilter) return false;
        if (p.tvlUsd < minTvl * 1000) return false;
        return true;
      }),
    [pools, filter, catFilter, minTvl],
  );

  // -- render -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ─── NAV ─────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="https://github.com/babylonagent/granary/raw/main/logo.png"
              alt="Granary"
              className="w-8 h-8 object-contain"
            />
            <div>
              <span className="font-bold text-slate-900 tracking-tight">Granary</span>
              <span className="hidden sm:inline ml-2 text-[11px] text-slate-400 uppercase tracking-wider font-semibold">Base DeFi Yield Terminal</span>
            </div>
          </div>
          <WalletButton />
        </div>
      </nav>

      {/* ─── HERO ────────────────────────────────────────────────── */}
      <section className="border-b border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">Market Overview</h2>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 animate-pulse">
                  <div className="h-3 w-20 bg-slate-100 rounded mb-2" />
                  <div className="h-7 w-24 bg-slate-100 rounded" />
                </div>
              ))}
            </div>
          ) : (
            <Stats pools={pools} />
          )}
        </div>
      </section>

      {/* ─── CONTROLS ────────────────────────────────────────────── */}
      <section className="sticky top-14 z-30 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center gap-3">
          {/* token filter */}
          <div className="relative flex-1 min-w-[180px] max-w-[260px]">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Search token…"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100 transition-all"
            />
          </div>
          {/* category */}
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-500">
            <option value="">All types</option>
            <option value="lending">Lending</option>
            <option value="yield">Yield vaults</option>
            <option value="lp">Liquidity pools</option>
          </select>
          {/* min TVL */}
          <select value={minTvl} onChange={(e) => setMinTvl(Number(e.target.value))}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:border-slate-500">
            <option value={0}>Any TVL</option>
            <option value={10}>$10K+</option>
            <option value={50}>$50K+</option>
            <option value={100}>$100K+</option>
            <option value={500}>$500K+</option>
            <option value={1000}>$1M+</option>
          </select>
          {/* count */}
          <span className="ml-auto text-xs text-slate-400 tabular-nums font-medium">
            {loading ? "…" : `${filtered.length} of ${pools.length} pools`}
          </span>
        </div>
      </section>

      {/* ─── TABLE ────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="p-6"><Skeleton /></div>
          ) : error ? (
            <div className="p-10 text-center">
              <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-5 py-3 text-red-600 text-sm font-medium">{error}</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-[11px] text-slate-400 uppercase tracking-widest font-semibold border-b border-slate-100">
                    <th className="py-3.5 pl-6 pr-4 text-right">APY</th>
                    <th className="py-3.5 px-4">Asset</th>
                    <th className="py-3.5 px-4">Protocol</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4 text-right">TVL</th>
                    <th className="py-3.5 px-4 text-right">7d Δ</th>
                    <th className="py-3.5 pr-6 pl-4">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 50).map((p, i) => (
                    <PoolRow key={`${p.project}-${p.symbol}-${i}`} pool={p} />
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && !loading && (
                <div className="text-center py-16 text-slate-400 text-sm">No pools match your filters. Try broadening your search.</div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ─── FOOTER ──────────────────────────────────────────────── */}
      <footer className="border-t border-slate-200 py-6 text-center">
        <p className="text-xs text-slate-400">
          Data via <a href="https://defillama.com" className="underline hover:text-slate-600 transition-colors" target="_blank" rel="noopener">DefiLlama</a>
          {" · "}Updated ~5 min · {pools.length.toLocaleString()} Base pools tracked
        </p>
      </footer>
    </div>
  );
}
