
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  BarChart,
  Book,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  Replace,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
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
  { title: "Labor Exchange", href: "/dashboard/labor-exchange", icon: Replace },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent className="pt-4">
        <SidebarMenu>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)}
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
