import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { readLiveSmsProvider } from "@/lib/providers/sms/live-sms-config";
import { getServerSystemSettings } from "@/lib/server/system-settings";
import { applyPriceWatchAdvice } from "@/lib/services/price-watch-service";
import { sendLiveSms } from "@/lib/services/server-live-outbound-sms-service";
import { processInboundSms } from "@/lib/services/sms-workflow-service";
import { processOfficialInboundSms } from "@/lib/services/staff-sms-service";
import { normalizePhone } from "@/lib/sms-simulator";
import type { Farmer, LogbookEntry, MarketPriceEntry, SmsMessage, User } from "@/lib/types";
import type { InboundSmsAnalysis } from "@/lib/sms-simulator";

function withoutUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

export async function persistLiveInboundSms(input: {
  phone: string;
  message: string;
  analysis?: InboundSmsAnalysis;
  sourceProvider?: SmsMessage["sourceProvider"];
  externalId?: string;
}) {
  const db = getServerFirestore();

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
      return {
        duplicate: true,
        message: duplicate,
      };
    }
  }

  const normalizedPhone = normalizePhone(input.phone);
  const providerName = `live-${readLiveSmsProvider(process.env)}`;
  const liveServerSmsProvider = {
    async sendMessage(payload: { to: string; body: string }) {
      return sendLiveSms(payload);
    },
  };
  const userSnapshot = await db
    .collection(firebaseCollections.users)
    .get();
  const farmerSnapshot = await db
    .collection(firebaseCollections.farmers)
    .limit(500)
    .get();
  const smsMessageSnapshot = await db
    .collection(firebaseCollections.smsMessages)
    .get();
  const marketPriceSnapshot = await db
    .collection(firebaseCollections.marketPrices)
    .get();
  const systemSettings = await getServerSystemSettings();
  const users = userSnapshot.docs
    .map((item) => item.data() as User);
  const farmers = farmerSnapshot.docs
    .map((item) => item.data() as Farmer)
    .filter((farmer) => normalizePhone(farmer.phone) === normalizedPhone);
  const existingMessages = smsMessageSnapshot.docs
    .map((item) => item.data() as SmsMessage);
  const marketPrices = marketPriceSnapshot.docs
    .map((item) => item.data() as MarketPriceEntry);
  const matchingOfficial = users.find((user) => user.phone && normalizePhone(user.phone) === normalizedPhone);

  if (matchingOfficial) {
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
        assignedTo: officialResult.message.assignedTo,
        assignedAt: officialResult.message.assignedAt,
        followUpDueAt: officialResult.message.followUpDueAt,
        closedAt: officialResult.message.closedAt,
        resolutionNote: officialResult.message.resolutionNote,
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

    return {
      duplicate: false,
      handledBy: "official" as const,
      persisted: false,
      message: officialResult.message ?? null,
    };
  }

  const workflowBase = processInboundSms({
    phone: input.phone,
    message: input.message,
    farmers,
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

  return {
    duplicate: false,
    handledBy: "farmer" as const,
    persisted: true,
    ...workflow,
  };
}
