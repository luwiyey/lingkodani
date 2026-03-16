import type { SmsProvider } from "@/lib/providers/sms/types";
import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { processDueFollowUpMessage } from "@/lib/services/follow-up-service";
import { sendLiveSms } from "@/lib/services/server-live-outbound-sms-service";
import type { SmsMessage } from "@/lib/types";

const liveServerSmsProvider: SmsProvider = {
  async sendMessage(input) {
    return sendLiveSms(input);
  },
};

export async function processLiveFollowUpMessages(actorName = "system") {
  const db = getServerFirestore();
  const snapshot = await db.collection(firebaseCollections.smsMessages).get();
  const messages = snapshot.docs.map((item) => item.data() as SmsMessage);
  const processed: Array<{ id: string; followUpSentAt?: string }> = [];

  for (const message of messages) {
    const result = await processDueFollowUpMessage({
      message,
      provider: liveServerSmsProvider,
      providerName: `live-${process.env.LIVE_SMS_PROVIDER ?? "generic"}`,
      actorName,
    });

    if (!result) {
      continue;
    }

    await db.collection(firebaseCollections.smsMessages).doc(message.id).update({
      followUpSentAt: result.updatedMessage.followUpSentAt,
    });
    await db.collection(firebaseCollections.auditLogs).doc(result.auditLog.id).set(result.auditLog);
    await db.collection(firebaseCollections.logbookEntries).doc(result.logbookEntry.id).set(result.logbookEntry);
    await db.collection(firebaseCollections.outboundMessages).doc(result.outboundRecord.id).set(result.outboundRecord);

    processed.push({
      id: message.id,
      followUpSentAt: result.updatedMessage.followUpSentAt,
    });
  }

  return {
    checked: messages.length,
    processedCount: processed.length,
    processed,
  };
}
