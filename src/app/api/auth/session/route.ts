import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerAuth, getServerFirestore } from "@/lib/firebase/server";
import {
  applyRateLimitHeaders,
  checkRequestRateLimit,
  createRateLimitResponse,
} from "@/lib/server/request-security";
import { getSessionDurationMs, SESSION_COOKIE_NAME } from "@/lib/server/session-auth";
import type { User } from "@/lib/types";

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization") ?? "";
  return authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length).trim()
    : "";
}

function buildSessionCookieHeaders(response: NextResponse, value: string, maxAgeSeconds: number) {
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: maxAgeSeconds,
  });
}

export async function POST(request: Request) {
  const rateLimit = checkRequestRateLimit(request, {
    key: "auth-session-post",
    maxRequests: 12,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return createRateLimitResponse(
      rateLimit,
      "Masyadong maraming login/session attempts mula sa network na ito. Maghintay muna bago sumubok muli."
    );
  }

  const idToken = getBearerToken(request);

  if (!idToken) {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Missing authentication token." }, { status: 401 }),
      rateLimit
    );
  }

  try {
    const adminAuth = getServerAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email?.trim().toLowerCase();
    const userId = decoded.uid;

    if (!userId || !email) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "Authenticated user identity is incomplete." },
          { status: 401 }
        ),
        rateLimit
      );
    }

    const profileSnapshot = await getServerFirestore()
      .collection(firebaseCollections.users)
      .doc(userId)
      .get();

    if (!profileSnapshot.exists) {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "No authorized user profile exists for this account." },
          { status: 403 }
        ),
        rateLimit
      );
    }

    const profile = profileSnapshot.data() as User;

    if (profile.status === "disabled") {
      return applyRateLimitHeaders(
        NextResponse.json(
          { error: "This account is disabled." },
          { status: 403 }
        ),
        rateLimit
      );
    }

    const expiresIn = getSessionDurationMs();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const response = NextResponse.json({ ok: true });
    buildSessionCookieHeaders(response, sessionCookie, Math.floor(expiresIn / 1000));
    return applyRateLimitHeaders(response, rateLimit);
  } catch {
    return applyRateLimitHeaders(
      NextResponse.json({ error: "Invalid authentication token." }, { status: 401 }),
      rateLimit
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ cleared: true });
  response.cookies.set({
    name: SESSION_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
