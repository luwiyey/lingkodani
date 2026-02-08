
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
  ShieldAlert,
  Sprout,
  Shield,
  Ticket,
  Siren,
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
  useSidebar,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { NavItem } from "@/lib/types";
import { useData } from "@/context/data-context";

function NavMenu({ items }: { items: NavItem[] }) {
    const pathname = usePathname();
    const { farmers } = useData();
    const pendingApprovalsCount = farmers.filter(f => f.status === 'pending_approval').length;

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
            {items.map((item) => {
                const effectiveLabel = item.title === "Magsasaka" && pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : item.label;

                return (
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
                              {effectiveLabel && (
                                <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                                  {effectiveLabel}
                                </span>
                              )}
                              <ChevronRight className="ml-2 h-4 w-4 transition-transform group-data-[state=open]:rotate-90" />
                            </div>
                          </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                        <SidebarMenuSub>
                          {item.subItems.map((subItem) => {
                             const subItemLabel = subItem.href === '/dashboard/farmers/approvals' && pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : subItem.label;
                             return (
                                <SidebarMenuSubItem key={subItem.title}>
                                   <Link href={subItem.href}>
                                    <SidebarMenuSubButton isActive={pathname === subItem.href}>
                                      <span>{subItem.title}</span>
                                      {subItemLabel && (
                                        <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                                          {subItemLabel}
                                        </span>
                                      )}
                                    </SidebarMenuSubButton>
                                  </Link>
                                </SidebarMenuSubItem>
                             )
                          })}
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
                          {effectiveLabel && (
                            <span className="ml-auto inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-primary-foreground bg-primary rounded-full">
                              {effectiveLabel}
                            </span>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </Link>
                  )}
                </SidebarMenuItem>
                )
            })}
        </SidebarMenu>
    )
}

export function AppSidebar() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  
  const barangayNavItems: NavItem[] = [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Live SMS", href: "/dashboard/sms-feed", icon: MessageSquare },
      { title: "Pamamahala ng Alerto", href: "/dashboard/alerts", icon: Siren },
      { title: "Mga Aktibong Isyu", href: "/dashboard/active-issues", icon: ShieldAlert },
      {
        title: "Magsasaka",
        href: "/dashboard/farmers",
        icon: Users,
        subItems: [
          { title: "Pagpaparehistro", href: "/dashboard/farmers/register" },
          { title: "Pag-apruba", href: "/dashboard/farmers/approvals" },
          { title: "Database", href: "/dashboard/farmers" },
          { title: "Aktibong Sakahan", href: "/dashboard/active-farms" },
          { title: "Pangkalahatang-ideya", href: "/dashboard/oversight" },
        ],
      },
      { title: "Imbentaryo", href: "/dashboard/inventory", icon: Archive },
      { title: "Mga Voucher", href: "/dashboard/vouchers", icon: Ticket },
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

  return (
    <Sidebar collapsible="icon">
      <div className="flex h-20 items-center px-4">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
              <div className="bg-sidebar-primary rounded-lg p-2 text-sidebar-primary-foreground">
                  <Leaf className="h-5 w-5" />
              </div>
              <span className="font-semibold text-lg text-sidebar-foreground truncate">
                  Lingkod-Ani
              </span>
          </Link>
        )}
      </div>
      <SidebarContent className="pt-0 flex-1 flex flex-col">
        <div className="flex-1">
            <SidebarGroupLabel>Menu ng Barangay</SidebarGroupLabel>
            <NavMenu items={barangayNavItems} />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
