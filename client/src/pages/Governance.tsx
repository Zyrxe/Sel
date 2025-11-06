import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeb3 } from "@/hooks/useWeb3";
import { ProposalStatus, VoteType } from "@shared/schema";
import { Vote, Clock, CheckCircle, XCircle, AlertCircle, Plus } from "lucide-react";
import { useProposalCount, useVotingPower, useCreateProposal, useCastVote, formatALOAmount } from "@/hooks/useContracts";
import { useToast } from "@/hooks/use-toast";

export default function Governance() {
  const { address, isConnected } = useWeb3();
  const { toast } = useToast();
  const [selectedProposal, setSelectedProposal] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [proposalTitle, setProposalTitle] = useState("");
  const [proposalDescription, setProposalDescription] = useState("");
  
  // Fetch contract data
  const { data: proposalCount, isLoading: proposalCountLoading } = useProposalCount();
  const { data: votingPower, isLoading: votingPowerLoading } = useVotingPower(address);
  
  // Transaction hooks
  const { createProposal, isPending: createPending, isConfirming: createConfirming, isSuccess: createSuccess, error: createError } = useCreateProposal();
  
  // Handle transaction success
  useEffect(() => {
    if (createSuccess) {
      toast({
        title: "Success!",
        description: "Proposal created successfully",
      });
      setShowCreateDialog(false);
      setProposalTitle("");
      setProposalDescription("");
    }
  }, [createSuccess, toast]);
  
  // Handle transaction error
  useEffect(() => {
    if (createError) {
      toast({
        title: "Error",
        description: createError.message || "Failed to create proposal",
        variant: "destructive",
      });
    }
  }, [createError, toast]);
  
  const handleCreateProposal = () => {
    if (!proposalTitle.trim() || !proposalDescription.trim()) {
      toast({
        title: "Invalid Input",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    createProposal(proposalTitle, proposalDescription);
  };

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="p-12 max-w-md text-center glassmorphic">
          <Vote className="h-16 w-16 mx-auto mb-6 text-primary" />
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-muted-foreground">
            Connect your wallet to participate in governance
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Governance</h1>
          <p className="text-muted-foreground">
            Vote on proposals and shape the future of ALONEA
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-proposal">
          <Plus className="h-5 w-5 mr-2" />
          Create Proposal
        </Button>
      </div>

      {/* Voting Power Card */}
      <Card className="p-6 glassmorphic">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Your Voting Power</p>
            {votingPowerLoading ? (
              <Skeleton className="h-12 w-48 mt-2" />
            ) : (
              <p className="text-4xl font-bold font-heading mt-2" data-testid="text-voting-power">
                {formatALOAmount(votingPower)} <span className="text-xl text-muted-foreground">ALO</span>
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">Based on your staked balance</p>
          </div>
          <Vote className="h-16 w-16 text-primary/30" />
        </div>
      </Card>

      {/* Proposals Tabs */}
      <Tabs defaultValue="active" className="space-y-6">
        <TabsList>
          <TabsTrigger value="active" data-testid="tab-active-proposals">Active</TabsTrigger>
          <TabsTrigger value="pending" data-testid="tab-pending-proposals">Pending</TabsTrigger>
          <TabsTrigger value="executed" data-testid="tab-executed-proposals">Executed</TabsTrigger>
          <TabsTrigger value="all" data-testid="tab-all-proposals">All</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {proposalCountLoading ? (
            <Card className="p-12">
              <div className="space-y-4">
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-20 w-full" />
              </div>
            </Card>
          ) : (
            <EmptyProposals message="No active proposals at the moment" />
          )}
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          {proposalCountLoading ? (
            <Card className="p-12">
              <Skeleton className="h-32 w-full" />
            </Card>
          ) : (
            <EmptyProposals message="No pending proposals" />
          )}
        </TabsContent>

        <TabsContent value="executed" className="space-y-4">
          {proposalCountLoading ? (
            <Card className="p-12">
              <Skeleton className="h-32 w-full" />
            </Card>
          ) : (
            <EmptyProposals message="No executed proposals yet" />
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {proposalCountLoading ? (
            <Card className="p-12">
              <Skeleton className="h-32 w-full" />
            </Card>
          ) : proposalCount && proposalCount > BigInt(0) ? (
            <div className="text-center text-muted-foreground p-8">
              <p>Total Proposals: {proposalCount.toString()}</p>
              <p className="text-sm mt-2">Proposal details will be displayed here</p>
            </div>
          ) : (
            <EmptyProposals message="No proposals created yet" />
          )}
        </TabsContent>
      </Tabs>

      {/* Create Proposal Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Proposal</DialogTitle>
            <DialogDescription>
              Submit a proposal for the community to vote on
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="proposal-title">Proposal Title</Label>
              <Input
                id="proposal-title"
                placeholder="Enter proposal title"
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                data-testid="input-proposal-title"
                disabled={createPending || createConfirming}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="proposal-description">Description</Label>
              <Textarea
                id="proposal-description"
                placeholder="Describe your proposal in detail..."
                rows={6}
                value={proposalDescription}
                onChange={(e) => setProposalDescription(e.target.value)}
                data-testid="textarea-proposal-description"
                disabled={createPending || createConfirming}
              />
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>Your staked balance determines your voting power</p>
                  {votingPowerLoading ? (
                    <Skeleton className="h-5 w-48" />
                  ) : (
                    <p className="font-semibold text-foreground">
                      Current voting power: {formatALOAmount(votingPower)} ALO
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateDialog(false)}
              disabled={createPending || createConfirming}
            >
              Cancel
            </Button>
            <Button 
              disabled={!proposalTitle.trim() || !proposalDescription.trim() || createPending || createConfirming}
              onClick={handleCreateProposal}
              data-testid="button-submit-proposal"
            >
              {createPending || createConfirming ? "Creating..." : "Submit Proposal"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyProposals({ message }: { message: string }) {
  return (
    <Card className="p-12">
      <div className="text-center text-muted-foreground">
        <Vote className="h-16 w-16 mx-auto mb-4 opacity-30" />
        <p className="text-lg">{message}</p>
        <p className="text-sm mt-2">Check back later or create a new proposal</p>
      </div>
    </Card>
  );
}

function ProposalCard({
  id,
  title,
  status,
  forVotes,
  againstVotes,
  timeLeft,
  quorum,
}: {
  id: string;
  title: string;
  status: ProposalStatus;
  forVotes: number;
  againstVotes: number;
  timeLeft: string;
  quorum: number;
}) {
  const totalVotes = forVotes + againstVotes;
  const forPercentage = totalVotes > 0 ? (forVotes / totalVotes) * 100 : 0;
  const againstPercentage = totalVotes > 0 ? (againstVotes / totalVotes) * 100 : 0;

  const getStatusBadge = () => {
    switch (status) {
      case ProposalStatus.ACTIVE:
        return <Badge variant="default">Active</Badge>;
      case ProposalStatus.SUCCEEDED:
        return <Badge className="bg-green-500">Succeeded</Badge>;
      case ProposalStatus.DEFEATED:
        return <Badge variant="destructive">Defeated</Badge>;
      case ProposalStatus.EXECUTED:
        return <Badge className="bg-blue-500">Executed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Card className="p-6 hover-elevate" data-testid={`card-proposal-${id}`}>
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold mb-2">{title}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{timeLeft} left</span>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-chart-1 font-medium">For: {forPercentage.toFixed(1)}%</span>
              <span className="text-muted-foreground">{forVotes.toLocaleString()} votes</span>
            </div>
            <Progress value={forPercentage} className="h-2" />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="text-destructive font-medium">Against: {againstPercentage.toFixed(1)}%</span>
              <span className="text-muted-foreground">{againstVotes.toLocaleString()} votes</span>
            </div>
            <Progress value={againstPercentage} className="h-2 bg-muted [&>div]:bg-destructive" />
          </div>

          <div className="flex justify-between text-sm pt-2">
            <span className="text-muted-foreground">Quorum: {quorum}%</span>
            <span className="text-muted-foreground">{totalVotes.toLocaleString()} total votes</span>
          </div>
        </div>

        {status === ProposalStatus.ACTIVE && (
          <div className="flex gap-3 pt-2">
            <Button className="flex-1" data-testid="button-vote-for">
              <CheckCircle className="h-4 w-4 mr-2" />
              Vote For
            </Button>
            <Button variant="outline" className="flex-1" data-testid="button-vote-against">
              <XCircle className="h-4 w-4 mr-2" />
              Vote Against
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
