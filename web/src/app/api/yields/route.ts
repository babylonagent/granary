import { NextResponse } from "next/server";

const LLAMA_YIELDS = "https://yields.llama.fi/pools";

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
  apyPct1D: number;
  apyPct7D: number;
  apyPct30D: number;
  category: string;
}

function categorize(pool: Record<string, unknown>): string {
  const project = pool.project as string;
  const lending = new Set([
    "aave-v3", "compound-v3", "morpho-blue", "moonwell-lending",
    "fluid-lending", "euler-v2", "seamless-protocol", "ionic-money",
    "mortgagefi", "travessia-credit", "sprinter", "peapods-finance",
  ]);
  const yieldProjects = new Set(["beefy", "harvest-finance", "yearn-finance"]);
  if (lending.has(project)) return "lending";
  if (yieldProjects.has(project)) return "yield";
  if (pool.exposure === "single" && pool.ilRisk === "no") return "lending";
  if (pool.exposure === "multi") return "lp";
  return "lending";
}

export async function GET() {
  try {
    const resp = await fetch(LLAMA_YIELDS, {
      next: { revalidate: 300 }, // ISR: 5-minute cache
    });
    if (!resp.ok) {
      return NextResponse.json(
        { error: `DefiLlama API returned ${resp.status}` },
        { status: 502 }
      );
    }
    const json = await resp.json();
    const pools: Pool[] = (json.data as Record<string, unknown>[])
      .filter((p) => p.chain === "Base")
      .map((p) => ({
        ...p,
        category: categorize(p),
      }) as Pool)
      .sort((a, b) => (b.apy || 0) - (a.apy || 0));

    return NextResponse.json({
      chain: "Base",
      poolCount: pools.length,
      pools,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch yield data" },
      { status: 500 }
    );
  }
}
