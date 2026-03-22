import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { readLiveSmsProvider } from "@/lib/providers/sms/live-sms-config";
import type { SmsProvider } from "@/lib/providers/sms/types";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import { requestFarmerResolutionConfirmation } from "@/lib/services/resolution-confirmation-service";
import { sendLiveSms } from "@/lib/services/server-live-outbound-sms-service";
import type { SmsMessage } from "@/lib/types";

const liveServerSmsProvider: SmsProvider = {
  async sendMessage(input) {
    return sendLiveSms(input);
  },
};

function compactUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  const auth = await authenticateServerRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json();
    const messageId = normalizeText(body.messageId);
    const note = normalizeText(body.note);

    if (!messageId) {
      return NextResponse.json(
        { error: "Kinakailangan ang message ID." },
        { status: 400 }
      );
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
    const result = await requestFarmerResolutionConfirmation({
      message: currentMessage,
      provider: liveServerSmsProvider,
      providerName: `live-${readLiveSmsProvider(process.env)}`,
      actorName: auth.profile.name ?? auth.email,
      note,
    });

    await messageRef.update(
      compactUndefined({
        caseStatus: result.updatedMessage.caseStatus,
        caseOutcomeStatus: result.updatedMessage.caseOutcomeStatus,
        caseOutcomeSummary: result.updatedMessage.caseOutcomeSummary,
        caseOutcomeUpdatedAt: result.updatedMessage.caseOutcomeUpdatedAt,
        caseOutcomeUpdatedBy: result.updatedMessage.caseOutcomeUpdatedBy,
        closedAt: result.updatedMessage.closedAt,
        resolutionNote: result.updatedMessage.resolutionNote,
        resolutionConfirmationStatus: result.updatedMessage.resolutionConfirmationStatus,
        resolutionConfirmationRequestedAt: result.updatedMessage.resolutionConfirmationRequestedAt,
        resolutionConfirmedAt: result.updatedMessage.resolutionConfirmedAt,
        resolutionConfirmedBy: result.updatedMessage.resolutionConfirmedBy,
        resolutionConfirmationNote: result.updatedMessage.resolutionConfirmationNote,
      })
    );
    await db.collection(firebaseCollections.auditLogs).doc(result.auditLog.id).set(result.auditLog);
    await db.collection(firebaseCollections.logbookEntries).doc(result.logbookEntry.id).set(result.logbookEntry);
    await db.collection(firebaseCollections.outboundMessages).doc(result.outboundRecord.id).set(result.outboundRecord);

    return NextResponse.json({
      updated: true,
      message: result.updatedMessage,
      outboundRecord: result.outboundRecord,
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi naipadala ang resolution confirmation SMS." },
      { status: 500 }
    );
  }
}
