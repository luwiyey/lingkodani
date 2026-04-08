import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerAuth, getServerFirestore } from "@/lib/firebase/server";
import { createAuditEntry } from "@/lib/services/audit-service";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import {
  applyRateLimitHeaders,
  checkRequestRateLimit,
  createRateLimitResponse,
} from "@/lib/server/request-security";
import type { AccessRequest, AccessRequestStatus, User } from "@/lib/types";

function compactUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

function normalizeEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePhone(value: unknown) {
  return typeof value === "string" ? value.replace(/\D/g, "") : "";
}

function normalizeSource(value: unknown): AccessRequest["source"] {
  if (value === "login" || value === "reset_password" || value === "public_page") {
    return value;
  }

  return "public_page";
}

function normalizeStatus(value: unknown): AccessRequestStatus {
  if (
    value === "pending_review" ||
    value === "reviewed" ||
    value === "provisioned" ||
    value === "dismissed"
  ) {
    return value;
  }

  return "pending_review";
}

async function findProvisionedUser(email: string) {
  const db = getServerFirestore();
  const userSnapshot = await db
    .collection(firebaseCollections.users)
    .where("email", "==", email)
    .limit(5)
    .get();

  if (userSnapshot.docs.length > 0) {
    return userSnapshot.docs[0].data() as User;
  }

  try {
    await getServerAuth().getUserByEmail(email);
    return { email } as User;
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error
      ? String((error as { code?: string }).code ?? "")
      : "";

    if (code === "auth/user-not-found") {
      return null;
    }

    throw error;
  }
}

async function findMatchingAccessRequests(email: string, normalizedPhone: string) {
  const db = getServerFirestore();
  const snapshot = await db.collection(firebaseCollections.accessRequests).get();

  return snapshot.docs
    .map((item) => item.data() as AccessRequest)
    .filter((request) => {
      const requestPhone = normalizePhone(request.phone ?? request.normalizedPhone ?? "");
      return request.email === email || (normalizedPhone && requestPhone === normalizedPhone);
    })
    .sort((left, right) => {
      const rightTimestamp = new Date(right.lastSubmittedAt ?? right.requestedAt).getTime();
      const leftTimestamp = new Date(left.lastSubmittedAt ?? left.requestedAt).getTime();
      return rightTimestamp - leftTimestamp;
    });
}

export async function POST(request: Request) {
  const rateLimit = checkRequestRateLimit(request, {
    key: "access-request-post",
    maxRequests: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.allowed) {
    return createRateLimitResponse(
      rateLimit,
      "Masyadong maraming access request mula sa network na ito. Subukan muli pagkalipas ng ilang minuto."
    );
  }

  try {
    const body = await request.json();
    const email = normalizeEmail(body.email);
    const name = normalizeText(body.name);
    const phone = normalizeText(body.phone);
    const normalizedPhone = normalizePhone(body.phone);
    const barangay = normalizeText(body.barangay);
    const title = normalizeText(body.title);
    const message = normalizeText(body.message);
    const source = normalizeSource(body.source);

    if (!email || !name) {
      return NextResponse.json(
        { error: "Kinakailangan ang pangalan at email address." },
        { status: 400 }
      );
    }

    const existingUser = await findProvisionedUser(email);

    if (existingUser) {
      return applyRateLimitHeaders(
        NextResponse.json(
        {
          error: "May naka-set up nang account para sa email na ito. Subukan ang login o reset password kung nakalimutan mo ang password.",
          code: "already_provisioned",
        },
        { status: 409 }
        ),
        rateLimit
      );
    }

    const matchingRequests = await findMatchingAccessRequests(email, normalizedPhone);
    const latestRequest = matchingRequests[0] ?? null;

    if (latestRequest && ["pending_review", "reviewed"].includes(latestRequest.status)) {
      const db = getServerFirestore();
      const timestamp = new Date().toISOString();
      const existingSources = Array.isArray(latestRequest.submissionSources)
        ? latestRequest.submissionSources
        : latestRequest.source
          ? [latestRequest.source]
          : [];
      const mergedSources = Array.from(
        new Set([...existingSources, source].filter((item): item is NonNullable<AccessRequest["source"]> => Boolean(item)))
      );
      const nextRequest: AccessRequest = {
        ...latestRequest,
        name: name || latestRequest.name,
        phone: phone || latestRequest.phone,
        normalizedPhone: normalizedPhone || latestRequest.normalizedPhone,
        barangay: barangay || latestRequest.barangay,
        title: title || latestRequest.title,
        message: message || latestRequest.message,
        lastSubmittedAt: timestamp,
        submissionCount: (latestRequest.submissionCount ?? 1) + 1,
        submissionSources: mergedSources,
      };

      await db.collection(firebaseCollections.accessRequests).doc(nextRequest.id).set(compactUndefined(nextRequest), {
        merge: true,
      });

      const auditLog = createAuditEntry({
        id: `AUD${Date.now()}-${nextRequest.id}`,
        user: "public-access-request",
        action: "MERGE_ACCESS_REQUEST",
        details: `${nextRequest.name} (${nextRequest.email}) muling nagsumite ng access request at in-merge sa existing queue item.`,
      });
      await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);

      return applyRateLimitHeaders(
        NextResponse.json({
          submitted: true,
          duplicatePending: true,
          merged: true,
          request: nextRequest,
        }),
        rateLimit
      );
    }

    const db = getServerFirestore();
    const timestamp = new Date().toISOString();
    const nextRequest: AccessRequest = {
      id: `ACCESS-${randomUUID().slice(0, 8).toUpperCase()}`,
      email,
      name,
      phone: phone || undefined,
      normalizedPhone: normalizedPhone || undefined,
      barangay: barangay || undefined,
      title: title || undefined,
      message: message || undefined,
      source,
      status: "pending_review",
      requestedAt: timestamp,
      lastSubmittedAt: timestamp,
      submissionCount: 1,
      submissionSources: source ? [source] : [],
    };

    await db.collection(firebaseCollections.accessRequests).doc(nextRequest.id).set(compactUndefined(nextRequest));
    const auditLog = createAuditEntry({
      id: `AUD${Date.now()}-${nextRequest.id}`,
      user: "public-access-request",
      action: "CREATE_ACCESS_REQUEST",
      details: `${nextRequest.name} (${nextRequest.email}) humiling ng account setup.`,
    });
    await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);

    return applyRateLimitHeaders(
      NextResponse.json({
        submitted: true,
        request: nextRequest,
      }),
      rateLimit
    );
  } catch {
    return applyRateLimitHeaders(
      NextResponse.json(
        { error: "Hindi naisumite ang access request." },
        { status: 500 }
      ),
      rateLimit
    );
  }
}

export async function GET(request: Request) {
  const auth = await authenticateServerRequest(request, ["developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getServerFirestore();
  const snapshot = await db.collection(firebaseCollections.accessRequests).get();
  const requests = snapshot.docs
    .map((item) => item.data() as AccessRequest)
    .sort(
      (left, right) =>
        new Date(right.lastSubmittedAt ?? right.requestedAt).getTime() -
        new Date(left.lastSubmittedAt ?? left.requestedAt).getTime()
    );

  return NextResponse.json({ requests });
}

export async function PATCH(request: Request) {
  const auth = await authenticateServerRequest(request, ["developer"], {
    requireRecentLogin: true,
  });

  if (!auth.ok) {
    return NextResponse.json(
      {
        error: auth.error,
        code: "code" in auth ? auth.code : undefined,
      },
      { status: auth.status }
    );
  }

  try {
    const body = await request.json();
    const requestId = normalizeText(body.requestId);
    const status = normalizeStatus(body.status);
    const reviewNotes = normalizeText(body.reviewNotes);

    if (!requestId) {
      return NextResponse.json(
        { error: "Kinakailangan ang request ID." },
        { status: 400 }
      );
    }

    const db = getServerFirestore();
    const ref = db.collection(firebaseCollections.accessRequests).doc(requestId);
    const snapshot = await ref.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Hindi makita ang access request." },
        { status: 404 }
      );
    }

    const currentRequest = snapshot.data() as AccessRequest;
    const timestamp = new Date().toISOString();
    const nextRequest: AccessRequest = {
      ...currentRequest,
      status,
      reviewedAt: timestamp,
      reviewedBy: auth.profile.name ?? auth.email,
      reviewNotes: reviewNotes || currentRequest.reviewNotes,
    };

    await ref.set(compactUndefined(nextRequest), { merge: true });
    const auditLog = createAuditEntry({
      id: `AUD${Date.now()}-${requestId}`,
      user: auth.profile.name ?? auth.email,
      action: "UPDATE_ACCESS_REQUEST",
      details: `${nextRequest.email} -> ${status}`,
    });
    await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);

    return NextResponse.json({
      updated: true,
      request: nextRequest,
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi na-update ang access request." },
      { status: 500 }
    );
  }
}
