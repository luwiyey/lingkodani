import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { createAuditEntry } from "@/lib/services/audit-service";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import type { PreferredWorkspace, User } from "@/lib/types";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeWorkspace(value: unknown, role: User["role"], fallback: PreferredWorkspace) {
  if (role === "developer") {
    return "detailed" as const;
  }

  return value === "detailed" ? "detailed" : fallback;
}

export async function PATCH(request: Request) {
  const auth = await authenticateServerRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const db = getServerFirestore();
    const userRef = db.collection(firebaseCollections.users).doc(auth.userId);
    const existingSnapshot = await userRef.get();

    if (!existingSnapshot.exists) {
      return NextResponse.json(
        { error: "Hindi makita ang live user profile para sa account na ito." },
        { status: 404 }
      );
    }

    const existingProfile = {
      id: existingSnapshot.id,
      ...(existingSnapshot.data() as User),
    };

    const nextEmail = normalizeEmail(body.email) || existingProfile.email;
    const nextProfile: User = {
      ...existingProfile,
      email: nextEmail,
      name: normalizeText(body.name) || existingProfile.name,
      title: normalizeText(body.title) || existingProfile.title,
      barangay: normalizeText(body.barangay) || existingProfile.barangay,
      phone: normalizeText(body.phone) || existingProfile.phone,
      avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : existingProfile.avatarUrl,
      preferredWorkspace: normalizeWorkspace(
        body.preferredWorkspace,
        existingProfile.role,
        existingProfile.preferredWorkspace ?? (existingProfile.role === "developer" ? "detailed" : "simple")
      ),
      updatedAt: new Date().toISOString(),
    };

    await userRef.set(nextProfile, { merge: true });

    const auditLog = createAuditEntry({
      id: `AUD${Date.now()}-${auth.userId}`,
      user: auth.profile.name ?? auth.email,
      action: "UPDATE_OWN_PROFILE",
      details: `${nextProfile.name} updated account profile and workspace preferences.`,
      timestamp: nextProfile.updatedAt,
    });
    await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);

    return NextResponse.json({
      updated: true,
      profile: nextProfile,
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi na-save ang live account profile." },
      { status: 500 }
    );
  }
}
