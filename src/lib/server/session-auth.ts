import { cookies } from "next/headers";

import { DEMO_PREVIEW_ACCESS_COOKIE_NAME } from "@/lib/demo-preview-access";
import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerAuth, getServerFirestore } from "@/lib/firebase/server";
import type { User } from "@/lib/types";

export const SESSION_COOKIE_NAME = "lingkod_ani_session";
const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5;

export function getSessionDurationMs() {
  return SESSION_DURATION_MS;
}

export type ServerSessionProfile = {
  userId: string;
  email: string;
  profile: User;
};

export async function readServerSessionProfile(): Promise<ServerSessionProfile | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return null;
  }

  try {
    const decoded = await getServerAuth().verifySessionCookie(sessionCookie, true);
    const email = decoded.email?.trim().toLowerCase();
    const userId = decoded.uid;

    if (!userId || !email) {
      return null;
    }

    const snapshot = await getServerFirestore()
      .collection(firebaseCollections.users)
      .doc(userId)
      .get();

    if (!snapshot.exists) {
      return null;
    }

    const profile = {
      id: snapshot.id,
      ...(snapshot.data() as User),
    };

    if (profile.status === "disabled") {
      return null;
    }

    return {
      userId,
      email,
      profile,
    };
  } catch {
    return null;
  }
}

export async function hasServerDemoPreviewAccess() {
  const cookieStore = await cookies();
  return cookieStore.get(DEMO_PREVIEW_ACCESS_COOKIE_NAME)?.value === "1";
}
