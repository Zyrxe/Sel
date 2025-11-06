/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WALLETCONNECT_PROJECT_ID: string;
  readonly VITE_BSC_MAINNET_RPC: string;
  readonly VITE_BSC_TESTNET_RPC: string;
  readonly VITE_ALO_TOKEN_ADDRESS: string;
  readonly VITE_ALO_STAKING_ADDRESS: string;
  readonly VITE_ALO_GOVERNANCE_ADDRESS: string;
  readonly VITE_ALO_BUYBACK_ADDRESS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
