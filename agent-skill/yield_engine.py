#!/usr/bin/env python3
"""
YieldBase — DeFi yield aggregator for Base L2.

Primary data source: DefiLlama Yields API (yields.llama.fi/pools)
Covers: Aave v3, Morpho Blue, Aerodrome, Moonwell, Compound v3,
         Beefy, Uniswap v3/v4, Fluid, Euler, Harvest, and 20+ others.

Usage:
    python yield_engine.py                        # print all Base yields sorted
    python yield_engine.py --token USDC           # best USDC yields
    python yield_engine.py --token ETH --type lending  # lending-only
    python yield_engine.py --project aave-v3       # filter by protocol
    python yield_engine.py --best 5                # top 5
    python yield_engine.py --json                  # JSON output for agents
"""

import argparse
import json
import sys
import time
from datetime import datetime, timezone
from typing import Optional

import requests

LLAMA_YIELDS = "https://yields.llama.fi/pools"
CACHE_TTL = 600  # 10 minutes

_cache: dict = {"data": None, "fetched_at": 0}


def fetch_all_pools() -> list[dict]:
    """Return full pool list from DefiLlama, cached for CACHE_TTL seconds."""
    now = time.time()
    if _cache["data"] is not None and (now - _cache["fetched_at"]) < CACHE_TTL:
        return _cache["data"]
    resp = requests.get(LLAMA_YIELDS, timeout=30)
    resp.raise_for_status()
    _cache["data"] = resp.json()["data"]
    _cache["fetched_at"] = now
    return _cache["data"]


def filter_base(pools: list[dict]) -> list[dict]:
    """Return only Base-chain pools."""
    return [p for p in pools if p.get("chain") == "Base"]


def categorize(pool: dict) -> str:
    """Return 'lending', 'lp', 'yield', or 'other' based on project/exposure."""
    lending_projects = {
        "aave-v3", "compound-v3", "morpho-blue", "moonwell-lending",
        "fluid-lending", "euler-v2", "seamless-protocol", "ionic-money",
    }
    yield_projects = {"beefy", "harvest-finance", "yearn-finance"}
    if pool["project"] in lending_projects:
        return "lending"
    if pool["project"] in yield_projects:
        return "yield"
    if pool.get("exposure") == "single" and pool.get("ilRisk") == "no":
        return "lending"  # single-asset no-IL pools behave like lending
    if pool.get("exposure") == "multi":
        return "lp"
    return "lending"


def get_base_yields(
    token: Optional[str] = None,
    category: Optional[str] = None,
    project: Optional[str] = None,
    stablecoin_only: bool = False,
    min_tvl: float = 0,
    top_n: Optional[int] = None,
) -> list[dict]:
    """Return sorted, filtered Base yield opportunities."""
    pools = filter_base(fetch_all_pools())

    results = []
    for p in pools:
        if token and token.upper() not in p.get("symbol", "").upper():
            continue
        if stablecoin_only and not p.get("stablecoin"):
            continue
        if min_tvl and (p.get("tvlUsd") or 0) < min_tvl:
            continue
        if project and p["project"] != project:
            continue
        cat = categorize(p)
        if category and cat != category:
            continue
        results.append({**p, "category": cat})

    results.sort(key=lambda p: p.get("apy", 0), reverse=True)
    if top_n:
        results = results[:top_n]
    return results


def format_row(pool: dict) -> str:
    symbol = pool.get("symbol", "?")
    project = pool["project"]
    apy = pool.get("apy", 0)
    tvl = pool.get("tvlUsd", 0)
    cat = pool.get("category", "?")
    stable = "💲" if pool.get("stablecoin") else ""
    il = "⚠IL" if pool.get("ilRisk") == "yes" else ""
    tvl_str = f"${tvl:,.0f}" if tvl else "$?"
    return (
        f"{apy:7.2f}% │ {symbol:12s} │ {project:24s} │ {cat:7s} │ "
        f"{tvl_str:>12s} {stable} {il}"
    ).strip()


def cli():
    parser = argparse.ArgumentParser(description="YieldBase — Base DeFi yield aggregator")
    parser.add_argument("--token", help="Filter by token symbol (e.g., USDC, ETH)")
    parser.add_argument("--type", dest="category", choices=["lending", "lp", "yield"],
                        help="Category filter")
    parser.add_argument("--project", help="Filter by protocol (e.g., aave-v3, morpho-blue)")
    parser.add_argument("--stablecoin-only", action="store_true", help="Stablecoin pools only")
    parser.add_argument("--min-tvl", type=float, default=10000,
                        help="Minimum TVL in USD (default: 10000)")
    parser.add_argument("--best", dest="top_n", type=int, help="Show top N results")
    parser.add_argument("--json", action="store_true", help="Output as JSON")
    args = parser.parse_args()

    results = get_base_yields(
        token=args.token,
        category=args.category,
        project=args.project,
        stablecoin_only=args.stablecoin_only,
        min_tvl=args.min_tvl,
        top_n=args.top_n,
    )

    if args.json:
        print(json.dumps({
            "chain": "Base",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "pool_count": len(results),
            "pools": results,
        }, indent=2, default=str))
        return

    ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    print(f"═══ YieldBase · Base L2 · {ts} ═══")
    if args.token:
        print(f"  → Best {args.token} yields on Base\n")
    else:
        print(f"  → Top yields on Base\n")
    print(f"{'APY':>7} │ {'Symbol':12s} │ {'Protocol':24s} │ {'Type':7s} │ {'TVL':>12s}")
    print("─" * 80)
    for p in results[:50]:
        print(format_row(p))
    if len(results) > 50:
        print(f"\n  … and {len(results) - 50} more. Use --best N or --json for full data.")


if __name__ == "__main__":
    cli()
