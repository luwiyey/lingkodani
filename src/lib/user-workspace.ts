import type { PreferredWorkspace, User } from "@/lib/types";

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
  if (user?.role === "developer") {
    return "/dashboard/developer";
  }

  return getPreferredWorkspace(user) === "detailed"
    ? "/dashboard/sms-feed"
    : "/dashboard/operations";
}
