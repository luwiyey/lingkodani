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
  LayoutGrid,
  GraduationCap,
  Leaf,
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

const barangayNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Live SMS", href: "/dashboard/sms-feed", icon: MessageSquare },
  {
    title: "Magsasaka",
    href: "/dashboard/farmers",
    icon: Users,
    subItems: [
      { title: "Pagpaparehistro", href: "/dashboard/farmers/register" },
      { title: "Pag-apruba", href: "/dashboard/farmers/approvals", label: '3' },
      { title: "Database", href: "/dashboard/farmers" },
      { title: "Pangkalahatang-ideya", href: "/dashboard/oversight" },
    ],
  },
  { title: "Imbentaryo", href: "/dashboard/inventory", icon: Archive },
  {
    title: "Kaalaman",
    href: "/dashboard/knowledge-base",
    icon: Book,
    subItems: [
      { title: "Base ng Kaalaman", href: "/dashboard/knowledge-base" },
      { title: "AI Toolkit", href: "/dashboard/ai-toolkit" },
      { title: "Pagsasanay ng AEW", href: "/dashboard/training" },
    ],
  },
  { title: "Mga Ulat", href: "/dashboard/reports", icon: BarChart },
  { title: "Audit Log", href: "/dashboard/audit-log", icon: History },
  { title: "Mga Setting ng Brgy.", href: "/dashboard/settings", icon: Settings },
];

function NavMenu({ items }: { items: NavItem[] }) {
    const pathname = usePathname();
    const isParentActive = (item: NavItem) => {
        if (item.subItems) {
            // Updated logic to ensure parent is active even for href that is also a subitem href
            const isActive = item.subItems.some(sub => pathname.startsWith(sub.href));
            if (item.href === '/dashboard/farmers' && pathname === '/dashboard/farmers') {
                return true;
            }
            return isActive;
        }
        return item.href === '/dashboard' ? pathname === item.href : pathname.startsWith(item.href);
    }


    return (
        <SidebarMenu>
            {items.map((item) => (
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
    )
}

export function AppSidebar() {
  return (
    <Sidebar collapsible="icon">
       <div className="flex h-20 items-center justify-center p-2 group-data-[state=expanded]:px-4">
          <Link href="/dashboard" className="flex w-full items-center gap-2">
            <div className="bg-sidebar-primary rounded-lg p-2 text-sidebar-primary-foreground shrink-0">
              <Leaf className="h-5 w-5" />
            </div>
            <div className="flex flex-col overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-lg text-sidebar-foreground truncate">
                Lingkod-Ani
              </span>
            </div>
          </Link>
        </div>
      <SidebarContent className="pt-0 flex-1 flex-col">
        <div>
            <SidebarGroupLabel>Menu ng Barangay</SidebarGroupLabel>
            <NavMenu items={barangayNavItems} />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
