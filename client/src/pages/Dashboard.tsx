import { useWeb3 } from "@/hooks/useWeb3";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Wallet, Coins, Flame, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useALOBalance, useTotalStaked, useTotalBurned, useStakeInfo, formatALOAmount, useClaimRewards } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { StakingTierConfig } from "@shared/schema";

export default function Dashboard() {
  const { address, isConnected } = useWeb3();
  const { toast } = useToast();
  
  // Fetch contract data
  const { data: balance, isLoading: balanceLoading } = useALOBalance(address);
  const { data: totalStaked, isLoading: totalStakedLoading } = useTotalStaked();
  const { data: totalBurned, isLoading: totalBurnedLoading } = useTotalBurned();
  const { data: stakeInfo, isLoading: stakeInfoLoading } = useStakeInfo(address);
  
  // Claim rewards hook
  const { claimRewards, isPending: claimPending, isConfirming: claimConfirming, isSuccess: claimSuccess, error: claimError } = useClaimRewards();
  
  // Handle claim success/error
  useEffect(() => {
    if (claimSuccess) {
      toast({
        title: "Success!",
        description: "Rewards claimed successfully",
      });
    }
  }, [claimSuccess, toast]);
  
  useEffect(() => {
    if (claimError) {
      toast({
        title: "Error",
        description: claimError.message || "Failed to claim rewards",
        variant: "destructive",
      });
    }
  }, [claimError, toast]);
  
  // Extract stake info data
  const stakedAmount = stakeInfo?.[0] || BigInt(0);
  const tier = stakeInfo?.[3] || 0;
  const pendingRewards = stakeInfo?.[4] || BigInt(0);
  
  // Get tier config
  const tierKeys = Object.keys(StakingTierConfig);
  const currentTier = tierKeys[tier] || "FREE";
  const tierConfig = StakingTierConfig[currentTier as keyof typeof StakingTierConfig];

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-12 max-w-md text-center glassmorphic">
          <Wallet className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet to start staking ALO tokens and participate in governance
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's your ALONEA portfolio overview
        </p>
      </div>

      {/* Balance Card */}
      <Card className="glassmorphic p-8 rounded-3xl glow-chart-1">
        <div className="space-y-4">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Your ALO Balance
          </p>
          <div className="space-y-2">
            {balanceLoading ? (
              <Skeleton className="h-20 w-80" />
            ) : (
              <h2 className="text-6xl font-bold font-heading" data-testid="text-alo-balance">
                {formatALOAmount(balance)} <span className="text-3xl text-muted-foreground">ALO</span>
              </h2>
            )}
            <p className="text-xl text-muted-foreground">≈ $0.00 USD</p>
          </div>
          <div className="flex gap-3 pt-4">
            <Button size="lg" asChild data-testid="button-stake-now">
              <Link href="/staking">Stake Now</Link>
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-swap">
              <Link href="/swap">Swap</Link>
            </Button>
            <Button size="lg" variant="outline" data-testid="button-send">
              Send
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={<Coins className="h-6 w-6" />}
          label="Total Staked"
          value={`${formatALOAmount(totalStaked)} ALO`}
          change="+0%"
          testId="card-total-staked"
          isLoading={totalStakedLoading}
        />
        <StatsCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Current APY"
          value="0%"
          change="+0%"
          testId="card-current-apy"
          isLoading={false}
        />
        <StatsCard
          icon={<DollarSign className="h-6 w-6" />}
          label="Pending Rewards"
          value={`${formatALOAmount(pendingRewards)} ALO`}
          change="+0%"
          testId="card-pending-rewards"
          isLoading={stakeInfoLoading}
        />
        <StatsCard
          icon={<Flame className="h-6 w-6" />}
          label="Total Burned"
          value={`${formatALOAmount(totalBurned)} ALO`}
          change="+0%"
          testId="card-total-burned"
          isLoading={totalBurnedLoading}
        />
      </div>

      {/* Staking Overview */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">Your Staking</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Current tier and rewards information
              </p>
            </div>
            <Button variant="outline" asChild data-testid="button-view-staking">
              <Link href="/staking">View All Tiers</Link>
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">Current Tier</p>
                {stakeInfoLoading ? (
                  <Skeleton className="h-7 w-32 mt-1" />
                ) : (
                  <p className="text-lg font-semibold" data-testid="text-current-tier">
                    {tierConfig?.name || "Free Tier"}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Multiplier</p>
                {stakeInfoLoading ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-lg font-semibold">{tierConfig?.multiplier || 1.0}x</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm text-muted-foreground">Your Rewards</p>
                {stakeInfoLoading ? (
                  <Skeleton className="h-8 w-32 mt-1" />
                ) : (
                  <p className="text-2xl font-bold font-heading" data-testid="text-your-rewards">
                    {formatALOAmount(pendingRewards)} <span className="text-base">ALO</span>
                  </p>
                )}
              </div>
              <Button 
                size="lg" 
                disabled={!pendingRewards || pendingRewards === BigInt(0) || claimPending || claimConfirming} 
                onClick={() => claimRewards()}
                data-testid="button-claim-rewards"
              >
                {claimPending || claimConfirming ? "Claiming..." : "Claim Rewards"}
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Recent Activity</h3>
          <div className="text-center py-12 text-muted-foreground">
            <p>No recent transactions</p>
            <p className="text-sm mt-2">Your transaction history will appear here</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatsCard({
  icon,
  label,
  value,
  change,
  testId,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  change: string;
  testId?: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="p-6 hover-elevate" data-testid={testId}>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">{icon}</div>
          <span className="text-sm font-medium text-chart-1">{change}</span>
        </div>
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide">{label}</p>
          {isLoading ? (
            <Skeleton className="h-9 w-32 mt-2" />
          ) : (
            <p className="text-3xl font-bold font-heading mt-2">{value}</p>
          )}
        </div>
      </div>
    </Card>
  );
}
