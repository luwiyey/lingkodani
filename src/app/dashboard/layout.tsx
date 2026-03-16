'use client';

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";
import { HoverTooltip } from "@/components/ui/hover-tooltip";
import { MobileFooter } from "@/components/layout/mobile-footer";
import { useAuth } from "@/context/auth-context";
import { isLiveMode } from "@/lib/config/app-mode";
import { getPreferredDashboardRoute } from "@/lib/user-workspace";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { authLoading, currentUser, currentUserProfile, signOutUser } = useAuth();
  const isDisasterPath = pathname.startsWith('/dashboard/disaster');
  const isDeveloperPage = pathname.startsWith('/dashboard/developer');

  useEffect(() => {
    if (isLiveMode && !authLoading && !currentUser && !currentUserProfile) {
      router.replace("/");
    }
  }, [authLoading, currentUser, currentUserProfile, router]);

  useEffect(() => {
    if (
      isLiveMode &&
      !authLoading &&
      isDeveloperPage &&
      currentUserProfile?.role !== 'developer'
    ) {
      router.replace(getPreferredDashboardRoute(currentUserProfile));
    }
  }, [authLoading, currentUserProfile, isDeveloperPage, router]);

  if (isLiveMode && authLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Sinusuri ang session...</div>;
  }

  if (isDeveloperPage) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="rounded-xl bg-primary/10 p-3">
                    <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-[28px] font-semibold tracking-tight">Developer Panel</h1>
                    <p className="text-muted-foreground">User Access Management</p>
                </div>
            </div>
            <HoverTooltip text="Bumalik sa Pag-login">
                <Button variant="outline" onClick={async () => { await signOutUser(); router.replace("/"); }}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Mag-logout
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
        <div className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:p-8 md:pb-8">
          {children}
        </div>
        <footer className="hidden px-8 pb-8 pt-0 text-center text-xs text-muted-foreground md:block">
          <span>Lingkod-Ani v1.0</span> | <span>Barangay Agricultural Advisory System</span> | <Link href="/terms-of-service" className="hover:underline">Terms of Service</Link> | <Link href="/privacy-policy" className="hover:underline">Privacy Policy</Link>
        </footer>
        {!isDisasterPath && <MobileFooter />}
      </SidebarInset>
    </SidebarProvider>
  );
}
