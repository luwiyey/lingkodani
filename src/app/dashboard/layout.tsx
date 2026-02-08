'use client';

import { usePathname } from "next/navigation";
import Link from "next/link";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { MobileFooter } from "@/components/layout/mobile-footer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isDisasterPath = pathname.startsWith('/dashboard/disaster');
  const isDeveloperPage = pathname === '/dashboard/developer';

  if (isDeveloperPage) {
    return (
      <div className="p-6 md:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-md">
                    <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Developer Panel</h1>
                    <p className="text-muted-foreground">User Access Management</p>
                </div>
            </div>
            <HoverTooltip text="Bumalik sa Pag-login">
                <Button asChild variant="outline">
                    <Link href="/">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Mag-logout
                    </Link>
                </Button>
            </HoverTooltip>
        </div>
        {children}
      </div>
    );
  }

  return (
    <SidebarProvider>
      {!isDisasterPath && <AppSidebar />}
      <SidebarInset>
        <Header />
        <div className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          {children}
        </div>
        <footer className="hidden p-6 pt-0 text-center text-xs text-muted-foreground md:block">
          <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link> | <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
        </footer>
        {!isDisasterPath && <MobileFooter />}
      </SidebarInset>
    </SidebarProvider>
  );
}
