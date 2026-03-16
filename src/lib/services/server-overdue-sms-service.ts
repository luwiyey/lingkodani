import type { SmsProvider } from "@/lib/providers/sms/types";
import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { getServerSystemSettings } from "@/lib/server/system-settings";
import { processOverdueSmsMessage } from "@/lib/services/overdue-sms-service";
import { sendLiveSms } from "@/lib/services/server-live-outbound-sms-service";
import type { SmsMessage } from "@/lib/types";

const liveServerSmsProvider: SmsProvider = {
  async sendMessage(input) {
    return sendLiveSms(input);
  },
};

export async function processLiveOverdueSmsMessages() {
  const db = getServerFirestore();
  const systemSettings = await getServerSystemSettings();
  const snapshot = await db
    .collection(firebaseCollections.smsMessages)
    .where("status", "==", "pending_approval")
    .get();
  const messages = snapshot.docs.map((item) => item.data() as SmsMessage);
  const processed: Array<{ id: string; autoReplySentAt?: string }> = [];

  for (const message of messages) {
    const result = await processOverdueSmsMessage({
      message,
      settings: systemSettings,
      provider: liveServerSmsProvider,
      providerName: `live-${process.env.LIVE_SMS_PROVIDER ?? "generic"}`,
      actorName: "system",
    });

    if (!result) {
      continue;
    }

    await db.collection(firebaseCollections.smsMessages).doc(message.id).update({
      autoReplyEligibleAt: result.updatedMessage.autoReplyEligibleAt,
      autoReplySentAt: result.updatedMessage.autoReplySentAt,
      respondedAt: result.updatedMessage.respondedAt,
      escalatedAt: result.updatedMessage.escalatedAt,
      caseStatus: result.updatedMessage.caseStatus,
    });
    await db.collection(firebaseCollections.auditLogs).doc(result.auditLog.id).set(result.auditLog);
    await db.collection(firebaseCollections.logbookEntries).doc(result.logbookEntry.id).set(result.logbookEntry);
    await db.collection(firebaseCollections.outboundMessages).doc(result.outboundRecord.id).set(result.outboundRecord);

    processed.push({
      id: message.id,
      autoReplySentAt: result.updatedMessage.autoReplySentAt,
    });
  }

  return {
    checked: messages.length,
    processedCount: processed.length,
    processed,
  };
}
