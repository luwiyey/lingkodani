import type { UserRole } from "@/lib/types";
import { withResolvedUserPermissions } from "@/lib/user-permissions";

import { authenticateServerRequest } from "@/lib/server/request-auth";
import { readServerSessionProfile } from "@/lib/server/session-auth";

export async function authenticateInteractiveRequest(
  request: Request,
  allowedRoles?: UserRole[]
) {
  const session = await readServerSessionProfile();

  if (session) {
    const profile = withResolvedUserPermissions(session.profile);

    if (allowedRoles && !allowedRoles.includes(profile.role)) {
      return {
        ok: false as const,
        status: 403,
        error: "This account does not have enough permissions.",
      };
    }

    return {
      ok: true as const,
      source: "session" as const,
      profile,
      email: session.email,
      userId: session.userId,
    };
  }

  const tokenAuth = await authenticateServerRequest(request, allowedRoles);

  if (!tokenAuth.ok) {
    return tokenAuth;
  }

  return {
    ...tokenAuth,
    source: "bearer" as const,
  };
}
