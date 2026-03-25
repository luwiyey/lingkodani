import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerAuth, getServerFirestore } from "@/lib/firebase/server";
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
}): User {
  const timestamp = new Date().toISOString();
  return withResolvedUserPermissions<User>({
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
    createdAt: input.existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });
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
  const auth = await authenticateServerRequest(request, ["developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const name = normalizeText(body.name);
    const title = normalizeText(body.title);
    const phone = normalizeText(body.phone);
    const requestedRole = normalizeRole(body.role);
    const role = allowDeveloperProvisioning() ? requestedRole : "barangay";
    const status = normalizeStatus(body.status, "pending_setup");
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

    let setupLink = "";

    try {
      setupLink = await buildProvisioningSetupLink({
        request,
        email,
      });
    } catch (error) {
      if (createdFirebaseUser) {
        await adminAuth.deleteUser(firebaseUser.uid).catch(() => {
          // Ignore rollback failures and surface the original invite-link error.
        });
      }

      throw error;
    }

    const inviteResult = await sendProvisioningInviteEmail({
      email,
      name,
      setupLink,
    });
    const inviteSummary = summarizeInviteDelivery(inviteResult);
    const inviteTimestamp = new Date().toISOString();

    const profile = buildUserProfile({
      email,
      name,
      role,
      uid: firebaseUser.uid,
      title,
      phone,
      status,
      preferredWorkspace,
      inviteDeliveryStatus: inviteSummary.inviteDeliveryStatus,
      inviteSentAt: inviteTimestamp,
      inviteDeliveryError: inviteSummary.inviteDeliveryError,
      inviteDeliveryProvider: inviteSummary.inviteDeliveryProvider,
      inviteSetupLinkGeneratedAt: inviteTimestamp,
    });

    await userRef.set(profile);

    try {
      if (!inviteResult.configured) {
        await recordRuntimeHealthWarning("invite_email", "Invite Email", {
          provider: inviteSummary.inviteDeliveryProvider,
          email,
          reason: inviteResult.error,
        });
      } else if (inviteResult.sent) {
        await recordRuntimeHealthSuccess("invite_email", "Invite Email", {
          provider: inviteResult.provider,
          email,
          messageId: inviteResult.messageId,
        });
      } else {
        await recordRuntimeHealthFailure("invite_email", "Invite Email", inviteResult.error ?? "Hindi naipadala ang invite email.", {
          provider: inviteResult.provider,
          email,
        });
      }
    } catch (error) {
      console.error("Invite email runtime health logging failed.", error);
    }

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
      inviteDeliveryStatus: inviteSummary.inviteDeliveryStatus,
      inviteEmailSent: inviteResult.sent,
      setupLink: inviteSummary.includeSetupLinkInResponse ? setupLink : "",
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi nagawa ang live user provisioning." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await authenticateServerRequest(request, ["developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const userId = normalizeText(body.userId);

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

    if (existingProfile.role === "developer" && !allowDeveloperProvisioning()) {
      return NextResponse.json(
        { error: "Ang developer accounts ay hindi ini-edit mula sa dashboard na ito." },
        { status: 403 }
      );
    }

    const nextRole = allowDeveloperProvisioning()
      ? normalizeRole(body.role, existingProfile.role)
      : existingProfile.role;
    const nextEmail = normalizeEmail(body.email) || existingProfile.email;
    const nextName = normalizeText(body.name) || existingProfile.name;
    const nextTitle = normalizeText(body.title) || existingProfile.title || "";
    const nextPhone = normalizeText(body.phone) || existingProfile.phone || "";
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
    });

    await userRef.set(nextProfile, { merge: true });

    const auditLog = createAuditEntry({
      id: `AUD${Date.now()}-${userId}`,
      user: auth.profile.name ?? auth.email,
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
  const auth = await authenticateServerRequest(request, ["developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
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
