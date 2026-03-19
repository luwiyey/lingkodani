import { redirect } from "next/navigation";

import { isLiveMode } from "@/lib/config/app-mode";
import { hasServerDemoPreviewAccess, readServerSessionProfile } from "@/lib/server/session-auth";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (isLiveMode) {
    const session = await readServerSessionProfile();
    const hasDemoPreviewAccess = await hasServerDemoPreviewAccess();

    if (!session && !hasDemoPreviewAccess) {
      redirect("/login");
    }
  }

  return (
    <DashboardShell>{children}</DashboardShell>
  );
}
