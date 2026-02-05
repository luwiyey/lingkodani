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
  Handshake,
  Calculator,
  FileCheck,
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
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, role: 'barangay' },
  { title: "SMS Command Monitor", href: "/dashboard/sms-feed", icon: MessageSquare, role: 'barangay' },
  { title: "Pamamahala ng Magsasaka", href: "/dashboard/farmers", icon: Users, role: 'barangay' },
  { title: "Bayanihan Hub", href: "/dashboard/bayanihan", icon: Handshake, role: 'barangay' },
  { title: "Imbentaryo", href: "/dashboard/inventory", icon: Archive, role: 'barangay' },
  { title: "Base ng Kaalaman", href: "/dashboard/knowledge-base", icon: Book, role: 'barangay' },
  { title: "Mga Calculator", href: "/dashboard/calculators", icon: Calculator, role: 'barangay' },
  { title: "Mga Ulat", href: "/dashboard/reports", icon: BarChart, role: 'barangay' },
  { title: "Log ng Pagsusuri", href: "/dashboard/audit-log", icon: FileCheck, role: 'barangay' },
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
