
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart,
  Book,
  Bot,
  Flame,
  LayoutDashboard,
  Leaf,
  MessageSquare,
  Settings,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/lib/types";

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "SMS Mission Feed", href: "/dashboard/sms-feed", icon: MessageSquare },
  { title: "Farmer Registry", href: "/dashboard/farmers", icon: Users },
  { title: "Reports & Analytics", href: "/dashboard/reports", icon: BarChart },
  { title: "Knowledge Base", href: "/dashboard/knowledge-base", icon: Book },
  { title: "Inventory", href: "/dashboard/inventory", icon: Archive },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-1.5 text-primary-foreground">
                <Leaf className="w-5 h-5" />
            </div>
            <span className="text-lg font-semibold text-primary">Lingkod-Ani</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  tooltip={{ children: item.title, side: "right" }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
             <Link href="/dashboard/settings" passHref>
                <SidebarMenuButton
                  isActive={pathname === "/dashboard/settings"}
                  tooltip={{ children: "Settings", side: "right" }}
                >
                  <Settings />
                  <span>Settings</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
