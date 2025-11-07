import { defaultWagmiConfig } from "@web3modal/wagmi";
import { bsc, bscTestnet } from "wagmi/chains";

// Environment variables
export const WALLETCONNECT_PROJECT_ID = 
  import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || "demo_project_id";

// Supported chains
export const chains = [bscTestnet, bsc] as const;

// WalletConnect metadata
export const metadata = {
  name: "ALONEA",
  description: "Sustainable Web3 Ecosystem on BSC",
  url: typeof window !== "undefined" ? window.location.origin : "https://alonea.app",
  icons: ["/icon-192x192.png"],
};

// Wagmi config
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId: WALLETCONNECT_PROJECT_ID,
  metadata,
  enableCoinbase: false,
  enableInjected: true,
  enableWalletConnect: true,
});

// Contract addresses (will be updated after deployment)
export const CONTRACT_ADDRESSES = {
  ALOToken: import.meta.env.VITE_ALO_TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000",
  ALOStaking: import.meta.env.VITE_ALO_STAKING_ADDRESS || "0x0000000000000000000000000000000000000000",
  ALOGovernance: import.meta.env.VITE_ALO_GOVERNANCE_ADDRESS || "0x0000000000000000000000000000000000000000",
  ALOBuyback: import.meta.env.VITE_ALO_BUYBACK_ADDRESS || "0x0000000000000000000000000000000000000000",
} as const;

// Token decimals
export const ALO_DECIMALS = 18;

// Format ALO amount
export function formatALO(amount: bigint | string, decimals: number = 2): string {
  const value = typeof amount === "string" ? BigInt(amount) : amount;
  const divisor = BigInt(10 ** ALO_DECIMALS);
  const integer = value / divisor;
  const remainder = value % divisor;
  const decimal = Number(remainder) / Number(divisor);
  return (Number(整数) + decimal).toFixed(decimals);
}

// Parse ALO amount
export function parseALO(amount: string): bigint {
  const parts = amount.split(".");
  const integer = parts[0] || "0";
  const decimal = (parts[1] || "").padEnd(ALO_DECIMALS, "0").slice(0, ALO_DECIMALS);
  return BigInt(integer + decimal);
}
