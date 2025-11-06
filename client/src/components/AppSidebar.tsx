import { Home, Coins, Vote, Flame, Menu } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
    testId: "nav-dashboard",
  },
  {
    title: "Staking",
    url: "/staking",
    icon: Coins,
    testId: "nav-staking",
  },
  {
    title: "Governance",
    url: "/governance",
    icon: Vote,
    testId: "nav-governance",
  },
  {
    title: "Buyback",
    url: "/buyback",
    icon: Flame,
    testId: "nav-buyback",
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarHeader className="p-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-primary">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-heading">ALONEA</h2>
            <p className="text-xs text-muted-foreground">ALO Token</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location === item.url}
                    data-testid={item.testId}
                  >
                    <Link href={item.url}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Quick Stats</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-3 py-2 space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ALO Price</span>
                <span className="font-semibold">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Market Cap</span>
                <span className="font-semibold">$0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Staked</span>
                <span className="font-semibold">0%</span>
              </div>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
