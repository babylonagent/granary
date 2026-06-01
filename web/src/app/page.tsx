"use client";

import { useAccount } from "wagmi";
import { useEffect, useState } from "react";
import { WalletButton } from "@/components/WalletButton";

interface Pool {
  chain: string;
  project: string;
  symbol: string;
  tvlUsd: number;
  apy: number;
  apyBase: number | null;
  apyReward: number | null;
  stablecoin: boolean;
  ilRisk: string;
  exposure: string;
  category: string;
  apyPct1D: number;
  apyPct7D: number;
  apyPct30D: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  lending: "text-green-400",
  yield: "text-yellow-400",
  lp: "text-purple-400",
};

function Trend({ value }: { value: number }) {
  const color = value > 0 ? "text-green-400" : value < 0 ? "text-red-400" : "text-gray-500";
  const arrow = value > 0 ? "↑" : value < 0 ? "↓" : "→";
  return (
    <span className={`${color} text-xs ml-1 tabular-nums`}>
      {arrow}{Math.abs(value).toFixed(1)}%
    </span>
  );
}

function PoolRow({ pool }: { pool: Pool }) {
  const tvlStr =
    pool.tvlUsd >= 1_000_000
      ? `$${(pool.tvlUsd / 1_000_000).toFixed(1)}M`
      : pool.tvlUsd >= 1_000
        ? `$${(pool.tvlUsd / 1_000).toFixed(0)}K`
        : `$${pool.tvlUsd.toFixed(0)}`;

  return (
    <tr className="border-b border-zinc-800 hover:bg-zinc-900/50 transition-colors">
      <td className="py-3 px-4 font-mono font-bold text-right text-lg">
        {pool.apy.toFixed(2)}%
      </td>
      <td className="py-3 px-4 font-medium">
        {pool.symbol}
        {pool.stablecoin && (
          <span className="ml-1.5 text-xs bg-green-900/60 text-green-300 px-1.5 py-0.5 rounded">
            STABLE
          </span>
        )}
      </td>
      <td className="py-3 px-4 text-zinc-400">{pool.project}</td>
      <td className="py-3 px-4">
        <span className={`${CATEGORY_COLORS[pool.category] || "text-zinc-400"} text-xs uppercase tracking-wide font-medium`}>
          {pool.category}
        </span>
      </td>
      <td className="py-3 px-4 text-right text-zinc-400">{tvlStr}</td>
      <td className="py-3 px-4 text-right">
        <Trend value={pool.apyPct7D} />
      </td>
      <td className="py-3 px-4">
        {pool.ilRisk === "yes" && (
          <span className="text-xs bg-red-900/50 text-red-300 px-1.5 py-0.5 rounded">
            IL
          </span>
        )}
      </td>
    </tr>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [minTvl, setMinTvl] = useState(5);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/yields")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setPools(data.pools || []);
        }
      })
      .catch(() => setError("Failed to load yield data"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = pools.filter((p) => {
    if (filter && !p.symbol.toUpperCase().includes(filter.toUpperCase())) return false;
    if (catFilter && p.category !== catFilter) return false;
    if (p.tvlUsd < minTvl * 1000) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center font-bold text-sm">
            YB
          </div>
          <div>
            <h1 className="font-bold text-lg">YieldBase</h1>
            <p className="text-xs text-zinc-500">Base L2 DeFi Yield Terminal</p>
          </div>
        </div>
        <WalletButton />
      </header>

      {/* Connected wallet banner */}
      {isConnected && address && (
        <div className="bg-zinc-900 border-b border-zinc-800 px-6 py-2.5 flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm text-zinc-400">
            Connected:{" "}
            <span className="text-white font-mono">
              {address.slice(0, 6)}...{address.slice(-4)}
            </span>
          </span>
          <span className="text-xs text-zinc-600">|</span>
          <span className="text-sm text-blue-400">
            Supply directly coming soon — use your wallet to deposit into any pool.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="px-6 py-4 flex flex-wrap gap-3 items-center border-b border-zinc-800/50 bg-zinc-900/30">
        <input
          type="text"
          placeholder="Filter token (USDC, ETH, cbBTC…)"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 w-56 focus:outline-none focus:border-blue-500"
        />
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">All types</option>
          <option value="lending">Lending</option>
          <option value="yield">Yield vaults</option>
          <option value="lp">Liquidity pools</option>
        </select>
        <select
          value={minTvl}
          onChange={(e) => setMinTvl(Number(e.target.value))}
          className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value={0}>Any TVL</option>
          <option value={10}>Min $10K TVL</option>
          <option value={50}>Min $50K TVL</option>
          <option value={100}>Min $100K TVL</option>
          <option value={500}>Min $500K TVL</option>
          <option value={1000}>Min $1M TVL</option>
        </select>
        <span className="text-zinc-600 text-sm ml-auto">
          {filtered.length} pools · {pools.length} total
        </span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="bg-red-900/30 border border-red-800 rounded-lg px-6 py-4 text-red-300">
            {error}
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-zinc-500 uppercase tracking-wider border-b border-zinc-800">
                <th className="py-3 px-4 text-right">APY</th>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Protocol</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">TVL</th>
                <th className="py-3 px-4 text-right">7d trend</th>
                <th className="py-3 px-4">Risk</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((pool, i) => (
                <PoolRow key={i} pool={pool} />
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && pools.length > 0 && (
            <div className="text-center py-16 text-zinc-500">
              No pools match your filters. Try broadening your search.
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800 px-6 py-4 mt-8 text-center text-xs text-zinc-600">
        Data via DefiLlama · {filtered.length.toLocaleString()} Base pools tracked · Updated every ~5 minutes
      </footer>
    </main>
  );
}
