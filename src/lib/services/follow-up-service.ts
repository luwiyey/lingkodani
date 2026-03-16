import type { SmsProvider } from "@/lib/providers/sms/types";
import { sendOutboundMessage } from "@/lib/services/outbound-sms-service";
import { getFollowUpDueAt } from "@/lib/services/sms-case-service";
import { createAuditEntry } from "@/lib/services/audit-service";
import type { LogbookEntry, SmsMessage } from "@/lib/types";

export function isFollowUpDue(message: SmsMessage, now = Date.now()) {
  if (!message.respondedAt) return false;
  if (message.closedAt) return false;
  if (message.followUpSentAt) return false;
  if (!message.followUpDueAt) return false;

  return new Date(message.followUpDueAt).getTime() <= now;
}

export function buildFollowUpBody(message: SmsMessage) {
  if (message.registrationRequired) {
    return "Kamusta po. Kung nais ninyo pa ring ma-assist, pakisagot po ang registration details upang maitugma namin ang inyong record sa system.";
  }

  if (message.clarificationNeeded) {
    return "Kamusta po. Kung maaari, pakisagot po ang huling clarification request upang makapagbigay kami ng mas tumpak na payo.";
  }

  if (message.urgency === "high") {
    return "Kamusta na po ang sitwasyon sa inyong bukid? Pakisabi kung lumalala pa ang problema upang ma-escalate agad namin ito.";
  }

  return "Kamusta po. Nakatulong po ba ang naunang payo? Maaari kayong mag-reply kung kailangan ninyo ng karagdagang gabay.";
}

export async function processDueFollowUpMessage(input: {
  message: SmsMessage;
  provider: SmsProvider;
  providerName: string;
  actorName?: string;
  now?: number;
}) {
  if (!isFollowUpDue(input.message, input.now)) {
    return null;
  }

  const timestamp = new Date(input.now ?? Date.now()).toISOString();
  const body = buildFollowUpBody(input.message);
  const updatedMessage: SmsMessage = {
    ...input.message,
    followUpSentAt: timestamp,
  };
  const outboundRecord = await sendOutboundMessage({
    sourceMessage: updatedMessage,
    body,
    provider: input.provider,
    providerName: input.providerName,
  });

  return {
    updatedMessage,
    body,
    auditLog: createAuditEntry({
      id: `AUD${Date.now()}`,
      timestamp,
      user: input.actorName ?? "system",
      action: "FOLLOW_UP_SMS_SENT",
      details: `Nagpadala ng follow-up SMS para kay ${updatedMessage.farmerName}.`,
    }),
    logbookEntry: {
      id: `LOG${Date.now()}-${updatedMessage.id}`,
      farmerId: updatedMessage.farmerId,
      timestamp,
      type: "Payo",
      title: "Follow-up SMS",
      description: body,
    } satisfies LogbookEntry,
    outboundRecord,
  };
}

export function ensureFollowUpDueAt(message: SmsMessage) {
  if (message.followUpDueAt || !message.respondedAt) {
    return message.followUpDueAt;
  }

  return getFollowUpDueAt(message.respondedAt, message.urgency);
}
