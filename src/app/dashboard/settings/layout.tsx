import { redirect } from "next/navigation";

import { resolveDashboardRouteAccess } from "@/lib/server/dashboard-route-access";

export default async function DashboardSettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await resolveDashboardRouteAccess("settings");

  if (!access.allowed) {
    redirect(access.redirectTo);
  }

  return children;
}
