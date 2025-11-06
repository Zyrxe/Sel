import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/config/web3";
import ALOTokenABI from "@/abis/ALOToken.json";
import ALOStakingABI from "@/abis/ALOStaking.json";
import ALOGovernanceABI from "@/abis/ALOGovernance.json";
import ALOBuybackABI from "@/abis/ALOBuyback.json";
import { formatEther, parseEther } from "viem";

// ALOToken Hooks
export function useALOBalance(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ALOToken as `0x${string}`,
    abi: ALOTokenABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACT_ADDRESSES.ALOToken !== "0x0000000000000000000000000000000000000000",
    },
  });
}

export function useTotalSupply() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ALOToken as `0x${string}`,
    abi: ALOTokenABI,
    functionName: "totalSupply",
    query: {
      enabled: CONTRACT_ADDRESSES.ALOToken !== "0x0000000000000000000000000000000000000000",
    },
  });
}

export function useTotalBurned() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ALOToken as `0x${string}`,
    abi: ALOTokenABI,
    functionName: "totalBurned",
    query: {
      enabled: CONTRACT_ADDRESSES.ALOToken !== "0x0000000000000000000000000000000000000000",
    },
  });
}

// ALOStaking Hooks
export function useStakeInfo(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ALOStaking as `0x${string}`,
    abi: ALOStakingABI,
    functionName: "getUserStakeInfo",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACT_ADDRESSES.ALOStaking !== "0x0000000000000000000000000000000000000000",
    },
  });
}

export function useTotalStaked() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ALOStaking as `0x${string}`,
    abi: ALOStakingABI,
    functionName: "totalStaked",
    query: {
      enabled: CONTRACT_ADDRESSES.ALOStaking !== "0x0000000000000000000000000000000000000000",
    },
  });
}

export function useStake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const stake = async (amount: string) => {
    const parsedAmount = parseEther(amount);
    writeContract({
      address: CONTRACT_ADDRESSES.ALOStaking as `0x${string}`,
      abi: ALOStakingABI,
      functionName: "stake",
      args: [parsedAmount],
    });
  };

  return {
    stake,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useUnstake() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const unstake = async (amount: string) => {
    const parsedAmount = parseEther(amount);
    writeContract({
      address: CONTRACT_ADDRESSES.ALOStaking as `0x${string}`,
      abi: ALOStakingABI,
      functionName: "unstake",
      args: [parsedAmount],
    });
  };

  return {
    unstake,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useClaimRewards() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const claimRewards = () => {
    writeContract({
      address: CONTRACT_ADDRESSES.ALOStaking as `0x${string}`,
      abi: ALOStakingABI,
      functionName: "claimRewards",
    });
  };

  return {
    claimRewards,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// ALOGovernance Hooks
export function useProposalCount() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ALOGovernance as `0x${string}`,
    abi: ALOGovernanceABI,
    functionName: "proposalCount",
    query: {
      enabled: CONTRACT_ADDRESSES.ALOGovernance !== "0x0000000000000000000000000000000000000000",
    },
  });
}

export function useProposal(proposalId?: number) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ALOGovernance as `0x${string}`,
    abi: ALOGovernanceABI,
    functionName: "getProposal",
    args: proposalId !== undefined ? [BigInt(proposalId)] : undefined,
    query: {
      enabled: proposalId !== undefined && CONTRACT_ADDRESSES.ALOGovernance !== "0x0000000000000000000000000000000000000000",
    },
  });
}

export function useVotingPower(address?: `0x${string}`) {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ALOGovernance as `0x${string}`,
    abi: ALOGovernanceABI,
    functionName: "getVotingPower",
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACT_ADDRESSES.ALOGovernance !== "0x0000000000000000000000000000000000000000",
    },
  });
}

export function useCreateProposal() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const createProposal = (title: string, description: string) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ALOGovernance as `0x${string}`,
      abi: ALOGovernanceABI,
      functionName: "propose",
      args: [title, description],
    });
  };

  return {
    createProposal,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

export function useCastVote() {
  const { writeContract, data: hash, isPending, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const castVote = (proposalId: number, support: 0 | 1 | 2) => {
    writeContract({
      address: CONTRACT_ADDRESSES.ALOGovernance as `0x${string}`,
      abi: ALOGovernanceABI,
      functionName: "castVote",
      args: [BigInt(proposalId), support],
    });
  };

  return {
    castVote,
    isPending,
    isConfirming,
    isSuccess,
    error,
    hash,
  };
}

// ALOBuyback Hooks
export function useBuybackStats() {
  return useReadContract({
    address: CONTRACT_ADDRESSES.ALOBuyback as `0x${string}`,
    abi: ALOBuybackABI,
    functionName: "getBuybackStats",
    query: {
      enabled: CONTRACT_ADDRESSES.ALOBuyback !== "0x0000000000000000000000000000000000000000",
    },
  });
}

// Helper function to format amounts
export function formatALOAmount(amount: bigint | undefined): string {
  if (!amount) return "0.00";
  return parseFloat(formatEther(amount)).toFixed(2);
}
