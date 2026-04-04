"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Header } from "@/components/layout/header";
import { LiveAutomationRunner } from "@/components/layout/live-automation-runner";
import { MobileFooter } from "@/components/layout/mobile-footer";
import { useAuth } from "@/context/auth-context";
import { useData } from "@/context/data-context";
import { isLiveMode } from "@/lib/config/app-mode";
import { buildLegalPageHref } from "@/lib/legal-links";
import { getPreferredDashboardRoute } from "@/lib/user-workspace";

const developerAllowedPrefixes = [
  "/dashboard/developer",
  "/dashboard/data-center",
  "/dashboard/account",
  "/dashboard/settings",
  "/dashboard/system-status",
];

export function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { authLoading, currentUserProfile } = useAuth();
  const { offlineMode, offlineOutboxCount, offlineSyncing, syncOfflineChanges } = useData();
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
        {isLiveMode && (offlineMode || offlineOutboxCount > 0) ? (
          <div className="border-b bg-amber-50/80 px-4 py-3 text-sm text-amber-950 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-1">
                <p className="font-medium">
                  {offlineMode ? "Low-signal mode" : "May naghihintay na live sync"}
                </p>
                <p className="text-amber-900/80">
                  {offlineMode
                    ? "Patuloy kang makakapag-record ng updates. Isi-sync ng system ang mga ito kapag bumalik ang signal."
                    : "Na-save muna locally ang ilang update at handa nang i-sync sa live database."}
                  {offlineOutboxCount > 0 ? ` Pending items: ${offlineOutboxCount}.` : ""}
                </p>
              </div>
              <Button
                variant="outline"
                className="border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
                onClick={() => void syncOfflineChanges()}
                disabled={offlineSyncing || offlineOutboxCount === 0}
              >
                {offlineSyncing ? "Nagsi-sync..." : "I-sync ang pending changes"}
              </Button>
            </div>
          </div>
        ) : null}
        <div className="flex-1 overflow-y-auto p-4 pb-24 sm:p-6 lg:p-8 md:pb-8">
          {children}
        </div>
        <footer className="hidden px-8 pb-8 pt-0 text-center text-xs text-muted-foreground md:block">
          <span>Lingkod-Ani v1.0</span> | <span>Barangay Agricultural Advisory System</span> | <Link href={buildLegalPageHref("/terms-of-service", "dashboard")} className="hover:underline">Terms of Service</Link> | <Link href={buildLegalPageHref("/privacy-policy", "dashboard")} className="hover:underline">Privacy Policy</Link>
        </footer>
        {!isDisasterPath && <MobileFooter />}
      </SidebarInset>
    </SidebarProvider>
  );
}
