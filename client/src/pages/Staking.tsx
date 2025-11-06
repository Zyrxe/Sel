import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3 } from "@/hooks/useWeb3";
import { StakingTier, StakingTierConfig } from "@shared/schema";
import { Lock, Unlock, Trophy, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useALOBalance, useStakeInfo, useStake, useUnstake, useClaimRewards, formatALOAmount } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";

export default function Staking() {
  const { address, isConnected } = useWeb3();
  const { toast } = useToast();
  const [selectedTier, setSelectedTier] = useState<StakingTier | null>(null);
  const [stakeAmount, setStakeAmount] = useState("");
  const [unstakeAmount, setUnstakeAmount] = useState("");
  
  // Fetch contract data
  const { data: balance, isLoading: balanceLoading } = useALOBalance(address);
  const { data: stakeInfo, isLoading: stakeInfoLoading } = useStakeInfo(address);
  
  // Transaction hooks
  const { stake, isPending: stakePending, isConfirming: stakeConfirming, isSuccess: stakeSuccess, error: stakeError } = useStake();
  const { unstake, isPending: unstakePending, isConfirming: unstakeConfirming, isSuccess: unstakeSuccess, error: unstakeError } = useUnstake();
  const { claimRewards, isPending: claimPending, isConfirming: claimConfirming, isSuccess: claimSuccess, error: claimError } = useClaimRewards();
  
  // Extract stake info
  const stakedAmount = stakeInfo?.[0] || BigInt(0);
  const tier = stakeInfo?.[3] || 0;
  const pendingRewards = stakeInfo?.[4] || BigInt(0);
  
  // Handle transaction success
  useEffect(() => {
    if (stakeSuccess) {
      toast({
        title: "Success!",
        description: "Tokens staked successfully",
      });
      setStakeAmount("");
    }
  }, [stakeSuccess, toast]);
  
  useEffect(() => {
    if (unstakeSuccess) {
      toast({
        title: "Success!",
        description: "Tokens unstaked successfully",
      });
      setUnstakeAmount("");
    }
  }, [unstakeSuccess, toast]);
  
  useEffect(() => {
    if (claimSuccess) {
      toast({
        title: "Success!",
        description: "Rewards claimed successfully",
      });
    }
  }, [claimSuccess, toast]);
  
  // Handle transaction errors
  useEffect(() => {
    if (stakeError) {
      toast({
        title: "Error",
        description: stakeError.message || "Failed to stake tokens",
        variant: "destructive",
      });
    }
  }, [stakeError, toast]);
  
  useEffect(() => {
    if (unstakeError) {
      toast({
        title: "Error",
        description: unstakeError.message || "Failed to unstake tokens",
        variant: "destructive",
      });
    }
  }, [unstakeError, toast]);
  
  useEffect(() => {
    if (claimError) {
      toast({
        title: "Error",
        description: claimError.message || "Failed to claim rewards",
        variant: "destructive",
      });
    }
  }, [claimError, toast]);
  
  const handleStake = async () => {
    if (!stakeAmount || parseFloat(stakeAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid stake amount",
        variant: "destructive",
      });
      return;
    }
    await stake(stakeAmount);
  };
  
  const handleUnstake = async () => {
    if (!unstakeAmount || parseFloat(unstakeAmount) <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid unstake amount",
        variant: "destructive",
      });
      return;
    }
    await unstake(unstakeAmount);
  };
  
  const setMaxStake = () => {
    if (balance) {
      setStakeAmount(formatALOAmount(balance));
    }
  };
  
  const setMaxUnstake = () => {
    if (stakedAmount) {
      setUnstakeAmount(formatALOAmount(stakedAmount));
    }
  };

  const tiers = Object.entries(StakingTierConfig);

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "FREE": return "bg-slate-500/20 text-slate-300 border-slate-500";
      case "BRONZE": return "bg-orange-500/20 text-orange-300 border-orange-500";
      case "SILVER": return "bg-slate-400/20 text-slate-200 border-slate-400";
      case "PLATINUM": return "bg-blue-500/20 text-blue-300 border-blue-500";
      case "DIAMOND": return "bg-purple-500/20 text-purple-300 border-purple-500";
      default: return "bg-muted";
    }
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-12 max-w-md text-center glassmorphic">
          <Lock className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Connect your wallet to start staking ALO tokens
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold gradient-text">Staking</h1>
        <p className="text-muted-foreground">
          Stake ALO tokens to earn rewards and unlock higher tiers
        </p>
      </div>

      <Tabs defaultValue="stake" className="space-y-8">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="stake" data-testid="tab-stake">Stake</TabsTrigger>
          <TabsTrigger value="unstake" data-testid="tab-unstake">Unstake</TabsTrigger>
        </TabsList>

        <TabsContent value="stake" className="space-y-8">
          {/* Tier Cards */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Choose Your Tier</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {tiers.map(([key, config]) => (
                <TierCard
                  key={key}
                  tier={key as StakingTier}
                  config={config}
                  isSelected={selectedTier === key}
                  onSelect={() => setSelectedTier(key as StakingTier)}
                  getTierColor={getTierColor}
                />
              ))}
            </div>
          </div>

          {/* Staking Form */}
          {selectedTier && (
            <Card className="p-8 glassmorphic">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-semibold">
                    Stake for {StakingTierConfig[selectedTier].name} Tier
                  </h3>
                  <Badge className={getTierColor(selectedTier)}>
                    {StakingTierConfig[selectedTier].multiplier}x Multiplier
                  </Badge>
                </div>

                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Minimum required: {StakingTierConfig[selectedTier].requiredALO} ALO
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="stake-amount">Amount to Stake</Label>
                    <div className="flex gap-2">
                      <Input
                        id="stake-amount"
                        type="number"
                        placeholder="0.00"
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        className="text-lg h-14"
                        data-testid="input-stake-amount"
                        disabled={stakePending || stakeConfirming}
                      />
                      <Button
                        variant="outline"
                        onClick={setMaxStake}
                        data-testid="button-max"
                        disabled={stakePending || stakeConfirming}
                      >
                        MAX
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {balanceLoading ? (
                        <Skeleton className="h-4 w-32" />
                      ) : (
                        `Available: ${formatALOAmount(balance)} ALO`
                      )}
                    </p>
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Estimated APY</span>
                      <span className="font-semibold">0%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Reward Multiplier</span>
                      <span className="font-semibold">
                        {StakingTierConfig[selectedTier].multiplier}x
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Daily Rewards</span>
                      <span className="font-semibold">~0.00 ALO</span>
                    </div>
                  </div>

                  <Button
                    size="lg"
                    className="w-full text-lg h-14"
                    disabled={!stakeAmount || parseFloat(stakeAmount) <= 0 || stakePending || stakeConfirming}
                    onClick={handleStake}
                    data-testid="button-approve-stake"
                  >
                    <Lock className="h-5 w-5 mr-2" />
                    {stakePending || stakeConfirming ? "Staking..." : "Approve & Stake"}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By staking, you agree to lock your tokens for the selected tier
                  </p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="unstake" className="space-y-6">
          <Card className="p-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-semibold mb-2">Unstake Your ALO</h3>
                <p className="text-muted-foreground">
                  Withdraw your staked tokens and claim rewards
                </p>
              </div>

              <div className="p-6 rounded-lg bg-muted/50 space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Your Staked Amount</span>
                  {stakeInfoLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <span className="text-2xl font-bold" data-testid="text-staked-amount">
                      {formatALOAmount(stakedAmount)} ALO
                    </span>
                  )}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pending Rewards</span>
                  {stakeInfoLoading ? (
                    <Skeleton className="h-8 w-32" />
                  ) : (
                    <span className="text-2xl font-bold text-chart-1" data-testid="text-pending-rewards">
                      {formatALOAmount(pendingRewards)} ALO
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="unstake-amount">Amount to Unstake</Label>
                <div className="flex gap-2">
                  <Input
                    id="unstake-amount"
                    type="number"
                    placeholder="0.00"
                    value={unstakeAmount}
                    onChange={(e) => setUnstakeAmount(e.target.value)}
                    className="text-lg h-14"
                    data-testid="input-unstake-amount"
                    disabled={unstakePending || unstakeConfirming}
                  />
                  <Button 
                    variant="outline" 
                    onClick={setMaxUnstake}
                    data-testid="button-unstake-max"
                    disabled={unstakePending || unstakeConfirming}
                  >
                    MAX
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14"
                  disabled={!pendingRewards || pendingRewards === BigInt(0) || claimPending || claimConfirming}
                  onClick={() => claimRewards()}
                  data-testid="button-claim-only"
                >
                  {claimPending || claimConfirming ? "Claiming..." : "Claim Rewards Only"}
                </Button>
                <Button
                  size="lg"
                  className="h-14"
                  disabled={!unstakeAmount || parseFloat(unstakeAmount) <= 0 || unstakePending || unstakeConfirming}
                  onClick={handleUnstake}
                  data-testid="button-unstake"
                >
                  <Unlock className="h-5 w-5 mr-2" />
                  {unstakePending || unstakeConfirming ? "Unstaking..." : "Unstake"}
                </Button>
              </div>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Unstaking may affect your tier status and reward multiplier
                </AlertDescription>
              </Alert>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TierCard({
  tier,
  config,
  isSelected,
  onSelect,
  getTierColor,
}: {
  tier: StakingTier;
  config: typeof StakingTierConfig[StakingTier];
  isSelected: boolean;
  onSelect: () => void;
  getTierColor: (tier: string) => string;
}) {
  return (
    <Card
      className={`p-6 cursor-pointer transition-all hover-elevate ${
        isSelected ? "ring-2 ring-primary glow-primary" : ""
      }`}
      onClick={onSelect}
      data-testid={`card-tier-${tier.toLowerCase()}`}
    >
      <div className="space-y-4">
        <div className="flex flex-col items-center text-center">
          <Trophy className={`h-8 w-8 mb-3 ${config.color === "gray" ? "text-slate-400" : `text-${config.color}-500`}`} />
          <h3 className="font-semibold text-lg">{config.name}</h3>
        </div>

        <div className="space-y-2">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Required</p>
            <p className="text-xl font-bold font-heading">
              {config.requiredALO} ALO
            </p>
          </div>

          <Badge className={`w-full justify-center ${getTierColor(tier)}`}>
            {config.multiplier}x Multiplier
          </Badge>
        </div>

        <div className="text-center text-xs text-muted-foreground">
          <p>0 stakers</p>
        </div>
      </div>
    </Card>
  );
}
