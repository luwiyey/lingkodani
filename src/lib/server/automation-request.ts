import { authenticateServerRequest } from "@/lib/server/request-auth";
import type { UserRole } from "@/lib/types";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

export async function authenticateAutomationRequest(
  request: Request,
  allowedRoles: UserRole[] = ["barangay", "developer"]
) {
  const token = getBearerToken(request);

  if (!token) {
    return { ok: false as const, status: 401, error: "Missing authentication token." };
  }

  const expectedToken = process.env.SYSTEM_AUTOMATION_TOKEN ?? process.env.CRON_SECRET;

  if (expectedToken && token === expectedToken) {
    return {
      ok: true as const,
      actorName: "system",
      authType: "system" as const,
    };
  }

  const auth = await authenticateServerRequest(request, allowedRoles);

  if (!auth.ok) {
    return auth;
  }

  return {
    ok: true as const,
    actorName: auth.profile.name ?? auth.email,
    authType: "user" as const,
    profile: auth.profile,
    userId: auth.userId,
    email: auth.email,
  };
}
