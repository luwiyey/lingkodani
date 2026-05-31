import { authenticateServerRequest as authenticateRequest } from "@/lib/server/request-auth";

export async function authenticateServerRequest(request: Request) {
  const auth = await authenticateRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return null;
  }

  return {
    uid: auth.userId,
    email: auth.email,
    role: auth.profile.role,
    profile: auth.profile,
    token: auth.token,
  };
}
