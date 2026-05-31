import {
  canAccessBarangaySettingsWorkspace,
  canAccessDataCenter,
} from "@/lib/access-control";
import {
  hasServerDemoPreviewAccess,
  readServerDemoPreviewProfile,
  readServerSessionProfile,
} from "@/lib/server/session-auth";
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
  const demoPreviewProfile = hasDemoPreviewAccess ? await readServerDemoPreviewProfile() : null;

  if (!session) {
    if (demoPreviewProfile) {
      if (kind === "developer") {
        return demoPreviewProfile.role === "developer"
          ? { allowed: true }
          : { allowed: false, redirectTo: getPreferredDashboardRoute(demoPreviewProfile) };
      }

      if (kind === "dataCenter") {
        return demoPreviewProfile.role === "developer"
          ? { allowed: true }
          : { allowed: false, redirectTo: getPreferredDashboardRoute(demoPreviewProfile) };
      }

      if (kind === "settings") {
        return demoPreviewProfile.role === "developer" || demoPreviewProfile.role === "barangay"
          ? { allowed: true }
          : { allowed: false, redirectTo: getPreferredDashboardRoute(demoPreviewProfile) };
      }
    }

    if (hasDemoPreviewAccess && kind === "settings") {
      return { allowed: true };
    }

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

  return canAccessBarangaySettingsWorkspace(session.profile)
    ? { allowed: true }
    : { allowed: false, redirectTo: getPreferredDashboardRoute(session.profile) };
}
