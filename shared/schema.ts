import { z } from "zod";

// Blockchain Network Configuration
export const SupportedChainId = {
  BSC_MAINNET: 56,
  BSC_TESTNET: 97,
} as const;

export type ChainId = typeof SupportedChainId[keyof typeof SupportedChainId];

// Staking Tiers
export enum StakingTier {
  FREE = "FREE",
  BRONZE = "BRONZE",
  SILVER = "SILVER",
  PLATINUM = "PLATINUM",
  DIAMOND = "DIAMOND",
}

export const StakingTierConfig = {
  [StakingTier.FREE]: {
    name: "Free",
    requiredALO: 0,
    multiplier: 1.0,
    color: "gray",
  },
  [StakingTier.BRONZE]: {
    name: "Bronze",
    requiredALO: 100,
    multiplier: 1.0,
    color: "orange",
  },
  [StakingTier.SILVER]: {
    name: "Silver",
    requiredALO: 500,
    multiplier: 1.1,
    color: "slate",
  },
  [StakingTier.PLATINUM]: {
    name: "Platinum",
    requiredALO: 1000,
    multiplier: 1.25,
    color: "blue",
  },
  [StakingTier.DIAMOND]: {
    name: "Diamond",
    requiredALO: 1500,
    multiplier: 1.5,
    color: "purple",
  },
} as const;

// Proposal Status
export enum ProposalStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUCCEEDED = "SUCCEEDED",
  DEFEATED = "DEFEATED",
  QUEUED = "QUEUED",
  EXECUTED = "EXECUTED",
  CANCELED = "CANCELED",
}

// Vote Type
export enum VoteType {
  FOR = "FOR",
  AGAINST = "AGAINST",
  ABSTAIN = "ABSTAIN",
}

// Transaction Status
export enum TransactionStatus {
  PENDING = "PENDING",
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
}

// Schemas
export const walletSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  chainId: z.number(),
  isConnected: z.boolean(),
});

export const tokenBalanceSchema = z.object({
  alo: z.string(),
  bnb: z.string(),
  usdValue: z.string().optional(),
});

export const stakingInfoSchema = z.object({
  stakedAmount: z.string(),
  tier: z.nativeEnum(StakingTier),
  rewards: z.string(),
  startTime: z.number(),
  apy: z.number(),
});

export const proposalSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  proposer: z.string(),
  status: z.nativeEnum(ProposalStatus),
  forVotes: z.string(),
  againstVotes: z.string(),
  abstainVotes: z.string(),
  startBlock: z.number(),
  endBlock: z.number(),
  quorum: z.string(),
  createdAt: z.number(),
});

export const buybackStatsSchema = z.object({
  totalBuyback: z.string(),
  totalBurned: z.string(),
  lastBuybackAmount: z.string(),
  lastBuybackTime: z.number(),
  treasuryBalance: z.string(),
});

export const transactionSchema = z.object({
  hash: z.string(),
  type: z.string(),
  status: z.nativeEnum(TransactionStatus),
  amount: z.string().optional(),
  timestamp: z.number(),
});

// Types
export type Wallet = z.infer<typeof walletSchema>;
export type TokenBalance = z.infer<typeof tokenBalanceSchema>;
export type StakingInfo = z.infer<typeof stakingInfoSchema>;
export type Proposal = z.infer<typeof proposalSchema>;
export type BuybackStats = z.infer<typeof buybackStatsSchema>;
export type Transaction = z.infer<typeof transactionSchema>;

// Contract ABIs will be exported after deployment
export interface ContractAddresses {
  ALOToken: string;
  ALOStaking: string;
  ALOGovernance: string;
  ALOBuyback: string;
}

// Network configurations
export const NETWORK_CONFIG = {
  [SupportedChainId.BSC_MAINNET]: {
    chainId: `0x${SupportedChainId.BSC_MAINNET.toString(16)}`,
    chainName: "BSC Mainnet",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
    rpcUrls: ["https://bsc-dataseed.binance.org/"],
    blockExplorerUrls: ["https://bscscan.com"],
  },
  [SupportedChainId.BSC_TESTNET]: {
    chainId: `0x${SupportedChainId.BSC_TESTNET.toString(16)}`,
    chainName: "BSC Testnet",
    nativeCurrency: {
      name: "tBNB",
      symbol: "tBNB",
      decimals: 18,
    },
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    blockExplorerUrls: ["https://testnet.bscscan.com"],
  },
} as const;
