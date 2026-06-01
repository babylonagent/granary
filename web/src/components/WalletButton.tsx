"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState } from "react";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);

  if (isConnected && address) {
    return (
      <button
        onClick={() => disconnect()}
        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl px-4 py-2 text-sm font-medium transition-colors"
      >
        <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="font-mono">
          {address.slice(0, 6)}...{address.slice(-4)}
        </span>
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-600 hover:bg-blue-500 rounded-xl px-5 py-2 text-sm font-semibold transition-colors"
      >
        Connect Wallet
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-64 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl p-2 z-50">
          {connectors.map((c) => (
            <button
              key={c.uid}
              onClick={() => {
                connect({ connector: c });
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 rounded-lg hover:bg-zinc-800 text-sm transition-colors"
            >
              {c.name === "WalletConnect"
                ? "WalletConnect"
                : c.name}
            </button>
          ))}
          {/* Coinbase Wallet direct injection */}
          <button
            onClick={() => {
              connect({
                connector: connectors.find((c) =>
                  c.id.includes("walletConnect")
                ) || connectors[0],
              });
              setOpen(false);
            }}
            className="w-full text-left px-4 py-3 rounded-lg hover:bg-zinc-800 text-sm transition-colors text-blue-400"
          >
            Coinbase Wallet
          </button>
        </div>
      )}
    </div>
  );
}
