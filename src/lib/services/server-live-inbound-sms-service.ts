import { firebaseCollections } from "@/lib/firebase/collections";
import { screenInboundSms } from "@/lib/inbound-sms-screening";
import { getServerFirestore } from "@/lib/firebase/server";
import { readLiveSmsProvider } from "@/lib/providers/sms/live-sms-config";
import { getServerSystemSettings } from "@/lib/server/system-settings";
import { recordRuntimeHealthSuccess, recordRuntimeHealthWarning } from "@/lib/system-health";
import { applyPriceWatchAdvice } from "@/lib/services/price-watch-service";
import {
  applyFarmerResolutionConfirmation,
  parseFarmerResolutionConfirmationReply,
} from "@/lib/services/resolution-confirmation-service";
import { sendLiveSms } from "@/lib/services/server-live-outbound-sms-service";
import { processInboundSms } from "@/lib/services/sms-workflow-service";
import { processOfficialInboundSms, processOfficialReminderMessage } from "@/lib/services/staff-sms-service";
import { buildPhoneLookupCandidates, normalizePhone } from "@/lib/sms-simulator";
import type { Farmer, LogbookEntry, MarketPriceEntry, SmsMessage, User } from "@/lib/types";
import type { InboundSmsAnalysis } from "@/lib/sms-simulator";

function withoutUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

async function queryCollectionByPhone<T extends { id?: string; uid?: string }>(
  collectionName: string,
  phoneCandidates: string[]
) {
  const db = getServerFirestore();
  const merged = new Map<string, T>();

  for (const candidate of phoneCandidates) {
    const snapshot = await db
      .collection(collectionName)
      .where("phone", "==", candidate)
      .limit(10)
      .get();

    for (const item of snapshot.docs) {
      const data = item.data() as T;
      merged.set(String(data.id ?? data.uid ?? item.id), data);
    }
  }

  return Array.from(merged.values());
}

async function queryMessagesByPhone(phoneCandidates: string[]) {
  const db = getServerFirestore();
  const merged = new Map<string, SmsMessage>();

  for (const candidate of phoneCandidates) {
    const snapshot = await db
      .collection(firebaseCollections.smsMessages)
      .where("phone", "==", candidate)
      .limit(25)
      .get();

    for (const item of snapshot.docs) {
      const data = item.data() as SmsMessage;
      merged.set(item.id, data);
    }
  }

  return Array.from(merged.values());
}

export async function persistLiveInboundSms(input: {
  phone: string;
  message: string;
  analysis?: InboundSmsAnalysis;
  sourceProvider?: SmsMessage["sourceProvider"];
  externalId?: string;
}) {
  const db = getServerFirestore();
  const screening = screenInboundSms({
    phone: input.phone,
    message: input.message,
  });

  if (screening.ignored) {
    await recordRuntimeHealthWarning("sms_inbound", "Live Inbound SMS", {
      reason: screening.reason,
      phone: input.phone,
    });
    return {
      duplicate: false,
      ignored: true,
      reason: screening.reason,
      handledBy: "ignored" as const,
      persisted: false,
      message: null,
    };
  }

  if (input.externalId) {
    const duplicateSnapshot = await db
      .collection(firebaseCollections.smsMessages)
      .where("externalId", "==", input.externalId)
      .limit(5)
      .get();
    const duplicate = duplicateSnapshot.docs
      .map((item) => item.data() as SmsMessage)
      .find((message) => message.sourceProvider === (input.sourceProvider ?? "unknown"));

    if (duplicate) {
      await recordRuntimeHealthSuccess("sms_inbound", "Live Inbound SMS", {
        duplicate: true,
        sourceProvider: input.sourceProvider ?? "unknown",
      });
      return {
        duplicate: true,
        message: duplicate,
      };
    }
  }

  const normalizedPhone = screening.normalizedPhone;
  const phoneCandidates = buildPhoneLookupCandidates(input.phone);
  const providerName = `live-${readLiveSmsProvider(process.env)}`;
  const liveServerSmsProvider = {
    async sendMessage(payload: { to: string; body: string }) {
      return sendLiveSms(payload);
    },
  };
  const [users, farmers, existingPhoneMessages, marketPriceSnapshot, systemSettings] = await Promise.all([
    queryCollectionByPhone<User>(firebaseCollections.users, phoneCandidates),
    queryCollectionByPhone<Farmer>(firebaseCollections.farmers, phoneCandidates),
    queryMessagesByPhone(phoneCandidates),
    db.collection(firebaseCollections.marketPrices).get(),
    getServerSystemSettings(),
  ]);
  const marketPrices = marketPriceSnapshot.docs.map((item) => item.data() as MarketPriceEntry);
  const matchingOfficial = users.find((user) => user.phone && normalizePhone(user.phone) === normalizedPhone);

  if (matchingOfficial) {
    const smsMessageSnapshot = await db
      .collection(firebaseCollections.smsMessages)
      .get();
    const existingMessages = smsMessageSnapshot.docs
      .map((item) => item.data() as SmsMessage);
    const officialResult = await processOfficialInboundSms({
      phone: input.phone,
      body: input.message,
      official: matchingOfficial,
      messages: existingMessages,
      provider: liveServerSmsProvider,
      providerName,
      actorName: matchingOfficial.name,
    });

    if (officialResult.message) {
      await db.collection(firebaseCollections.smsMessages).doc(officialResult.message.id).update(withoutUndefined({
        status: officialResult.message.status,
        aiAdvice: officialResult.message.aiAdvice,
        respondedAt: officialResult.message.respondedAt,
        caseStatus: officialResult.message.caseStatus,
        caseOutcomeStatus: officialResult.message.caseOutcomeStatus,
        caseOutcomeSummary: officialResult.message.caseOutcomeSummary,
        caseOutcomeUpdatedAt: officialResult.message.caseOutcomeUpdatedAt,
        caseOutcomeUpdatedBy: officialResult.message.caseOutcomeUpdatedBy,
        assignedTo: officialResult.message.assignedTo,
        assignedAt: officialResult.message.assignedAt,
        followUpDueAt: officialResult.message.followUpDueAt,
        closedAt: officialResult.message.closedAt,
        resolutionNote: officialResult.message.resolutionNote,
        resolutionConfirmationStatus: officialResult.message.resolutionConfirmationStatus,
        resolutionConfirmationRequestedAt: officialResult.message.resolutionConfirmationRequestedAt,
        resolutionConfirmedAt: officialResult.message.resolutionConfirmedAt,
        resolutionConfirmedBy: officialResult.message.resolutionConfirmedBy,
        resolutionConfirmationNote: officialResult.message.resolutionConfirmationNote,
        officialReminderRecipientName: officialResult.message.officialReminderRecipientName,
        officialReminderRecipientPhone: officialResult.message.officialReminderRecipientPhone,
        officialReminderDueAt: officialResult.message.officialReminderDueAt,
      }));
    }

    for (const auditLog of officialResult.auditLogs) {
      await db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog);
    }

    for (const logbookEntry of officialResult.logbookEntries) {
      await db.collection(firebaseCollections.logbookEntries).doc(logbookEntry.id).set(logbookEntry);
    }

    for (const outboundRecord of officialResult.outboundRecords) {
      await db.collection(firebaseCollections.outboundMessages).doc(outboundRecord.id).set(outboundRecord);
    }

    await recordRuntimeHealthSuccess("sms_inbound", "Live Inbound SMS", {
      handledBy: "official",
      official: matchingOfficial.name,
      sourceProvider: input.sourceProvider ?? "unknown",
    });

    return {
      duplicate: false,
      handledBy: "official" as const,
      persisted: false,
      message: officialResult.message ?? null,
    };
  }

  const confirmationReply = parseFarmerResolutionConfirmationReply(input.message);
  const awaitingConfirmationMessages = existingPhoneMessages
    .filter((message) =>
      normalizePhone(message.phone) === normalizedPhone &&
      message.resolutionConfirmationStatus === "awaiting_farmer" &&
      !message.closedAt
    )
    .sort((left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime());
  const awaitingConfirmationMessage = confirmationReply?.caseId
    ? awaitingConfirmationMessages.find(
        (message) => (message.caseId ?? "").toUpperCase() === confirmationReply.caseId
      ) ?? awaitingConfirmationMessages[0]
    : awaitingConfirmationMessages[0];

  if (confirmationReply && awaitingConfirmationMessage) {
    const confirmationResult = applyFarmerResolutionConfirmation({
      message: awaitingConfirmationMessage,
      confirmationStatus: confirmationReply.status,
      replyBody: input.message,
    });

    await db.collection(firebaseCollections.smsMessages).doc(awaitingConfirmationMessage.id).update(withoutUndefined({
      caseStatus: confirmationResult.updatedMessage.caseStatus,
      closedAt: confirmationResult.updatedMessage.closedAt,
      caseOutcomeStatus: confirmationResult.updatedMessage.caseOutcomeStatus,
      caseOutcomeSummary: confirmationResult.updatedMessage.caseOutcomeSummary,
      caseOutcomeUpdatedAt: confirmationResult.updatedMessage.caseOutcomeUpdatedAt,
      caseOutcomeUpdatedBy: confirmationResult.updatedMessage.caseOutcomeUpdatedBy,
      resolutionConfirmationStatus: confirmationResult.updatedMessage.resolutionConfirmationStatus,
      resolutionConfirmedAt: confirmationResult.updatedMessage.resolutionConfirmedAt,
      resolutionConfirmedBy: confirmationResult.updatedMessage.resolutionConfirmedBy,
      resolutionConfirmationNote: confirmationResult.updatedMessage.resolutionConfirmationNote,
      followUpDueAt: confirmationResult.updatedMessage.followUpDueAt,
    }));
    await db.collection(firebaseCollections.auditLogs).doc(confirmationResult.auditLog.id).set(confirmationResult.auditLog);
    await db.collection(firebaseCollections.logbookEntries).doc(confirmationResult.logbookEntry.id).set(confirmationResult.logbookEntry);

    if (confirmationReply.status === "reopened") {
      const reminderResult = await processOfficialReminderMessage({
        message: confirmationResult.updatedMessage,
        users: [],
        settings: systemSettings,
        provider: liveServerSmsProvider,
        providerName,
        actorName: "system",
        force: true,
      });

      if (reminderResult) {
        await db.collection(firebaseCollections.smsMessages).doc(awaitingConfirmationMessage.id).update(withoutUndefined({
          assignedTo: reminderResult.updatedMessage.assignedTo,
          assignedAt: reminderResult.updatedMessage.assignedAt,
          caseStatus: reminderResult.updatedMessage.caseStatus,
          officialReminderRecipientName: reminderResult.updatedMessage.officialReminderRecipientName,
          officialReminderRecipientPhone: reminderResult.updatedMessage.officialReminderRecipientPhone,
          officialReminderDueAt: reminderResult.updatedMessage.officialReminderDueAt,
          officialReminderLastSentAt: reminderResult.updatedMessage.officialReminderLastSentAt,
          officialReminderCount: reminderResult.updatedMessage.officialReminderCount,
        }));
        await db.collection(firebaseCollections.auditLogs).doc(reminderResult.auditLog.id).set(reminderResult.auditLog);
        await db.collection(firebaseCollections.logbookEntries).doc(reminderResult.logbookEntry.id).set(reminderResult.logbookEntry);
        await db.collection(firebaseCollections.outboundMessages).doc(reminderResult.outboundRecord.id).set(reminderResult.outboundRecord);
      }
    }

    await recordRuntimeHealthSuccess("sms_inbound", "Live Inbound SMS", {
      handledBy: "resolution_confirmation",
      caseId: confirmationResult.updatedMessage.caseId ?? confirmationResult.updatedMessage.id,
      confirmationStatus: confirmationReply.status,
      sourceProvider: input.sourceProvider ?? "unknown",
    });

    return {
      duplicate: false,
      handledBy: "resolution_confirmation" as const,
      persisted: false,
      message: confirmationResult.updatedMessage,
    };
  }

  const workflowBase = processInboundSms({
    phone: input.phone,
    message: input.message,
    farmers,
    existingMessages: existingPhoneMessages,
    analysis: input.analysis,
    settings: systemSettings,
    sourceProvider: input.sourceProvider,
    externalId: input.externalId,
  });
  const workflow = {
    ...workflowBase,
    message: applyPriceWatchAdvice(workflowBase.message, marketPrices),
  };
  const logbookEntry: LogbookEntry = {
    id: `LOG${Date.now()}-${workflow.message.id}`,
    farmerId: workflow.message.farmerId,
    timestamp: workflow.message.timestamp,
    type: "SMS",
    title: "Bagong ulat sa SMS",
    description: `${workflow.message.farmerName}: ${workflow.message.message}`,
  };

  await db.collection(firebaseCollections.smsMessages).doc(workflow.message.id).set(workflow.message);
  await db.collection(firebaseCollections.auditLogs).doc(workflow.auditLog.id).set(workflow.auditLog);
  await db.collection(firebaseCollections.logbookEntries).doc(logbookEntry.id).set(logbookEntry);

  if (workflow.newFarmer) {
    await db.collection(firebaseCollections.farmers).doc(workflow.newFarmer.id).set(workflow.newFarmer);
  }

  for (const update of workflow.farmerUpdates) {
    await db.collection(firebaseCollections.farmers).doc(update.farmerId).update(update.updates);
  }

  await recordRuntimeHealthSuccess("sms_inbound", "Live Inbound SMS", {
    handledBy: "farmer",
    sourceProvider: input.sourceProvider ?? "unknown",
    caseId: workflow.message.caseId ?? workflow.message.id,
  });

  return {
    duplicate: false,
    handledBy: "farmer" as const,
    persisted: true,
    ...workflow,
  };
}
