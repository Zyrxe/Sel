import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3 } from "@/hooks/useWeb3";
import { Flame, TrendingUp, DollarSign, Clock, ArrowUpCircle } from "lucide-react";
import { useBuybackStats, formatALOAmount, useTotalBurned } from "@/hooks/useContracts";
import { formatEther } from "viem";

export default function Buyback() {
  const { isConnected } = useWeb3();
  
  // Fetch contract data
  const { data: buybackStats, isLoading: buybackStatsLoading } = useBuybackStats();
  const { data: totalBurned, isLoading: totalBurnedLoading } = useTotalBurned();
  
  // Extract buyback stats (structure depends on contract implementation)
  // Assuming getBuybackStats returns: [totalBuybackBNB, lastBuybackAmount, lastBuybackTime, treasuryBalance]
  const totalBuybackBNB = buybackStats?.[0] || BigInt(0);
  const lastBuybackAmount = buybackStats?.[1] || BigInt(0);
  const lastBuybackTime = buybackStats?.[2] || BigInt(0);
  const treasuryBalance = buybackStats?.[3] || BigInt(0);
  
  // Format BNB amounts
  const formatBNBAmount = (amount: bigint | undefined): string => {
    if (!amount) return "0.00";
    return parseFloat(formatEther(amount)).toFixed(4);
  };
  
  // Calculate supply impact percentage
  const calculateSupplyImpact = (): string => {
    if (!totalBurned || totalBurned === BigInt(0)) return "0";
    const INITIAL_SUPPLY = BigInt(1000000000); // 1 billion tokens (adjust based on your contract)
    const impact = (Number(totalBurned) / Number(INITIAL_SUPPLY)) * 100;
    return impact.toFixed(2);
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp: bigint): string => {
    if (!timestamp || timestamp === BigInt(0)) return "Never";
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-12 max-w-md text-center glassmorphic">
          <Flame className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Connect your wallet to view buyback statistics
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold gradient-text">Buyback & Burn</h1>
        <p className="text-muted-foreground">
          Automatic buyback mechanism to reduce supply and increase value
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={<Flame className="h-6 w-6" />}
          label="Total Burned"
          value={`${formatALOAmount(totalBurned)} ALO`}
          subtitle="Permanently removed from circulation"
          testId="card-total-burned"
          isLoading={totalBurnedLoading}
        />
        <StatsCard
          icon={<ArrowUpCircle className="h-6 w-6" />}
          label="Total Buyback"
          value={`${formatBNBAmount(totalBuybackBNB)} BNB`}
          subtitle="Used for buyback operations"
          testId="card-total-buyback"
          isLoading={buybackStatsLoading}
        />
        <StatsCard
          icon={<DollarSign className="h-6 w-6" />}
          label="Treasury Balance"
          value={`${formatBNBAmount(treasuryBalance)} BNB`}
          subtitle="Available for buyback"
          testId="card-treasury-balance"
          isLoading={buybackStatsLoading}
        />
        <StatsCard
          icon={<TrendingUp className="h-6 w-6" />}
          label="Impact on Supply"
          value={`${calculateSupplyImpact()}%`}
          subtitle="Total supply reduction"
          testId="card-supply-impact"
          isLoading={totalBurnedLoading}
        />
      </div>

      {/* Buyback Mechanism Explanation */}
      <Card className="p-8 glassmorphic">
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold mb-2">How It Works</h2>
            <p className="text-muted-foreground">
              The ALONEA buyback mechanism is designed to create sustainable value
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-chart-1/10 text-chart-1 mt-1">
                  <span className="text-lg font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Transaction Fees</h4>
                  <p className="text-sm text-muted-foreground">
                    2% of every transaction is collected:
                    <br />• 1% for buyback wallet
                    <br />• 0.5% for liquidity
                    <br />• 0.5% for treasury
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-chart-1/10 text-chart-1 mt-1">
                  <span className="text-lg font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Automatic Buyback</h4>
                  <p className="text-sm text-muted-foreground">
                    Accumulated BNB is used to buy back ALO tokens from the market automatically
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-chart-1/10 text-chart-1 mt-1">
                  <span className="text-lg font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Token Burn</h4>
                  <p className="text-sm text-muted-foreground">
                    Bought-back tokens are permanently removed from circulation, reducing total supply
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-chart-1/10 text-chart-1 mt-1">
                  <span className="text-lg font-bold">4</span>
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Value Increase</h4>
                  <p className="text-sm text-muted-foreground">
                    Reduced supply combined with constant demand creates upward price pressure
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Last Buyback */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Last Buyback Event</h3>
            <Clock className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Amount Bought</p>
              {buybackStatsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold" data-testid="text-last-buyback-amount">
                  {formatALOAmount(lastBuybackAmount)} ALO
                </p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">BNB Spent</p>
              {buybackStatsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold">{formatBNBAmount(totalBuybackBNB)} BNB</p>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Time</p>
              {buybackStatsLoading ? (
                <Skeleton className="h-8 w-32" />
              ) : (
                <p className="text-2xl font-bold" data-testid="text-last-buyback-time">
                  {formatTimestamp(lastBuybackTime)}
                </p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Buyback History */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Buyback History</h3>
          <div className="text-center py-12 text-muted-foreground">
            <Flame className="h-16 w-16 mx-auto mb-4 opacity-30" />
            <p>No buyback events yet</p>
            <p className="text-sm mt-2">Buyback history will appear here once the first event occurs</p>
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
  subtitle,
  testId,
  isLoading,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle: string;
  testId?: string;
  isLoading?: boolean;
}) {
  return (
    <Card className="p-6 hover-elevate" data-testid={testId}>
      <div className="space-y-4">
        <div className="p-2 rounded-lg bg-primary/10 text-primary w-fit">
          {icon}
        </div>
        <div>
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
          {isLoading ? (
            <Skeleton className="h-9 w-32" />
          ) : (
            <p className="text-3xl font-bold font-heading">{value}</p>
          )}
          <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
        </div>
      </div>
    </Card>
  );
}
