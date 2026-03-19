import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerAuth, getServerFirestore } from "@/lib/firebase/server";
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
  const idToken = getBearerToken(request);

  if (!idToken) {
    return NextResponse.json({ error: "Missing authentication token." }, { status: 401 });
  }

  try {
    const adminAuth = getServerAuth();
    const decoded = await adminAuth.verifyIdToken(idToken);
    const email = decoded.email?.trim().toLowerCase();
    const userId = decoded.uid;

    if (!userId || !email) {
      return NextResponse.json(
        { error: "Authenticated user identity is incomplete." },
        { status: 401 }
      );
    }

    const profileSnapshot = await getServerFirestore()
      .collection(firebaseCollections.users)
      .doc(userId)
      .get();

    if (!profileSnapshot.exists) {
      return NextResponse.json(
        { error: "No authorized user profile exists for this account." },
        { status: 403 }
      );
    }

    const profile = profileSnapshot.data() as User;

    if (profile.status === "disabled") {
      return NextResponse.json(
        { error: "This account is disabled." },
        { status: 403 }
      );
    }

    const expiresIn = getSessionDurationMs();
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const response = NextResponse.json({ ok: true });
    buildSessionCookieHeaders(response, sessionCookie, Math.floor(expiresIn / 1000));
    return response;
  } catch {
    return NextResponse.json({ error: "Invalid authentication token." }, { status: 401 });
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
