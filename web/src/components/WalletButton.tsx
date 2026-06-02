"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { useState, useRef, useEffect } from "react";

export function WalletButton() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function clickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", clickOutside);
    return () => document.removeEventListener("mousedown", clickOutside);
  }, []);

  // -- connected state ----------------------------------------------------
  if (isConnected && address) {
    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 bg-white border border-slate-300 hover:border-slate-400 rounded-xl px-4 py-2 text-sm font-medium text-slate-700 transition-all shadow-sm"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-slate-500">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>
          <svg className="w-3 h-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {open && (
          <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50">
            <button
              onClick={() => { disconnect(); setOpen(false); }}
              className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm text-slate-600 transition-colors"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  // -- disconnected state -------------------------------------------------
  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-5 py-2 text-sm font-semibold transition-all shadow-sm"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
        Connect Wallet
      </button>
      {open && (
        <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50">
          <div className="px-3 py-1.5 text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Select Wallet</div>
          <button
            onClick={() => {
              const wc = connectors.find((c) => c.id.includes("walletConnect")) || connectors[0];
              connect({ connector: wc });
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700 font-medium transition-colors flex items-center gap-2.5"
          >
            <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 24 24"><path d="M4.91 7.82C9.1 3.72 13.25 3.72 17.59 7.82l.42.41c.18.17.18.45 0 .63l-1.44 1.4c-.09.09-.23.09-.31 0l-.58-.57c-2.92-2.84-4.69-2.84-7.6 0l-.62.6c-.09.09-.23.09-.32 0l-1.44-1.4a.44.44 0 010-.63l.42-.41c.3-.29.6-.29.79 0zm15.57 2.96l1.28 1.24c.18.17.18.45 0 .63l-5.78 5.62c-.17.17-.45.17-.63 0l-4.1-3.99c-.05-.04-.12-.04-.17 0l-4.1 3.99c-.17.17-.45.17-.63 0L1.25 12.65a.44.44 0 010-.63l1.28-1.24c.17-.17.45-.17.63 0l4.1 3.99c.05.04.12.04.17 0l4.1-3.99c.17-.17.45-.17.63 0l4.1 3.99c.05.04.12.04.17 0l4.1-3.99c.17-.17.46-.17.63 0z"/></svg>
            </span>
            WalletConnect
          </button>
          <button
            onClick={() => {
              const wc = connectors.find((c) => c.id.includes("walletConnect")) || connectors[0];
              connect({ connector: wc });
              setOpen(false);
            }}
            className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-slate-50 text-sm text-slate-700 font-medium transition-colors flex items-center gap-2.5"
          >
            <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="6" fill="#0052FF"/>
                <path fill="#fff" d="M16 6c5.52 0 10 4.48 10 10s-4.48 10-10 10S6 21.52 6 16 10.48 6 16 6zm-2.5 8.5h-3v3h3v-3zm4 0h-3v3h3v-3zm4 0h-3v3h3v-3z"/>
              </svg>
            </span>
            Coinbase Wallet
          </button>
        </div>
      )}
    </div>
  );
}
