import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerAuth, getServerFirestore } from "@/lib/firebase/server";
import { buildInviteLifecycleFields, getInviteLifecycleSummary } from "@/lib/invite-lifecycle";
import { isUserOnboardingComplete, syncUserOnboardingState } from "@/lib/onboarding-checklist";
import { createAuditEntry } from "@/lib/services/audit-service";
import {
  sendProvisioningInviteEmail,
  type SendProvisioningInviteResult,
} from "@/lib/server/invite-email";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import {
  recordRuntimeHealthFailure,
  recordRuntimeHealthSuccess,
  recordRuntimeHealthWarning,
} from "@/lib/system-health";
import type { User, UserRole } from "@/lib/types";
import { withResolvedUserPermissions } from "@/lib/user-permissions";

function allowDeveloperProvisioning() {
  return (process.env.ALLOW_DEVELOPER_ACCOUNT_PROVISIONING ?? "false") === "true";
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value: unknown, fallback: UserRole = "barangay"): UserRole {
  if (value === "developer") {
    return "developer";
  }

  return fallback === "developer" ? "developer" : "barangay";
}

function normalizeStatus(value: unknown, fallback: NonNullable<User["status"]> = "active") {
  if (value === "disabled" || value === "pending_setup" || value === "active") {
    return value;
  }

  return fallback;
}

function normalizeWorkspace(
  value: unknown,
  role: UserRole,
  fallback: NonNullable<User["preferredWorkspace"]> = role === "developer" ? "detailed" : "simple"
) {
  if (role === "developer") {
    return "detailed" as const;
  }

  return value === "detailed" ? "detailed" : fallback;
}

function buildUserProfile(input: {
  email: string;
  name: string;
  role: UserRole;
  uid: string;
  title?: string;
  phone?: string;
  status?: User["status"];
  preferredWorkspace?: User["preferredWorkspace"];
  existing?: Partial<User>;
  inviteDeliveryStatus?: User["inviteDeliveryStatus"];
  inviteSentAt?: string;
  inviteDeliveryError?: string;
  inviteDeliveryProvider?: string;
  inviteSetupLinkGeneratedAt?: string;
  inviteExpiresAt?: string;
  inviteAcceptedAt?: string;
  inviteRevokedAt?: string;
  inviteRevokedBy?: string;
  inviteRevocationReason?: string;
  inviteLastResentAt?: string;
  inviteResendCount?: number;
  phoneVerifiedAt?: string;
  privacyAcknowledgedAt?: string;
  securityReviewVerifiedAt?: string;
  onboarding?: User["onboarding"];
}): User {
  const timestamp = new Date().toISOString();
  const hasInviteRevokedAt = "inviteRevokedAt" in input;
  const hasInviteRevokedBy = "inviteRevokedBy" in input;
  const hasInviteRevocationReason = "inviteRevocationReason" in input;
  return syncUserOnboardingState(withResolvedUserPermissions<User>({
    ...input.existing,
    id: input.uid,
    uid: input.uid,
    email: input.email,
    name: input.name,
    role: input.role,
    title: input.title ?? input.existing?.title ?? (input.role === "developer" ? "Platform Developer" : "Barangay Staff"),
    barangay: input.existing?.barangay ?? "Batakil",
    phone: input.phone ?? input.existing?.phone,
    status: input.status ?? input.existing?.status ?? "pending_setup",
    preferredWorkspace: input.preferredWorkspace ?? input.existing?.preferredWorkspace ?? (input.role === "developer" ? "detailed" : "simple"),
    inviteDeliveryStatus: input.inviteDeliveryStatus ?? input.existing?.inviteDeliveryStatus,
    inviteSentAt: input.inviteSentAt ?? input.existing?.inviteSentAt,
    inviteDeliveryError: input.inviteDeliveryError ?? input.existing?.inviteDeliveryError,
    inviteDeliveryProvider: input.inviteDeliveryProvider ?? input.existing?.inviteDeliveryProvider,
    inviteSetupLinkGeneratedAt: input.inviteSetupLinkGeneratedAt ?? input.existing?.inviteSetupLinkGeneratedAt,
    inviteExpiresAt: input.inviteExpiresAt ?? input.existing?.inviteExpiresAt,
    inviteAcceptedAt: input.inviteAcceptedAt ?? input.existing?.inviteAcceptedAt,
    inviteRevokedAt: hasInviteRevokedAt ? input.inviteRevokedAt : input.existing?.inviteRevokedAt,
    inviteRevokedBy: hasInviteRevokedBy ? input.inviteRevokedBy : input.existing?.inviteRevokedBy,
    inviteRevocationReason: hasInviteRevocationReason ? input.inviteRevocationReason : input.existing?.inviteRevocationReason,
    inviteLastResentAt: input.inviteLastResentAt ?? input.existing?.inviteLastResentAt,
    inviteResendCount: input.inviteResendCount ?? input.existing?.inviteResendCount,
    phoneVerifiedAt: input.phoneVerifiedAt ?? input.existing?.phoneVerifiedAt,
    privacyAcknowledgedAt: input.privacyAcknowledgedAt ?? input.existing?.privacyAcknowledgedAt,
    securityReviewVerifiedAt: input.securityReviewVerifiedAt ?? input.existing?.securityReviewVerifiedAt,
    onboarding: input.onboarding ?? input.existing?.onboarding,
    createdAt: input.existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  }), input.name, timestamp);
}

function resolveRequestOrigin(request: Request) {
  const url = new URL(request.url);
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto");

  if (forwardedHost) {
    const protocol = forwardedProto?.trim() || url.protocol.replace(":", "");
    return `${protocol}://${forwardedHost.trim()}`;
  }

  return url.origin;
}

function buildProvisioningContinueUrl(request: Request, email: string) {
  return `${resolveRequestOrigin(request)}/reset-password/verify?email=${encodeURIComponent(email)}`;
}

async function buildProvisioningSetupLink(input: {
  request: Request;
  email: string;
}) {
  const adminAuth = getServerAuth();

  return adminAuth.generatePasswordResetLink(input.email, {
    url: buildProvisioningContinueUrl(input.request, input.email),
  });
}

function summarizeInviteDelivery(result: SendProvisioningInviteResult) {
  if (!result.configured) {
    return {
      inviteDeliveryStatus: "manual_link" as const,
      inviteDeliveryProvider: "manual",
      inviteDeliveryError: result.error,
      includeSetupLinkInResponse: true,
    };
  }

  if (result.sent) {
    return {
      inviteDeliveryStatus: "emailed" as const,
      inviteDeliveryProvider: result.provider,
      inviteDeliveryError: undefined,
      includeSetupLinkInResponse: false,
    };
  }

  return {
    inviteDeliveryStatus: "email_failed" as const,
    inviteDeliveryProvider: result.provider,
    inviteDeliveryError: result.error,
    includeSetupLinkInResponse: true,
  };
}

function buildAuthFailureResponse(
  auth:
    | Awaited<ReturnType<typeof authenticateServerRequest>>
    | Awaited<ReturnType<typeof authenticateServerRequest>>
) {
  return NextResponse.json(
    {
      error: auth.error,
      code: "code" in auth ? auth.code : undefined,
    },
    { status: auth.status }
  );
}

async function logInviteRuntimeHealth(input: {
  email: string;
  inviteResult: SendProvisioningInviteResult;
  inviteSummary: ReturnType<typeof summarizeInviteDelivery>;
}) {
  try {
    if (!input.inviteResult.configured) {
      await recordRuntimeHealthWarning("invite_email", "Invite Email", {
        provider: input.inviteSummary.inviteDeliveryProvider,
        email: input.email,
        reason: input.inviteResult.error,
      });
    } else if (input.inviteResult.sent) {
      await recordRuntimeHealthSuccess("invite_email", "Invite Email", {
        provider: input.inviteResult.provider,
        email: input.email,
        messageId: input.inviteResult.messageId,
      });
    } else {
      await recordRuntimeHealthFailure(
        "invite_email",
        "Invite Email",
        input.inviteResult.error ?? "Hindi naipadala ang invite email.",
        {
          provider: input.inviteResult.provider,
          email: input.email,
        }
      );
    }
  } catch (error) {
    console.error("Invite email runtime health logging failed.", error);
  }
}

async function createAndDeliverSetupLink(input: {
  request: Request;
  email: string;
  name: string;
  existing?: Partial<User>;
}) {
  const setupLink = await buildProvisioningSetupLink({
    request: input.request,
    email: input.email,
  });
  const inviteResult = await sendProvisioningInviteEmail({
    email: input.email,
    name: input.name,
    setupLink,
  });
  const inviteSummary = summarizeInviteDelivery(inviteResult);
  const inviteTimestamp = new Date().toISOString();

  await logInviteRuntimeHealth({
    email: input.email,
    inviteResult,
    inviteSummary,
  });

  return {
    setupLink,
    inviteResult,
    inviteSummary,
    inviteTimestamp,
    lifecycleFields: buildInviteLifecycleFields(input.existing, inviteTimestamp),
  };
}

async function markMatchingAccessRequestsProvisioned(input: {
  email: string;
  actorName: string;
}) {
  const db = getServerFirestore();
  const snapshot = await db
    .collection(firebaseCollections.accessRequests)
    .where("email", "==", input.email)
    .get();

  const pendingRequests = snapshot.docs.filter((item) => {
    const request = item.data() as { status?: string };
    return request.status === "pending_review" || request.status === "reviewed";
  });

  await Promise.all(
    pendingRequests.map((item) =>
      item.ref.set(
        {
          status: "provisioned",
          reviewedAt: new Date().toISOString(),
          reviewedBy: input.actorName,
          reviewNotes: "Awtomatikong minarkahang provisioned matapos malikha ang live account.",
        },
        { merge: true }
      )
    )
  );
}

export async function POST(request: Request) {
  const auth = await authenticateServerRequest(request, ["developer"], {
    requireRecentLogin: true,
  });

  if (!auth.ok) {
    return buildAuthFailureResponse(auth);
  }

  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const name = normalizeText(body.name);
    const title = normalizeText(body.title);
    const phone = normalizeText(body.phone);
    const requestedRole = normalizeRole(body.role);
    const role = allowDeveloperProvisioning() ? requestedRole : "barangay";
    const requestedStatus = normalizeStatus(body.status, "pending_setup");
    const status: NonNullable<User["status"]> = requestedStatus === "active" ? "pending_setup" : requestedStatus;
    const preferredWorkspace = normalizeWorkspace(body.preferredWorkspace, role);

    if (!email || !name || !title || !phone) {
      return NextResponse.json(
        { error: "Kinakailangan ang pangalan, email, tungkulin, at mobile number." },
        { status: 400 }
      );
    }

    if (requestedRole === "developer" && !allowDeveloperProvisioning()) {
      return NextResponse.json(
        { error: "Ang developer accounts ay hindi pinoprovision mula sa dashboard na ito." },
        { status: 400 }
      );
    }

    const db = getServerFirestore();
    const adminAuth = getServerAuth();
    let firebaseUser = null;
    let createdFirebaseUser = false;

    try {
      firebaseUser = await adminAuth.getUserByEmail(email);
    } catch (error: unknown) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
      if (code !== "auth/user-not-found") {
        throw error;
      }
    }

    if (!firebaseUser) {
      firebaseUser = await adminAuth.createUser({
        email,
        displayName: name,
      });
      createdFirebaseUser = true;
    }

    const userRef = db.collection(firebaseCollections.users).doc(firebaseUser.uid);
    const existingProfile = await userRef.get();

    if (existingProfile.exists) {
      return NextResponse.json(
        { error: "May user profile na para sa account na ito." },
        { status: 409 }
      );
    }

    try {
      const delivery = await createAndDeliverSetupLink({
        request,
        email,
        name,
      });
      const profile = buildUserProfile({
        email,
        name,
        role,
        uid: firebaseUser.uid,
        title,
        phone,
        status,
        preferredWorkspace,
        inviteDeliveryStatus: delivery.inviteSummary.inviteDeliveryStatus,
        inviteSentAt: delivery.inviteTimestamp,
        inviteDeliveryError: delivery.inviteSummary.inviteDeliveryError,
        inviteDeliveryProvider: delivery.inviteSummary.inviteDeliveryProvider,
        inviteSetupLinkGeneratedAt: delivery.inviteTimestamp,
        inviteExpiresAt: delivery.lifecycleFields.inviteExpiresAt,
        inviteLastResentAt: delivery.lifecycleFields.inviteLastResentAt,
        inviteResendCount: delivery.lifecycleFields.inviteResendCount,
      });

      await userRef.set(profile);

      await markMatchingAccessRequestsProvisioned({
        email,
        actorName: auth.profile.name ?? auth.email,
      });
      const auditLog = createAuditEntry({
        id: `AUD${Date.now()}-${firebaseUser.uid}`,
        user: auth.profile.name ?? auth.email,
        action: "CREATE_USER_ACCESS",
        details: `${profile.name} (${profile.email}) - ${profile.role}, ${profile.status}, ${profile.preferredWorkspace}, invite:${profile.inviteDeliveryStatus ?? "manual_link"}`,
      });
      await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);

      return NextResponse.json({
        created: true,
        profile,
        provisioningMethod: "password_reset_link",
        inviteDeliveryStatus: delivery.inviteSummary.inviteDeliveryStatus,
        inviteEmailSent: delivery.inviteResult.sent,
        statusAdjusted: requestedStatus === "active",
        setupLink: delivery.inviteSummary.includeSetupLinkInResponse ? delivery.setupLink : "",
      });
    } catch (error) {
      if (createdFirebaseUser) {
        await adminAuth.deleteUser(firebaseUser.uid).catch(() => {
          // Ignore rollback failures and surface the original invite-link error.
        });
      }

      throw error;
    }
  } catch {
    return NextResponse.json(
      { error: "Hindi nagawa ang live user provisioning." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await authenticateServerRequest(request, ["developer"], {
    requireRecentLogin: true,
  });

  if (!auth.ok) {
    return buildAuthFailureResponse(auth);
  }

  try {
    const body = await request.json();
    const userId = normalizeText(body.userId);
    const action = normalizeText(body.action);

    if (!userId) {
      return NextResponse.json(
        { error: "Kinakailangan ang user ID ng ia-update na user." },
        { status: 400 }
      );
    }

    const db = getServerFirestore();
    const adminAuth = getServerAuth();
    const userRef = db.collection(firebaseCollections.users).doc(userId);
    const existingSnapshot = await userRef.get();

    if (!existingSnapshot.exists) {
      return NextResponse.json(
        { error: "Hindi makita ang user profile na ia-update." },
        { status: 404 }
      );
    }

    const existingProfile = existingSnapshot.data() as User;
    const actorName = auth.profile.name ?? auth.email;

    if (existingProfile.role === "developer" && !allowDeveloperProvisioning()) {
      return NextResponse.json(
        { error: "Ang developer accounts ay hindi ini-edit mula sa dashboard na ito." },
        { status: 403 }
      );
    }

    if (action === "revoke_invite") {
      const inviteSummary = getInviteLifecycleSummary(existingProfile);

      if (inviteSummary.status === "accepted") {
        return NextResponse.json(
          { error: "Hindi na puwedeng i-revoke ang invite dahil nagamit na ito ng user." },
          { status: 400 }
        );
      }

      const timestamp = new Date().toISOString();
      const revocationReason =
        normalizeText(body.inviteRevocationReason) ||
        "Pansamantalang naka-hold ang onboarding habang nire-review muli ang access.";
      const nextProfile = buildUserProfile({
        email: existingProfile.email,
        name: existingProfile.name,
        role: existingProfile.role,
        uid: userId,
        title: existingProfile.title,
        phone: existingProfile.phone,
        status: existingProfile.status ?? "pending_setup",
        preferredWorkspace: existingProfile.preferredWorkspace,
        existing: existingProfile,
        inviteRevokedAt: timestamp,
        inviteRevokedBy: actorName,
        inviteRevocationReason: revocationReason,
      });

      await userRef.set(nextProfile, { merge: true });

      const auditLog = createAuditEntry({
        id: `AUD${Date.now()}-${userId}`,
        user: actorName,
        action: "REVOKE_USER_INVITE",
        details: `${nextProfile.email} invite revoked: ${revocationReason}`,
      });
      await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);

      return NextResponse.json({
        updated: true,
        action: "revoke_invite",
        profile: nextProfile,
      });
    }

    if (action === "resend_invite") {
      const delivery = await createAndDeliverSetupLink({
        request,
        email: existingProfile.email,
        name: existingProfile.name,
        existing: existingProfile,
      });
      const nextProfile = buildUserProfile({
        email: existingProfile.email,
        name: existingProfile.name,
        role: existingProfile.role,
        uid: userId,
        title: existingProfile.title,
        phone: existingProfile.phone,
        status: existingProfile.status ?? "pending_setup",
        preferredWorkspace: existingProfile.preferredWorkspace,
        existing: existingProfile,
        inviteDeliveryStatus: delivery.inviteSummary.inviteDeliveryStatus,
        inviteSentAt: delivery.inviteTimestamp,
        inviteDeliveryError: delivery.inviteSummary.inviteDeliveryError,
        inviteDeliveryProvider: delivery.inviteSummary.inviteDeliveryProvider,
        inviteSetupLinkGeneratedAt: delivery.inviteTimestamp,
        inviteExpiresAt: delivery.lifecycleFields.inviteExpiresAt,
        inviteRevokedAt: "",
        inviteRevokedBy: "",
        inviteRevocationReason: "",
        inviteLastResentAt: delivery.lifecycleFields.inviteLastResentAt,
        inviteResendCount: delivery.lifecycleFields.inviteResendCount,
      });

      await userRef.set(nextProfile, { merge: true });

      const auditLog = createAuditEntry({
        id: `AUD${Date.now()}-${userId}`,
        user: actorName,
        action: "RESEND_USER_INVITE",
        details: `${nextProfile.email} invite resent via ${nextProfile.inviteDeliveryStatus ?? "manual_link"}.`,
      });
      await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);

      return NextResponse.json({
        updated: true,
        action: "resend_invite",
        profile: nextProfile,
        inviteDeliveryStatus: delivery.inviteSummary.inviteDeliveryStatus,
        inviteEmailSent: delivery.inviteResult.sent,
        setupLink: delivery.inviteSummary.includeSetupLinkInResponse ? delivery.setupLink : "",
      });
    }

    const nextRole = allowDeveloperProvisioning()
      ? normalizeRole(body.role, existingProfile.role)
      : existingProfile.role;
    const nextEmail = normalizeEmail(body.email) || existingProfile.email;
    const nextName = normalizeText(body.name) || existingProfile.name;
    const nextTitle = normalizeText(body.title) || existingProfile.title || "";
    const nextPhone = normalizeText(body.phone) || existingProfile.phone || "";
    const phoneChanged = nextPhone !== (existingProfile.phone ?? "");
    const nextStatus = normalizeStatus(body.status, existingProfile.status ?? "active");
    const nextWorkspace = normalizeWorkspace(
      body.preferredWorkspace,
      nextRole,
      existingProfile.preferredWorkspace ?? (nextRole === "developer" ? "detailed" : "simple")
    );

    if (!nextEmail || !nextName || !nextTitle || !nextPhone) {
      return NextResponse.json(
        { error: "Kinakailangan ang pangalan, email, tungkulin, at mobile number." },
        { status: 400 }
      );
    }

    if (nextRole !== existingProfile.role && !allowDeveloperProvisioning()) {
      return NextResponse.json(
        { error: "Hindi pinapayagan ang role change mula sa dashboard na ito." },
        { status: 400 }
      );
    }

    if (nextEmail !== existingProfile.email) {
      try {
        const conflictingUser = await adminAuth.getUserByEmail(nextEmail);
        if (conflictingUser.uid !== userId) {
          return NextResponse.json(
            { error: "May ibang account na gumagamit na ng email na ito." },
            { status: 409 }
          );
        }
      } catch (error: unknown) {
        const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
        if (code !== "auth/user-not-found") {
          throw error;
        }
      }
    }

    await adminAuth.updateUser(userId, {
      displayName: nextName,
      ...(nextEmail !== existingProfile.email ? { email: nextEmail } : {}),
    });

    const nextProfile = buildUserProfile({
      email: nextEmail,
      name: nextName,
      role: nextRole,
      uid: userId,
      title: nextTitle,
      phone: nextPhone,
      status: nextStatus,
      preferredWorkspace: nextWorkspace,
      existing: existingProfile,
      phoneVerifiedAt: phoneChanged ? "" : existingProfile.phoneVerifiedAt,
    });

    if (nextStatus === "active" && !isUserOnboardingComplete(nextProfile)) {
      return NextResponse.json(
        { error: "Hindi pa maaaring gawing active ang account hangga't hindi kumpleto ang onboarding checklist ng staff user." },
        { status: 400 }
      );
    }

    await userRef.set(nextProfile, { merge: true });

    const auditLog = createAuditEntry({
      id: `AUD${Date.now()}-${userId}`,
      user: actorName,
      action: "UPDATE_USER_ACCESS",
      details: `${nextProfile.name} (${nextProfile.email}) - ${nextProfile.role}, ${nextProfile.status}, ${nextProfile.preferredWorkspace}`,
    });
    await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);

    return NextResponse.json({
      updated: true,
      profile: nextProfile,
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi na-update ang live user account." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const auth = await authenticateServerRequest(request, ["developer"], {
    requireRecentLogin: true,
  });

  if (!auth.ok) {
    return buildAuthFailureResponse(auth);
  }

  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const userId = typeof body.userId === "string" ? body.userId.trim() : "";

    if (!email && !userId) {
      return NextResponse.json(
        { error: "Kinakailangan ang user ID o email ng user na buburahin." },
        { status: 400 }
      );
    }

    if (userId && userId === auth.userId) {
      return NextResponse.json(
        { error: "Hindi maaaring burahin ang sariling developer account mula sa UI na ito." },
        { status: 400 }
      );
    }

    if (email && email === auth.email) {
      return NextResponse.json(
        { error: "Hindi maaaring burahin ang sariling developer account mula sa UI na ito." },
        { status: 400 }
      );
    }

    const db = getServerFirestore();
    let targetUserId = userId;
    let targetEmail = email;

    if (!targetUserId && targetEmail) {
      const firebaseUser = await getServerAuth().getUserByEmail(targetEmail);
      targetUserId = firebaseUser.uid;
    }

    if (targetUserId) {
      const profileSnapshot = await db.collection(firebaseCollections.users).doc(targetUserId).get();
      if (profileSnapshot.exists) {
        const profile = profileSnapshot.data() as User;
        if (profile.role === "developer" && !allowDeveloperProvisioning()) {
          return NextResponse.json(
            { error: "Ang developer accounts ay hindi binubura mula sa dashboard na ito." },
            { status: 403 }
          );
        }
        targetEmail = profile.email ?? targetEmail;
      }

      await db.collection(firebaseCollections.users).doc(targetUserId).delete();
    }

    try {
      if (targetUserId) {
        await getServerAuth().deleteUser(targetUserId);
      } else if (targetEmail) {
        const firebaseUser = await getServerAuth().getUserByEmail(targetEmail);
        await getServerAuth().deleteUser(firebaseUser.uid);
        targetUserId = firebaseUser.uid;
      }
    } catch (error: unknown) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
      if (code !== "auth/user-not-found") {
        throw error;
      }
    }

    const auditLog = createAuditEntry({
      id: `AUD${Date.now()}-${targetUserId ?? targetEmail ?? "unknown"}`,
      user: auth.profile.name ?? auth.email,
      action: "DELETE_USER_ACCESS",
      details: `${targetEmail ?? targetUserId ?? "unknown user"} tinanggal sa authorized staff list.`,
    });
    await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);

    return NextResponse.json({ deleted: true, email: targetEmail, userId: targetUserId });
  } catch {
    return NextResponse.json(
      { error: "Hindi nabura ang live user account." },
      { status: 500 }
    );
  }
}
