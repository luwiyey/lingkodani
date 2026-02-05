
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import {
  Archive,
  BarChart,
  Book,
  LayoutDashboard,
  MessageSquare,
  Settings,
  Users,
  Sparkles,
  History,
  ChevronRight,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { NavItem } from "@/lib/types";

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Live SMS", href: "/dashboard/sms-feed", icon: MessageSquare },
  {
    title: "Magsasaka",
    href: "/dashboard/farmers",
    icon: Users,
    subItems: [
      { title: "Database", href: "/dashboard/farmers" },
      { title: "Pagpaparehistro", href: "/dashboard/farmers/register" },
      { title: "Pag-apruba", href: "/dashboard/farmers/approvals", label: '3' },
    ],
  },
  { title: "Imbentaryo", href: "/dashboard/inventory", icon: Archive },
  { title: "Base ng Kaalaman", href: "/dashboard/knowledge-base", icon: Book },
  { title: "AI Toolkit & Pagsasanay", href: "/dashboard/ai-toolkit", icon: Sparkles },
  { title: "Mga Ulat", href: "/dashboard/reports", icon: BarChart },
  { title: "Audit Log", href: "/dashboard/audit-log", icon: History },
  { title: "Mga Setting ng Brgy.", href: "/dashboard/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();

  const isParentActive = (item: NavItem) => {
    if (item.subItems) {
      return item.subItems.some(sub => pathname.startsWith(sub.href));
    }
    return item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarContent className="pt-4 flex-1 flex flex-col">
        <SidebarMenu className="flex-1">
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          {navItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              {item.subItems ? (
                <Collapsible defaultOpen={isParentActive(item)}>
                  <CollapsibleTrigger asChild>
                     <SidebarMenuButton
                        isActive={isParentActive(item)}
                        tooltip={{ children: item.title, side: "right" }}
                        className="w-full justify-start group"
                      >
                        <item.icon />
                        <div className="flex flex-1 min-w-0 items-center group-data-[collapsible=icon]:hidden">
                          <span className="truncate">{item.title}</span>
                          <ChevronRight className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                        </div>
                      </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                    <SidebarMenuSub>
                      {item.subItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <Link href={subItem.href}>
                            <SidebarMenuSubButton isActive={pathname === subItem.href}>
                              <span>{subItem.title}</span>
                              {subItem.label && (
                                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                                  {subItem.label}
                                </span>
                              )}
                            </SidebarMenuSubButton>
                          </Link>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              ) : (
                <Link href={item.href} passHref>
                  <SidebarMenuButton
                    isActive={isParentActive(item)}
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
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
    </Sidebar>
  );
}
