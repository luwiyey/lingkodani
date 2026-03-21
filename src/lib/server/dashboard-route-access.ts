import { canAccessDataCenter, canManageBarangaySettings } from "@/lib/access-control";
import { hasServerDemoPreviewAccess, readServerSessionProfile } from "@/lib/server/session-auth";
import { getPreferredDashboardRoute } from "@/lib/user-workspace";

type GuardKind = "developer" | "settings" | "dataCenter";

type GuardResult =
  | { allowed: true }
  | { allowed: false; redirectTo: string };

function resolveUnauthenticatedRedirect(hasDemoPreviewAccess: boolean) {
  return hasDemoPreviewAccess ? "/dashboard" : "/login";
}

export async function resolveDashboardRouteAccess(kind: GuardKind): Promise<GuardResult> {
  const session = await readServerSessionProfile();
  const hasDemoPreviewAccess = await hasServerDemoPreviewAccess();

  if (!session) {
    return {
      allowed: false,
      redirectTo: resolveUnauthenticatedRedirect(hasDemoPreviewAccess),
    };
  }

  if (kind === "developer") {
    return session.profile.role === "developer"
      ? { allowed: true }
      : { allowed: false, redirectTo: getPreferredDashboardRoute(session.profile) };
  }

  if (kind === "dataCenter") {
    return canAccessDataCenter(session.profile)
      ? { allowed: true }
      : { allowed: false, redirectTo: getPreferredDashboardRoute(session.profile) };
  }

  return canManageBarangaySettings(session.profile)
    ? { allowed: true }
    : { allowed: false, redirectTo: getPreferredDashboardRoute(session.profile) };
}
