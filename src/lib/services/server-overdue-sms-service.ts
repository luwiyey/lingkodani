import type { SmsProvider } from "@/lib/providers/sms/types";
import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { readLiveSmsProvider } from "@/lib/providers/sms/live-sms-config";
import { getServerSystemSettings } from "@/lib/server/system-settings";
import { processOverdueSmsMessage } from "@/lib/services/overdue-sms-service";
import { sendLiveSms } from "@/lib/services/server-live-outbound-sms-service";
import { processOfficialReminderMessage } from "@/lib/services/staff-sms-service";
import type { SmsMessage, User } from "@/lib/types";

const liveServerSmsProvider: SmsProvider = {
  async sendMessage(input) {
    return sendLiveSms(input);
  },
};

function withoutUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

export async function processLiveOverdueSmsMessages(actorName = "system") {
  const db = getServerFirestore();
  const systemSettings = await getServerSystemSettings();
  const snapshot = await db
    .collection(firebaseCollections.smsMessages)
    .where("status", "==", "pending_approval")
    .get();
  const userSnapshot = await db.collection(firebaseCollections.users).get();
  const messages = snapshot.docs.map((item) => item.data() as SmsMessage);
  const users = userSnapshot.docs.map((item) => item.data() as User);
  const processed: Array<{ id: string; autoReplySentAt?: string }> = [];
  const failed: Array<{ id: string; error: string }> = [];

  for (const message of messages) {
    try {
      const result = await processOverdueSmsMessage({
        message,
        settings: systemSettings,
        provider: liveServerSmsProvider,
        providerName: `live-${readLiveSmsProvider(process.env)}`,
        actorName,
      });

      if (!result) {
        continue;
      }

      const reminderResult = await processOfficialReminderMessage({
        message: result.updatedMessage,
        users,
        settings: systemSettings,
        provider: liveServerSmsProvider,
        providerName: `live-${readLiveSmsProvider(process.env)}`,
        actorName,
        force: true,
      });
      const nextMessage = reminderResult?.updatedMessage ?? result.updatedMessage;

      await db.collection(firebaseCollections.smsMessages).doc(message.id).update(withoutUndefined({
        autoReplyEligibleAt: nextMessage.autoReplyEligibleAt,
        autoReplySentAt: nextMessage.autoReplySentAt,
        respondedAt: nextMessage.respondedAt,
        escalatedAt: nextMessage.escalatedAt,
        caseStatus: nextMessage.caseStatus,
        assignedTo: nextMessage.assignedTo,
        assignedAt: nextMessage.assignedAt,
        officialReminderRecipientName: nextMessage.officialReminderRecipientName,
        officialReminderRecipientPhone: nextMessage.officialReminderRecipientPhone,
        officialReminderDueAt: nextMessage.officialReminderDueAt,
        officialReminderLastSentAt: nextMessage.officialReminderLastSentAt,
        officialReminderCount: nextMessage.officialReminderCount,
      }));
      await db.collection(firebaseCollections.auditLogs).doc(result.auditLog.id).set(result.auditLog);
      await db.collection(firebaseCollections.logbookEntries).doc(result.logbookEntry.id).set(result.logbookEntry);
      await db.collection(firebaseCollections.outboundMessages).doc(result.outboundRecord.id).set(result.outboundRecord);

      if (reminderResult) {
        await db.collection(firebaseCollections.auditLogs).doc(reminderResult.auditLog.id).set(reminderResult.auditLog);
        await db.collection(firebaseCollections.logbookEntries).doc(reminderResult.logbookEntry.id).set(reminderResult.logbookEntry);
        await db.collection(firebaseCollections.outboundMessages).doc(reminderResult.outboundRecord.id).set(reminderResult.outboundRecord);
      }

      processed.push({
        id: message.id,
        autoReplySentAt: nextMessage.autoReplySentAt,
      });
    } catch (error) {
      failed.push({
        id: message.id,
        error: error instanceof Error ? error.message : "Unknown overdue-processing error",
      });
    }
  }

  return {
    checked: messages.length,
    processedCount: processed.length,
    processed,
    failedCount: failed.length,
    failed,
  };
}
