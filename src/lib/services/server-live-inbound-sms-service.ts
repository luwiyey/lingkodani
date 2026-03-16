import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { getServerSystemSettings } from "@/lib/server/system-settings";
import { applyPriceWatchAdvice } from "@/lib/services/price-watch-service";
import { processInboundSms } from "@/lib/services/sms-workflow-service";
import { normalizePhone } from "@/lib/sms-simulator";
import type { Farmer, LogbookEntry, MarketPriceEntry, SmsMessage } from "@/lib/types";
import type { InboundSmsAnalysis } from "@/lib/sms-simulator";

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
  const farmerSnapshot = await db
    .collection(firebaseCollections.farmers)
    .limit(500)
    .get();
  const marketPriceSnapshot = await db
    .collection(firebaseCollections.marketPrices)
    .get();
  const systemSettings = await getServerSystemSettings();
  const farmers = farmerSnapshot.docs
    .map((item) => item.data() as Farmer)
    .filter((farmer) => normalizePhone(farmer.phone) === normalizedPhone);
  const marketPrices = marketPriceSnapshot.docs
    .map((item) => item.data() as MarketPriceEntry);
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
    ...workflow,
  };
}
