# YieldBase — Base DeFi Yield Terminal

**One endpoint. Every Base protocol. The best yield, instantly.**

YieldBase aggregates yield opportunities across all major Base L2 protocols — Aave, Morpho, Moonwell, Aerodrome, Compound, Beefy, Uniswap, and 20+ more — through the DefiLlama Yields API. No per-protocol fragility. One query gives you the entire Base yield landscape.

## 🚀 Quick Start

### Web Dashboard
```bash
cd web
npm install
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id npm run dev
```

Opens at `http://localhost:3000` — connect your wallet (WalletConnect), browse yields sorted by APY, filter by token, category, min TVL.

### Agent Skill (Hermes)
```bash
# Install the skill
cp -r agent-skill/* ~/.hermes/skills/yieldbase/

# Use it directly
python3 yield_engine.py --token USDC --type lending --best 5
python3 yield_engine.py --token ETH --best 10 --json
python3 yield_engine.py --stablecoin-only --min-tvl 100000
```

### CLI
```bash
pip install -r agent-skill/requirements.txt
python3 agent-skill/yield_engine.py --help
```

## 📊 What's Covered

| Protocol | Type | Count |
|----------|------|-------|
| Aave v3 | Lending | 14 pools |
| Morpho Blue | Lending | 148 vaults |
| Moonwell | Lending | 19 pools |
| Compound v3 | Lending | 17 pools |
| Aerodrome | DEX LP | 434 pools |
| Uniswap v3/v4 | DEX LP | 852 pools |
| Beefy | Yield | 119 vaults |
| Harvest | Yield | 35 vaults |
| +15 more | Various | 1,100+ |

**Total: 2,696 Base pools tracked** (as of June 2026)

## 🏗 Architecture

```
yieldbase/
├── agent-skill/          # Hermes agent skill
│   ├── SKILL.md          # Agent-facing skill definition
│   ├── yield_engine.py   # Python yield aggregator
│   └── requirements.txt
├── web/                  # Next.js dashboard
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx    # Root layout + wagmi provider
│   │   │   ├── page.tsx      # Main yield table dashboard
│   │   │   └── api/yields/   # Server-side API route
│   │   └── components/
│   │       ├── Providers.tsx   # Wagmi + WalletConnect setup
│   │       └── WalletButton.tsx # Custom wallet connect button
│   └── package.json
└── README.md
```

## 🔐 Wallet Connection

The web dashboard supports WalletConnect for wallet connection. Once connected, the dashboard shows your wallet address and is ready for one-click deposit/supply (Phase 2).

**Required:** A WalletConnect Project ID (free at [cloud.walletconnect.com](https://cloud.walletconnect.com))

Set it as:
```bash
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

## 🛠 Tech Stack

- **Data:** DefiLlama Yields API (free, no auth required)
- **Web:** Next.js 16 + TypeScript + Tailwind CSS
- **Wallet:** wagmi + viem + WalletConnect
- **Deploy:** Vercel (zero-config)
- **Agent:** Hermes skill system

## 📈 Roadmap

- [x] Multi-protocol yield aggregation
- [x] Web dashboard with filters
- [x] Wallet connection (WalletConnect)
- [x] Hermes agent skill
- [ ] One-click supply/deposit per protocol
- [ ] Portfolio tracking across protocols
- [ ] Auto-compounding suggestions
- [ ] Telegram/Discord alert bot

## 📄 License

MIT — free for agents and humans alike.
