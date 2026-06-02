import "./globals.css";
import { Providers } from "@/components/Providers";
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: "Granary — Base DeFi Yield Terminal",
  description:
    "Find the best yield opportunities on Base L2. Lending, LP, and staking across Aave, Morpho, Aerodrome, Moonwell, Compound, Beefy, and 20+ protocols.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="bg-black text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
