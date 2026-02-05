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
  SidebarGroupLabel,
} from "@/components/ui/sidebar";
import type { NavItem } from "@/lib/types";

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Live SMS", href: "/dashboard/sms-feed", icon: MessageSquare },
  { title: "Database ng Magsasaka", href: "/dashboard/farmers", icon: Users },
  { title: "Pagpaparehistro", href: "/dashboard/farmers/register", icon: UserPlus },
  { title: "Pag-apruba", href: "/dashboard/farmers/approvals", icon: UserCheck, label: '3' },
  { title: "Imbentaryo", href: "/dashboard/inventory", icon: Archive },
  { title: "Base ng Kaalaman", href: "/dashboard/knowledge-base", icon: Book },
  { title: "AI Toolkit", href: "/dashboard/calculators", icon: Sparkles },
  { title: "Mga Ulat", href: "/dashboard/reports", icon: BarChart },
  { title: "Audit Log", href: "/dashboard/audit-log", icon: History },
  { title: "Mga Setting ng Brgy.", href: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4 flex-1 flex flex-col">
        <SidebarMenu className="flex-1">
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href)}
                  tooltip={{ children: item.title, side: "right" }}
                >
                  <item.icon />
                  <div className="flex flex-1 min-w-0 items-center group-data-[collapsible=icon]:hidden">
                    <span className="truncate">{item.title}</span>
                    {item.label && (
                      <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                        {item.label}
                      </span>
                    )}
                  </div>
                </SidebarMenuButton>
              </Link>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
