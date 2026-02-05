
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
  Sparkles,
  UserPlus,
  UserCheck,
  History,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/lib/types";

const barangayNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Live SMS", href: "/dashboard/sms-feed", icon: MessageSquare },
  { title: "Database ng Magsasaka", href: "/dashboard/farmers", icon: Users },
  { title: "Pagpaparehistro", href: "/dashboard/farmers/register", icon: UserPlus },
  { title: "Pag-apruba", href: "/dashboard/farmers/approvals", icon: UserCheck, label: '3' },
  { title: "Imbentaryo", href: "/dashboard/inventory", icon: Archive },
  { title: "Base ng Kaalaman", href: "/dashboard/knowledge-base", icon: Book },
  { title: "AI Toolkit", href: "/dashboard/calculators", icon: Sparkles },
  { title: "Mga Ulat", href: "/dashboard/reports", icon: BarChart },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4">
        <SidebarMenu>
          <SidebarGroupLabel>Barangay</SidebarGroupLabel>
          {barangayNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)}
                  tooltip={{ children: item.title, side: "right" }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                   {item.label && (
                    <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                      {item.label}
                    </span>
                  )}
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
           <SidebarMenuItem>
             <Link href="/dashboard/audit-log" passHref>
                <SidebarMenuButton
                  isActive={pathname === "/dashboard/audit-log"}
                  tooltip={{ children: "Audit Log", side: "right" }}
                >
                  <History />
                  <span>Audit Log</span>
                </SidebarMenuButton>
              </Link>
          </SidebarMenuItem>
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
