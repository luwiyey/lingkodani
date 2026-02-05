'use client';

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDisasterPath = pathname.startsWith('/dashboard/disaster');

  return (
    <SidebarProvider>
      {!isDisasterPath && <AppSidebar />}
      <SidebarInset>
        <Header />
        <div className="flex-1 p-6 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
