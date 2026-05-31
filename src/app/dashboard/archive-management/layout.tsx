import { redirect } from "next/navigation";

import { resolveDashboardRouteAccess } from "@/lib/server/dashboard-route-access";

export default async function ArchiveManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const access = await resolveDashboardRouteAccess("developer");

  if (!access.allowed) {
    redirect(access.redirectTo);
  }

  return <>{children}</>;
}
