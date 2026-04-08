import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import {
  buildMobileSyncConflict,
  getSmsMessageSyncVersion,
  hasExpectedSyncConflict,
} from "@/lib/mobile-sync-integrity";
import { readLiveSmsProvider } from "@/lib/providers/sms/live-sms-config";
import type { SmsProvider } from "@/lib/providers/sms/types";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import { createAuditEntry } from "@/lib/services/audit-service";
import { sendOutboundMessage } from "@/lib/services/outbound-sms-service";
import { sendLiveSms } from "@/lib/services/server-live-outbound-sms-service";
import { createSmsTrainingExample } from "@/lib/services/sms-training-service";
import { applySmsStatusUpdate } from "@/lib/services/sms-workflow-service";
import type {
  AuditLog,
  LogbookEntry,
  SafetyFlag,
  SmsIntent,
  SmsMessage,
  SmsMessageStatus,
  SmsTone,
  SmsUrgency,
  SmsTrainingExample,
} from "@/lib/types";

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

function readStatus(value: unknown): SmsMessageStatus {
  return value === "approved" ? "approved" : "replied";
}

function readIntent(value: unknown): SmsIntent | undefined {
  const allowed: SmsIntent[] = [
    "REGISTER",
    "CROP_UPDATE",
    "HARVEST",
    "REQUEST",
    "PEST_DISEASE",
    "WEATHER_HELP",
    "PRICE_CHECK",
    "EMERGENCY",
    "UNKNOWN",
  ];

  return typeof value === "string" && allowed.includes(value as SmsIntent)
    ? (value as SmsIntent)
    : undefined;
}

function readUrgency(value: unknown): SmsUrgency | undefined {
  return value === "low" || value === "medium" || value === "high"
    ? value
    : undefined;
}

function readSafetyFlag(value: unknown): SafetyFlag | undefined {
  return value === "Low" || value === "Medium" || value === "High"
    ? value
    : undefined;
}

function readTone(value: unknown): SmsTone | undefined {
  return value === "Neutral" ||
    value === "Nag-aalala" ||
    value === "Kritikal" ||
    value === "Positibo"
    ? value
    : undefined;
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
    const replyBody = normalizeText(body.reply);
    const status = readStatus(body.status);
    const expectedSyncVersion = normalizeText(body.expectedSyncVersion);
    const actorName = auth.profile.name ?? auth.email;

    if (!messageId) {
      return NextResponse.json({ error: "Missing message ID." }, { status: 400 });
    }

    if (!replyBody) {
      return NextResponse.json(
        { error: "Kinakailangan ang reply text." },
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
    const currentSyncVersion = getSmsMessageSyncVersion(currentMessage);

    if (hasExpectedSyncConflict(expectedSyncVersion, currentSyncVersion)) {
      return NextResponse.json(
        {
          error:
            "May bagong update sa kasong ito habang offline ang device. I-refresh muna bago magpadala ng reply.",
          ...buildMobileSyncConflict({
            expectedSyncVersion,
            currentSyncVersion,
            target: "sms_message",
            summary:
              "Nagbago na ang case status o naitalagang handler habang wala pang signal ang mobile device.",
            recommendedAction:
              "I-refresh ang SMS feed, suriin ang pinakabagong case status, at i-edit muli ang tugon kung kailangan.",
            currentState: {
              status: currentMessage.status,
              caseStatus: currentMessage.caseStatus,
              assignedTo: currentMessage.assignedTo,
              resolutionConfirmationStatus:
                currentMessage.resolutionConfirmationStatus,
            },
          }),
        },
        { status: 409 }
      );
    }

    if (currentMessage.closedAt || currentMessage.caseStatus === "closed") {
      return NextResponse.json(
        { error: "Sarado na ang kasong ito at hindi na maaaring reply-an." },
        { status: 409 }
      );
    }

    const timestamp = new Date().toISOString();
    const workflow = applySmsStatusUpdate({
      currentMessage,
      updates: compactUndefined({
        status,
        aiAdvice: replyBody,
        parsedIntent: readIntent(body.parsedIntent),
        urgency: readUrgency(body.urgency),
        safetyFlag: readSafetyFlag(body.safetyFlag),
        tone: readTone(body.tone),
      }),
      actorName,
      timestamp,
    });

    if (!workflow.nextMessage) {
      return NextResponse.json(
        { error: "Hindi maihanda ang reply para sa kasong ito." },
        { status: 400 }
      );
    }

    const nextMessage = workflow.nextMessage;
    const outboundRecord = await sendOutboundMessage({
      sourceMessage: nextMessage,
      body: nextMessage.aiAdvice,
      provider: liveServerSmsProvider,
      providerName: `live-${readLiveSmsProvider(process.env)}`,
      audience: "farmer",
      purpose: "manual_reply",
    });

    if (outboundRecord.status === "failed") {
      await db
        .collection(firebaseCollections.outboundMessages)
        .doc(outboundRecord.id)
        .set(outboundRecord);

      return NextResponse.json(
        {
          error:
            outboundRecord.errorMessage ??
            "Hindi naipadala ang SMS reply sa magsasaka.",
          outboundRecord,
        },
        { status: 502 }
      );
    }

    const responseLogbookEntry: LogbookEntry = {
      id: `LOG${Date.now()}-${nextMessage.id}-MOBILE-REPLY`,
      farmerId: nextMessage.farmerId,
      timestamp: nextMessage.respondedAt ?? timestamp,
      type: "Payo",
      title: "Naglabas ng tugon",
      description: `${actorName}: ${nextMessage.aiAdvice}`,
    };
    const trainingExample: SmsTrainingExample =
      createSmsTrainingExample({
        previousMessage: currentMessage,
        nextMessage,
        actorName,
      });
    const mobileAuditLog: AuditLog = createAuditEntry({
      id: `AUD${Date.now()}-MOBILE-REPLY`,
      timestamp,
      user: actorName,
      action: "MOBILE_SMS_REPLY_SENT",
      details: `${nextMessage.caseId ?? nextMessage.id} sinagot mula sa mobile app.`,
    });

    await messageRef.update(
      compactUndefined({
        status: nextMessage.status,
        aiAdvice: nextMessage.aiAdvice,
        respondedAt: nextMessage.respondedAt,
        assignedTo: nextMessage.assignedTo,
        assignedAt: nextMessage.assignedAt,
        caseStatus: nextMessage.caseStatus,
        followUpDueAt: nextMessage.followUpDueAt,
        followUpSentAt: nextMessage.followUpSentAt,
        closedAt: nextMessage.closedAt,
        resolutionNote: nextMessage.resolutionNote,
        parsedIntent: nextMessage.parsedIntent,
        urgency: nextMessage.urgency,
        safetyFlag: nextMessage.safetyFlag,
        tone: nextMessage.tone,
      })
    );

    const writes: Array<Promise<unknown>> = [
      db
        .collection(firebaseCollections.logbookEntries)
        .doc(responseLogbookEntry.id)
        .set(responseLogbookEntry),
      db
        .collection(firebaseCollections.outboundMessages)
        .doc(outboundRecord.id)
        .set(outboundRecord),
      db
        .collection(firebaseCollections.smsTrainingExamples)
        .doc(trainingExample.id)
        .set(trainingExample),
      db
        .collection(firebaseCollections.auditLogs)
        .doc(mobileAuditLog.id)
        .set(mobileAuditLog),
    ];

    if (workflow.auditLog) {
      writes.push(
        db
          .collection(firebaseCollections.auditLogs)
          .doc(workflow.auditLog.id)
          .set(workflow.auditLog)
      );
    }

    await Promise.all(writes);

    return NextResponse.json({
      updated: true,
      message: nextMessage,
      outboundRecord,
      syncVersion: getSmsMessageSyncVersion(nextMessage),
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi naproseso ang mobile SMS reply." },
      { status: 500 }
    );
  }
}
