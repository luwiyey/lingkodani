import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerAuth, getServerFirestore } from "@/lib/firebase/server";
import { createAuditEntry } from "@/lib/services/audit-service";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import type { User, UserRole } from "@/lib/types";

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
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
}): User {
  const timestamp = new Date().toISOString();
  return {
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
    createdAt: input.existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

export async function POST(request: Request) {
  const auth = await authenticateServerRequest(request, ["developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const title = typeof body.title === "string" ? body.title.trim() : "";
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const role = body.role === "developer" ? "developer" : "barangay";
    const status = body.status === "disabled" ? "disabled" : body.status === "pending_setup" ? "pending_setup" : "active";
    const preferredWorkspace = body.preferredWorkspace === "detailed" ? "detailed" : "simple";

    if (!email || !name || !title || !phone) {
      return NextResponse.json(
        { error: "Kinakailangan ang pangalan, email, tungkulin, at mobile number." },
        { status: 400 }
      );
    }

    const db = getServerFirestore();
    const adminAuth = getServerAuth();
    let firebaseUser = null;
    let temporaryPassword: string | undefined;

    try {
      firebaseUser = await adminAuth.getUserByEmail(email);
    } catch (error: unknown) {
      const code = typeof error === "object" && error && "code" in error ? String((error as { code?: string }).code) : "";
      if (code !== "auth/user-not-found") {
        throw error;
      }
    }

    if (!firebaseUser) {
      temporaryPassword = `Lingkod!${randomBytes(4).toString("hex")}`;
      firebaseUser = await adminAuth.createUser({
        email,
        password: temporaryPassword,
        displayName: name,
      });
    }

    const userRef = db.collection(firebaseCollections.users).doc(firebaseUser.uid);
    const existingProfile = await userRef.get();

    if (existingProfile.exists) {
      return NextResponse.json(
        { error: "May user profile na para sa account na ito." },
        { status: 409 }
      );
    }

    const profile = buildUserProfile({
      email,
      name,
      role,
      uid: firebaseUser.uid,
      title,
      phone,
      status,
      preferredWorkspace,
    });

    await userRef.set(profile);
    const auditLog = createAuditEntry({
      id: `AUD${Date.now()}-${firebaseUser.uid}`,
      user: auth.profile.name ?? auth.email,
      action: "CREATE_USER_ACCESS",
      details: `${profile.name} (${profile.email}) - ${profile.role}, ${profile.status}, ${profile.preferredWorkspace}`,
    });
    await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);

    return NextResponse.json({
      created: true,
      profile,
      temporaryPassword,
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi nagawa ang live user provisioning." },
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
