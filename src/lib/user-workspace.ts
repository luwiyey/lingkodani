import type { PreferredWorkspace, User } from "@/lib/types";
import { shouldForceUserOnboarding } from "@/lib/onboarding-checklist";

export function getPreferredWorkspace(user?: Pick<User, "role" | "preferredWorkspace"> | null): PreferredWorkspace {
  if (user?.role === "developer") {
    return "detailed";
  }

  if (!user) {
    return "simple";
  }

  return user.preferredWorkspace ?? "simple";
}

export function getPreferredDashboardRoute(user?: Pick<User, "role" | "preferredWorkspace"> | null) {
  if (user && shouldForceUserOnboarding(user as User)) {
    return "/dashboard/account?onboarding=1";
  }

  if (user?.role === "developer") {
    return "/dashboard/developer";
  }

  return getPreferredWorkspace(user) === "detailed"
    ? "/dashboard/sms-feed"
    : "/dashboard/operations";
}
