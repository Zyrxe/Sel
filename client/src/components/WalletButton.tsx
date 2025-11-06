import { useWeb3Modal } from "@web3modal/wagmi/react";
import { Button } from "@/components/ui/button";
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink } from "lucide-react";
import { useWeb3 } from "@/hooks/useWeb3";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { SupportedChainId } from "@shared/schema";

export function WalletButton() {
  const { open } = useWeb3Modal();
  const { address, isConnected, chainId, bnbBalance, disconnect, isSupportedChain } = useWeb3();
  const { toast } = useToast();

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const copyAddress = async () => {
    if (address) {
      await navigator.clipboard.writeText(address);
      toast({
        title: "Address copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  const getChainName = () => {
    if (chainId === SupportedChainId.BSC_MAINNET) return "BSC Mainnet";
    if (chainId === SupportedChainId.BSC_TESTNET) return "BSC Testnet";
    return "Unsupported Chain";
  };

  const viewOnExplorer = () => {
    if (!address) return;
    const baseUrl = chainId === SupportedChainId.BSC_MAINNET
      ? "https://bscscan.com/address/"
      : "https://testnet.bscscan.com/address/";
    window.open(baseUrl + address, "_blank");
  };

  if (!isConnected) {
    return (
      <Button
        onClick={() => open()}
        className="gap-2"
        data-testid="button-connect-wallet"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 min-w-[180px]"
          data-testid="button-wallet-menu"
        >
          <div className="flex items-center gap-2 flex-1">
            <div className="flex flex-col items-start">
              <span className="text-sm font-medium">{formatAddress(address!)}</span>
              <span className="text-xs text-muted-foreground">
                {parseFloat(bnbBalance).toFixed(4)} BNB
              </span>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <div className="flex items-center justify-between">
            <span>Connected Wallet</span>
            <Badge variant={isSupportedChain ? "default" : "destructive"} className="text-xs">
              {getChainName()}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={copyAddress} data-testid="menu-item-copy-address">
          <Copy className="h-4 w-4 mr-2" />
          Copy Address
        </DropdownMenuItem>
        <DropdownMenuItem onClick={viewOnExplorer} data-testid="menu-item-view-explorer">
          <ExternalLink className="h-4 w-4 mr-2" />
          View on Explorer
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => disconnect()}
          className="text-destructive focus:text-destructive"
          data-testid="menu-item-disconnect"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Disconnect
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
