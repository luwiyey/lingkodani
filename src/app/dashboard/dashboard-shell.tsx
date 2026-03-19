"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { LiveAutomationRunner } from "@/components/layout/live-automation-runner";
import { MobileFooter } from "@/components/layout/mobile-footer";
import { useAuth } from "@/context/auth-context";
import { isLiveMode } from "@/lib/config/app-mode";
import { getPreferredDashboardRoute } from "@/lib/user-workspace";

const developerAllowedPrefixes = [
  "/dashboard/developer",
  "/dashboard/data-center",
  "/dashboard/account",
];

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { authLoading, currentUserProfile } = useAuth();
  const isDisasterPath = pathname.startsWith("/dashboard/disaster");
  const isDeveloperPage = pathname.startsWith("/dashboard/developer");
  const isDeveloperRestrictedPage = developerAllowedPrefixes.some((prefix) => pathname.startsWith(prefix));
  const shouldRedirectDeveloperHome =
    pathname === "/dashboard" && currentUserProfile?.role === "developer";

  useEffect(() => {
    if (
      isLiveMode &&
      !authLoading &&
      isDeveloperPage &&
      currentUserProfile?.role !== "developer"
    ) {
      router.replace(getPreferredDashboardRoute(currentUserProfile));
    }
  }, [authLoading, currentUserProfile, isDeveloperPage, router]);

  useEffect(() => {
    if (
      isLiveMode &&
      !authLoading &&
      currentUserProfile?.role === "developer" &&
      pathname !== "/dashboard" &&
      !isDeveloperRestrictedPage
    ) {
      router.replace("/dashboard/developer");
    }
  }, [authLoading, currentUserProfile, isDeveloperRestrictedPage, pathname, router]);

  useEffect(() => {
    if (!authLoading && shouldRedirectDeveloperHome) {
      router.replace("/dashboard/developer");
    }
  }, [authLoading, router, shouldRedirectDeveloperHome]);

  if (isLiveMode && authLoading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Sinusuri ang session...</div>;
  }

  if (!authLoading && shouldRedirectDeveloperHome) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Binubuksan ang developer dashboard...
      </div>
    );
  }

  return (
    <SidebarProvider>
      {!isDisasterPath && <AppSidebar />}
      <SidebarInset>
        <LiveAutomationRunner />
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
