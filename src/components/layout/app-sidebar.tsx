
"use client";

import Link from "next/link";
import Image from "next/image";
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
  History,
  ChevronRight,
  ShieldAlert,
  ClipboardList,
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
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { NavItem } from "@/lib/types";
import { useData } from "@/context/data-context";
import { useAuth } from "@/context/auth-context";
import { getPreferredDashboardRoute, getPreferredWorkspace } from "@/lib/user-workspace";

function NavMenu({ items }: { items: NavItem[] }) {
    const pathname = usePathname();
    const { farmers } = useData();
    const { state, isMobile, setOpenMobile } = useSidebar();
    const isCollapsed = state === 'collapsed';
    const pendingApprovalsCount = farmers.filter(f => f.status === 'pending_approval').length;

    const handleLinkClick = () => {
        if (isMobile) {
            setOpenMobile(false);
        }
    };

    const isParentActive = (item: NavItem) => {
        if (pathname === item.href) return true;
        if (item.subItems) {
            return item.subItems.some(sub => pathname.startsWith(sub.href));
        }
        return false;
    }


    return (
        <SidebarMenu>
            {items.map((item) => {
                const effectiveLabel = item.title === "Magsasaka" && pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : item.label;

                return (
                 <SidebarMenuItem key={item.title}>
                  {item.subItems ? (
                    isCollapsed ? (
                       <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                            <SidebarMenuButton
                                isActive={isParentActive(item)}
                                tooltip={{ children: item.title, side: "right" }}
                                className="w-full justify-center"
                            >
                                <item.icon />
                            </SidebarMenuButton>
                         </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start" className="w-48">
                            <DropdownMenuLabel>{item.title}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                             {item.subItems.map((subItem) => {
                                const subItemLabel = subItem.href === '/dashboard/farmers/approvals' && pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : subItem.label;
                                return (
                                    <Link key={subItem.title} href={subItem.href} passHref>
                                        <DropdownMenuItem onClick={handleLinkClick} className="flex justify-between cursor-pointer">
                                            <span>{subItem.title}</span>
                                            {subItemLabel && (
                                                <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                                                    {subItemLabel}
                                                </span>
                                            )}
                                        </DropdownMenuItem>
                                    </Link>
                                )
                            })}
                          </DropdownMenuContent>
                       </DropdownMenu>
                    ) : (
                        <Collapsible defaultOpen={isParentActive(item)}>
                        <CollapsibleTrigger asChild>
                            <SidebarMenuButton
                                isActive={isParentActive(item)}
                                className="w-full justify-start group"
                            >
                                <item.icon />
                                <div className="flex flex-1 min-w-0 items-center group-data-[collapsible=icon]:hidden">
                                <span className="truncate">{item.title}</span>
                                <ChevronRight className="ml-2 h-4 w-4 shrink-0 transition-transform group-data-[state=open]:rotate-90" />
                                {effectiveLabel && (
                                    <span className="ml-2 inline-flex items-center justify-center rounded-full bg-primary px-2 py-1 text-[10px] font-semibold leading-none text-primary-foreground">
                                    {effectiveLabel}
                                    </span>
                                )}
                                </div>
                            </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="group-data-[collapsible=icon]:hidden">
                            <SidebarMenuSub>
                            {item.subItems.map((subItem) => {
                                const subItemLabel = subItem.href === '/dashboard/farmers/approvals' && pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : subItem.label;
                                return (
                                    <SidebarMenuSubItem key={subItem.title}>
                                    <Link href={subItem.href} onClick={handleLinkClick}>
                                        <SidebarMenuSubButton isActive={pathname === subItem.href}>
                                        <span>{subItem.title}</span>
                                        {subItemLabel && (
                                            <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary px-2 py-1 text-[10px] font-semibold leading-none text-primary-foreground">
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
                    )
                  ) : (
                    <Link href={item.href} passHref>
                      <SidebarMenuButton
                        onClick={handleLinkClick}
                        isActive={isParentActive(item)}
                        tooltip={{ children: item.title, side: "right" }}
                      >
                        <item.icon />
                        <div className="flex flex-1 min-w-0 items-center group-data-[collapsible=icon]:hidden">
                          <span className="truncate">{item.title}</span>
                          {effectiveLabel && (
                            <span className="ml-auto inline-flex items-center justify-center rounded-full bg-primary px-2 py-1 text-[10px] font-semibold leading-none text-primary-foreground">
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
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { currentUserProfile } = useAuth();
  const homeHref = getPreferredDashboardRoute(currentUserProfile);
  const activeWorkspace = getPreferredWorkspace(currentUserProfile);
  
  const detailedBarangayNavItems: NavItem[] = [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Operations Center", href: "/dashboard/operations", icon: ClipboardList },
      { title: "SMS Feed", href: "/dashboard/sms-feed", icon: MessageSquare },
      {
        title: "Panganib at Alerto",
        href: "/dashboard/active-issues",
        icon: ShieldAlert,
        subItems: [
          { title: "Mga Aktibong Isyu", href: "/dashboard/active-issues" },
          { title: "Pamamahala ng Alerto", href: "/dashboard/alerts" },
        ],
      },
      {
        title: "Magsasaka",
        href: "/dashboard/farmers",
        icon: Users,
        subItems: [
          { title: "Pagpaparehistro", href: "/dashboard/farmers/register" },
          { title: "Pag-apruba", href: "/dashboard/farmers/approvals" },
          { title: "Database", href: "/dashboard/farmers" },
          { title: "Follow-up Queue", href: "/dashboard/follow-up" },
          { title: "Aktibong Sakahan", href: "/dashboard/active-farms" },
          { title: "Pangkalahatang-ideya", href: "/dashboard/oversight" },
        ],
      },
      {
        title: "Rekurso",
        href: "/dashboard/inventory",
        icon: Archive,
        subItems: [
          { title: "Imbentaryo", href: "/dashboard/inventory" },
          { title: "Mga Voucher", href: "/dashboard/vouchers" },
          { title: "Price Watch", href: "/dashboard/price-watch" },
        ],
      },
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

  const simpleBarangayNavItems: NavItem[] = [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { title: "Operations Center", href: "/dashboard/operations", icon: ClipboardList },
      {
        title: "Magsasaka",
        href: "/dashboard/farmers",
        icon: Users,
        subItems: [
          { title: "Follow-up Queue", href: "/dashboard/follow-up" },
          { title: "Pag-apruba", href: "/dashboard/farmers/approvals" },
          { title: "Database", href: "/dashboard/farmers" },
        ],
      },
      {
        title: "Panganib at Alerto",
        href: "/dashboard/active-issues",
        icon: ShieldAlert,
        subItems: [
          { title: "Mga Aktibong Isyu", href: "/dashboard/active-issues" },
          { title: "Pamamahala ng Alerto", href: "/dashboard/alerts" },
        ],
      },
      {
        title: "Rekurso",
        href: "/dashboard/inventory",
        icon: Archive,
        subItems: [
          { title: "Imbentaryo", href: "/dashboard/inventory" },
          { title: "Mga Voucher", href: "/dashboard/vouchers" },
          { title: "Price Watch", href: "/dashboard/price-watch" },
        ],
      },
      { title: "Mga Setting ng Brgy.", href: "/dashboard/settings", icon: Settings },
    ];

  const barangayNavItems = currentUserProfile?.role === 'barangay' && activeWorkspace === 'simple'
    ? simpleBarangayNavItems
    : detailedBarangayNavItems;

  return (
    <Sidebar collapsible="icon">
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        {!isCollapsed && (
          <Link href={homeHref} className="flex items-center gap-3 rounded-xl transition-colors hover:bg-sidebar-accent/70">
              <Image src="/logo.png" width={36} height={36} alt="Lingkod-Ani Logo" style={{ height: 'auto' }} />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold tracking-tight text-sidebar-foreground">Lingkod-Ani</p>
                <p className="truncate text-[11px] text-muted-foreground">Kaagapay ng Magsasaka</p>
              </div>
          </Link>
        )}
      </div>
      <SidebarContent className="flex flex-1 flex-col pt-3">
        <div className="flex-1">
            <SidebarGroupLabel>Menu ng Barangay</SidebarGroupLabel>
            <NavMenu items={barangayNavItems} />
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
