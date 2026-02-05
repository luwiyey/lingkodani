
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
  { title: "Feed ng SMS", href: "/dashboard/sms-feed", icon: MessageSquare },
  { title: "Talaan ng Magsasaka", href: "/dashboard/farmers", icon: Users },
  { title: "Mga Ulat at Analitika", href: "/dashboard/reports", icon: BarChart },
  { title: "Base ng Kaalaman", href: "/dashboard/knowledge-base", icon: Book },
  { title: "Imbentaryo", href: "/dashboard/inventory", icon: Archive },
  { title: "Palitan ng Trabaho", href: "/dashboard/labor-exchange", icon: Replace },
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
                  tooltip={{ children: "Mga Setting", side: "right" }}
                >
                  <Settings />
                  <span>Mga Setting</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
