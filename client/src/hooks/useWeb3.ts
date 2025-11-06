import { useAccount, useBalance, useDisconnect, useChainId, useSwitchChain } from "wagmi";
import { SupportedChainId } from "@shared/schema";

export function useWeb3() {
  const { address, isConnected, isConnecting } = useAccount();
  const chainId = useChainId();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Get BNB balance
  const { data: bnbBalance, isLoading: isLoadingBnb } = useBalance({
    address,
  });

  const isSupportedChain = 
    chainId === SupportedChainId.BSC_MAINNET || 
    chainId === SupportedChainId.BSC_TESTNET;

  const switchToSupportedChain = async () => {
    if (!isSupportedChain) {
      try {
        await switchChain({ chainId: SupportedChainId.BSC_TESTNET });
      } catch (error) {
        console.error("Failed to switch chain:", error);
      }
    }
  };

  return {
    address,
    isConnected,
    isConnecting,
    chainId,
    bnbBalance: bnbBalance?.formatted || "0",
    isLoadingBnb,
    isSupportedChain,
    disconnect,
    switchToSupportedChain,
  };
}
