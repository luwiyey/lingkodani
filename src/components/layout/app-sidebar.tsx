
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
  Landmark,
  ShieldAlert,
  Calculator,
  FileCheck,
  DollarSign,
  ScrollText,
  GraduationCap
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarSeparator,
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

const municipalNavItems: NavItem[] = [
    { title: "Panel ng Pagsubaybay", href: "/dashboard/municipal/oversight", icon: Landmark, role: 'municipal'},
    { title: "Desk ng Insidente", href: "/dashboard/municipal/incidents", icon: ShieldAlert, role: 'municipal'},
    { title: "Awtoridad sa Presyo", href: "/dashboard/municipal/prices", icon: DollarSign, role: 'municipal'},
    { title: "Rekurso at Voucher", href: "/dashboard/municipal/vouchers", icon: ScrollText, role: 'municipal'},
    { title: "Pagsasanay sa AEW", href: "/dashboard/municipal/training", icon: GraduationCap, role: 'municipal'},
]

export function AppSidebar() {
  const pathname = usePathname();

  // Sa isang tunay na app, ang role ay magmumula sa session ng user
  const userRole = 'barangay'; 

  return (
    <Sidebar>
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

        <SidebarSeparator />
        
        <SidebarMenu>
            <SidebarGroupLabel>Munisipyo</SidebarGroupLabel>
             {municipalNavItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <Link href={item.href} passHref>
                <SidebarMenuButton
                  isActive={pathname.startsWith(item.href)}
                  tooltip={{ children: item.title, side: "right" }}
                   disabled={userRole !== 'municipal'}
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

    