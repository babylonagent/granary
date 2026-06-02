---
title: "Granary — Base DeFi Yield Aggregator"
description: "Find the best yield opportunities on Base L2 across Aave, Morpho, Aerodrome, Moonwell, Compound, Beefy, and 20+ more protocols. Single-source aggregator via DefiLlama."
name: granary
version: 0.1.0
---

# Granary — Base DeFi Yield Aggregator

Single-command yield discovery for Base L2. Queries **all** major Base protocols (Aave v3, Morpho Blue, Moonwell, Aerodrome, Compound v3, Beefy, Uniswap, Fluid, Euler, Harvest, and 15+ more) through the DefiLlama Yields API — one endpoint, no per-protocol fragility.

## When to use this skill

- An agent needs to find the best yield for a specific token (USDC, ETH, cbBTC, etc.)
- An agent needs to compare lending rates across protocols
- An agent needs to surface LP opportunities with incentives
- A user asks "where should I stake my ___ on Base?"
- A cron job needs to track yield movements over time

## How to use

The yield engine lives at `{SKILL_DIR}/yield_engine.py`. Call it via terminal:

```bash
python3 {SKILL_DIR}/yield_engine.py --token USDC --type lending --best 5
python3 {SKILL_DIR}/yield_engine.py --token ETH --best 10 --json
python3 {SKILL_DIR}/yield_engine.py --stablecoin-only --min-tvl 100000
python3 {SKILL_DIR}/yield_engine.py --project morpho-blue --best 10
python3 {SKILL_DIR}/yield_engine.py --help
```

### Common patterns

**Best USDC lending yields:**
```bash
python3 {SKILL_DIR}/yield_engine.py --token USDC --type lending --best 5
```

**Best stablecoin yields (>$100K TVL):**
```bash
python3 {SKILL_DIR}/yield_engine.py --stablecoin-only --min-tvl 100000 --best 10
```

**All ETH/LST opportunities:**
```bash
python3 {SKILL_DIR}/yield_engine.py --token ETH --best 10
```

**JSON output for programmatic use:**
```bash
python3 {SKILL_DIR}/yield_engine.py --token USDC --best 10 --json
```

### Interpreting results

- **`💲`** = stablecoin pool (lower risk)
- **`⚠IL`** = impermanent loss risk (LP pools)
- Category `lending` = single-asset supply (no IL, predictable)
- Category `yield` = auto-compounding vaults (Beefy/Harvest)
- Category `lp` = DEX liquidity positions (rewards + fees, but IL risk)

### Warning/blacklisting

The engine uses real-time data from DefiLlama. Freshly-launched or very small pools may show inflated APYs due to incentive epochs. Always check TVL — `--min-tvl 100000` filters out most risky outliers. The agent should NOT recommend pools < $50K TVL without explicit caution.

## Protocol coverage

| Protocol | Type | Covered? |
|----------|------|----------|
| Aave v3 | Lending | ✅ |
| Morpho Blue | Lending | ✅ |
| Moonwell | Lending | ✅ |
| Compound v3 | Lending | ✅ |
| Fluid | Lending | ✅ |
| Euler v2 | Lending | ✅ |
| Aerodrome | DEX LP | ✅ |
| Uniswap v3/v4 | DEX LP | ✅ |
| Beefy | Yield | ✅ |
| Harvest | Yield | ✅ |
| +15 more | Various | ✅ |

## Data freshness

DefiLlama API updates every ~5 minutes. Engine caches for 10 minutes locally. Always up to date within a 10-minute window.
