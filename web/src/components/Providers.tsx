"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { base } from "wagmi/chains";
import { walletConnect } from "@wagmi/connectors";
import { type ReactNode } from "react";

const PROJECT_ID =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "PLACEHOLDER";

const config = createConfig({
  chains: [base],
  connectors: [
    walletConnect({
      projectId: PROJECT_ID,
      metadata: {
        name: "YieldBase",
        description: "Base DeFi Yield Terminal",
        url: "https://yieldbase.vercel.app",
        icons: [],
      },
    }),
  ],
  transports: {
    [base.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
