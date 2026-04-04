import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { readLiveSmsProvider } from "@/lib/providers/sms/live-sms-config";
import type { SmsProvider } from "@/lib/providers/sms/types";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import { requestFarmerResolutionConfirmation } from "@/lib/services/resolution-confirmation-service";
import { sendLiveSms } from "@/lib/services/server-live-outbound-sms-service";
import { getSmsCaseResolutionReadiness } from "@/lib/sms-case-quality";
import type { FarmerAssistanceRecord, FieldVisitTask, SmsMessage } from "@/lib/types";

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

async function listRecordsForMessage<T extends Record<string, unknown>>(
  collectionName: string,
  message: Pick<SmsMessage, "id" | "farmerId">
) {
  const db = getServerFirestore();
  const [farmerSnapshot, relatedSnapshot] = await Promise.all([
    db
      .collection(collectionName)
      .where("farmerId", "==", message.farmerId)
      .limit(25)
      .get(),
    db
      .collection(collectionName)
      .where("relatedSmsId", "==", message.id)
      .limit(25)
      .get(),
  ]);

  const merged = new Map<string, T>();

  for (const documentSnapshot of [...farmerSnapshot.docs, ...relatedSnapshot.docs]) {
    merged.set(documentSnapshot.id, documentSnapshot.data() as T);
  }

  return Array.from(merged.values());
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
    const note = normalizeText(body.note);

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
    const [assistanceRecords, fieldVisitTasks] = await Promise.all([
      listRecordsForMessage<FarmerAssistanceRecord>(
        firebaseCollections.assistanceRecords,
        currentMessage
      ),
      listRecordsForMessage<FieldVisitTask>(
        firebaseCollections.fieldVisitTasks,
        currentMessage
      ),
    ]);
    const resolutionReadiness = getSmsCaseResolutionReadiness({
      message: currentMessage,
      assistanceRecords,
      fieldVisitTasks,
    });

    if (!resolutionReadiness.ready) {
      return NextResponse.json(
        {
          error:
            resolutionReadiness.blockers[0] ??
            "Mag-log muna ng action taken o completed field visit bago magpadala ng YES/NO confirmation.",
          blockers: resolutionReadiness.blockers,
          readiness: resolutionReadiness,
        },
        { status: 409 }
      );
    }

    const result = await requestFarmerResolutionConfirmation({
      message: currentMessage,
      provider: liveServerSmsProvider,
      providerName: `live-${readLiveSmsProvider(process.env)}`,
      actorName: auth.profile.name ?? auth.email,
      note,
    });

    if (result.outboundRecord.status === "failed") {
      await db
        .collection(firebaseCollections.outboundMessages)
        .doc(result.outboundRecord.id)
        .set(result.outboundRecord);

      return NextResponse.json(
        {
          error:
            result.outboundRecord.errorMessage ??
            "Hindi naipadala ang resolution confirmation SMS.",
          outboundRecord: result.outboundRecord,
        },
        { status: 502 }
      );
    }

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
        resolutionConfirmationRequestedAt:
          result.updatedMessage.resolutionConfirmationRequestedAt,
        resolutionConfirmedAt: result.updatedMessage.resolutionConfirmedAt,
        resolutionConfirmedBy: result.updatedMessage.resolutionConfirmedBy,
        resolutionConfirmationNote: result.updatedMessage.resolutionConfirmationNote,
      })
    );
    await Promise.all([
      db
        .collection(firebaseCollections.auditLogs)
        .doc(result.auditLog.id)
        .set(result.auditLog),
      db
        .collection(firebaseCollections.logbookEntries)
        .doc(result.logbookEntry.id)
        .set(result.logbookEntry),
      db
        .collection(firebaseCollections.outboundMessages)
        .doc(result.outboundRecord.id)
        .set(result.outboundRecord),
    ]);

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
