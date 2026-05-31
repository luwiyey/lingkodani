import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { sanitizeFirestoreDocument } from "@/lib/firebase/sanitize-firestore";
import { getServerFirestore } from "@/lib/firebase/server";
import { isUserOnboardingComplete, syncUserOnboardingState } from "@/lib/onboarding-checklist";
import { createAuditEntry } from "@/lib/services/audit-service";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import type { PreferredWorkspace, User } from "@/lib/types";
import { withResolvedUserPermissions } from "@/lib/user-permissions";

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

  if (value === "simple" || value === "detailed") {
    return value;
  }

  return fallback;
}

export async function PATCH(request: Request) {
  const auth = await authenticateServerRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const timestamp = new Date().toISOString();

    if (body.securityReviewVerifiedAt) {
      const stepUpAuth = await authenticateServerRequest(request, ["barangay", "developer"], {
        requireRecentLogin: true,
      });

      if (!stepUpAuth.ok) {
        return NextResponse.json(
          { error: stepUpAuth.error, code: "code" in stepUpAuth ? stepUpAuth.code : undefined },
          { status: stepUpAuth.status }
        );
      }
    }

    const db = getServerFirestore();
    const userRef = db.collection(firebaseCollections.users).doc(auth.userId);
    const existingSnapshot = await userRef.get();

    if (!existingSnapshot.exists) {
      return NextResponse.json(
        { error: "Hindi makita ang live user profile para sa account na ito." },
        { status: 404 }
      );
    }

    const existingProfile = withResolvedUserPermissions({
      id: existingSnapshot.id,
      ...(existingSnapshot.data() as User),
    });

    const nextEmail = normalizeEmail(body.email) || existingProfile.email;
    const nextPhone = normalizeText(body.phone);
    const phoneChanged =
      nextPhone.length > 0 &&
      nextPhone !== (existingProfile.phone ?? "");
    const nextProfileBase = withResolvedUserPermissions<User>({
      ...existingProfile,
      email: nextEmail,
      name: normalizeText(body.name) || existingProfile.name,
      title: normalizeText(body.title) || existingProfile.title,
      barangay: normalizeText(body.barangay) || existingProfile.barangay,
      phone: nextPhone || existingProfile.phone,
      avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl : existingProfile.avatarUrl,
      phoneVerifiedAt: body.phoneVerifiedAt ? timestamp : phoneChanged ? "" : existingProfile.phoneVerifiedAt,
      privacyAcknowledgedAt: body.privacyAcknowledgedAt ? timestamp : existingProfile.privacyAcknowledgedAt,
      securityReviewVerifiedAt: body.securityReviewVerifiedAt ? timestamp : existingProfile.securityReviewVerifiedAt,
      preferredWorkspace: normalizeWorkspace(
        body.preferredWorkspace,
        existingProfile.role,
        existingProfile.preferredWorkspace ?? (existingProfile.role === "developer" ? "detailed" : "simple")
      ),
      updatedAt: timestamp,
    });
    const nextProfile = sanitizeFirestoreDocument(syncUserOnboardingState(
      nextProfileBase,
      auth.profile.name ?? auth.email,
      timestamp
    ));

    if (body.phoneVerifiedAt && !nextProfile.phone?.trim()) {
      return NextResponse.json(
        { error: "Maglagay muna ng mobile number bago ito markahang confirmed." },
        { status: 400 }
      );
    }

    if (body.completeOnboarding && !isUserOnboardingComplete(nextProfile)) {
      return NextResponse.json(
        { error: "Kumpletuhin muna ang lahat ng onboarding checklist items bago i-activate ang account." },
        { status: 400 }
      );
    }

    await userRef.set(nextProfile, { merge: true });

    const auditLog = createAuditEntry({
      id: `AUD${Date.now()}-${auth.userId}`,
      user: auth.profile.name ?? auth.email,
      action: "UPDATE_OWN_PROFILE",
      details: `${nextProfile.name} updated account profile and workspace preferences.`,
      timestamp,
    });
    await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);

    return NextResponse.json({
      updated: true,
      profile: nextProfile,
    });
  } catch (error) {
    console.error("Failed to save live account profile", error);
    return NextResponse.json(
      { error: "Hindi na-save ang live account profile." },
      { status: 500 }
    );
  }
}
