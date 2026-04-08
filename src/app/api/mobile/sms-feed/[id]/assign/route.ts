import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import {
  buildMobileSyncConflict,
  getSmsMessageSyncVersion,
  hasExpectedSyncConflict,
} from "@/lib/mobile-sync-integrity";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import { createAuditEntry } from "@/lib/services/audit-service";
import type { SmsMessage } from "@/lib/types";

function compactUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const messageId = id.trim();
    const body = await request.json();
    const expectedSyncVersion =
      typeof body.expectedSyncVersion === "string"
        ? body.expectedSyncVersion.trim()
        : "";

    if (!messageId) {
      return NextResponse.json({ error: "Missing message ID." }, { status: 400 });
    }

    const db = getServerFirestore();
    const messageRef = db.collection(firebaseCollections.smsMessages).doc(messageId);
    const snapshot = await messageRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Hindi makita ang SMS case." },
        { status: 404 }
      );
    }

    const currentMessage = snapshot.data() as SmsMessage;
    const currentSyncVersion = getSmsMessageSyncVersion(currentMessage);

    if (hasExpectedSyncConflict(expectedSyncVersion, currentSyncVersion)) {
      return NextResponse.json(
        {
          error:
            "May bagong update sa kasong ito habang offline ang device. I-refresh muna bago ito italaga muli.",
          ...buildMobileSyncConflict({
            expectedSyncVersion,
            currentSyncVersion,
            target: "sms_message",
            summary:
              "Nagbago na ang assignment o case status bago na-sync ang mobile assign action.",
            recommendedAction:
              "I-refresh ang SMS feed at tingnan kung may naka-assign na o kung sarado na ang case bago mag-assign muli.",
            currentState: {
              caseStatus: currentMessage.caseStatus,
              assignedTo: currentMessage.assignedTo,
              assignedAt: currentMessage.assignedAt,
            },
          }),
        },
        { status: 409 }
      );
    }

    const timestamp = new Date().toISOString();
    const actorName = auth.profile.name ?? auth.email;

    const nextMessage: SmsMessage = {
      ...currentMessage,
      assignedTo: actorName,
      assignedAt: currentMessage.assignedAt ?? timestamp,
      caseStatus:
        currentMessage.caseStatus === "closed"
          ? currentMessage.caseStatus
          : "assigned",
    };

    const auditLog = createAuditEntry({
      id: `AUD${Date.now()}-MOBILE-ASSIGN`,
      timestamp,
      user: actorName,
      action: "MOBILE_SMS_ASSIGN",
      details: `${nextMessage.caseId ?? nextMessage.id} itinalaga kay ${actorName} mula sa mobile app.`,
      category: "operations",
      severity: "info",
      beforeSnapshot: {
        assignedTo: currentMessage.assignedTo ?? null,
        caseStatus: currentMessage.caseStatus ?? null,
      },
      afterSnapshot: {
        assignedTo: nextMessage.assignedTo ?? null,
        caseStatus: nextMessage.caseStatus ?? null,
      },
    });

    await Promise.all([
      messageRef.update(
        compactUndefined({
          assignedTo: nextMessage.assignedTo,
          assignedAt: nextMessage.assignedAt,
          caseStatus: nextMessage.caseStatus,
        })
      ),
      db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog),
    ]);

    return NextResponse.json({
      updated: true,
      message: nextMessage,
      syncVersion: getSmsMessageSyncVersion(nextMessage),
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi naitalaga ang SMS case mula sa mobile app." },
      { status: 500 }
    );
  }
}
