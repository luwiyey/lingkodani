import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerAuth, getServerFirestore } from "@/lib/firebase/server";
import type { User, UserRole } from "@/lib/types";
import { withResolvedUserPermissions } from "@/lib/user-permissions";

const DEFAULT_SENSITIVE_ACTION_MAX_AGE_SECONDS = 15 * 60;

type AuthenticateServerRequestOptions = {
  requireRecentLogin?: boolean;
  maxAgeSeconds?: number;
};

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

export async function authenticateServerRequest(
  request: Request,
  allowedRoles?: UserRole[],
  options?: AuthenticateServerRequestOptions
) {
  const token = getBearerToken(request);

  if (!token) {
    return { ok: false as const, status: 401, error: "Missing authentication token." };
  }

  try {
    const decoded = await getServerAuth().verifyIdToken(token);
    const email = decoded.email?.trim().toLowerCase();
    const userId = decoded.uid;

    if (!userId || !email) {
      return { ok: false as const, status: 401, error: "Authenticated user identity is incomplete." };
    }

    const profileSnapshot = await getServerFirestore()
      .collection(firebaseCollections.users)
      .doc(userId)
      .get();

    if (!profileSnapshot.exists) {
      return { ok: false as const, status: 403, error: "No authorized user profile exists for this account." };
    }

    const profile = withResolvedUserPermissions({
      id: profileSnapshot.id,
      ...(profileSnapshot.data() as User),
    });

    if (profile.status === "disabled") {
      return { ok: false as const, status: 403, error: "This account is disabled." };
    }

    if (allowedRoles && !allowedRoles.includes(profile.role)) {
      return { ok: false as const, status: 403, error: "This account does not have enough permissions." };
    }

    if (options?.requireRecentLogin) {
      const authTime = typeof decoded.auth_time === "number" ? decoded.auth_time : 0;
      const maxAgeSeconds = options.maxAgeSeconds ?? DEFAULT_SENSITIVE_ACTION_MAX_AGE_SECONDS;
      const ageSeconds = Math.floor(Date.now() / 1000) - authTime;

      if (!authTime || ageSeconds > maxAgeSeconds) {
        return {
          ok: false as const,
          status: 428,
          code: "step_up_required",
          error: "Kailangan munang i-verify muli ang password bago ituloy ang sensitibong aksyon na ito.",
        };
      }
    }

    return {
      ok: true as const,
      token,
      decoded,
      profile,
      email,
      userId,
    };
  } catch {
    return { ok: false as const, status: 401, error: "Invalid authentication token." };
  }
}
