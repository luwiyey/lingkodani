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
  const useEnglish = message.detectedLanguage === "English";

  if (message.registrationRequired) {
    return useEnglish
      ? "Hello. If you still want assistance, please reply with the missing registration details so we can match your record in the system."
      : "Kamusta po. Kung nais pa po ninyong ma-assist, pakisagot po ang kulang na registration details upang maitugma po namin ang inyong record sa system.";
  }

  if (message.clarificationNeeded) {
    return useEnglish
      ? "Hello. If possible, please reply to the last clarification request so we can give more accurate advice."
      : "Kamusta po. Kung maaari po, pakisagot po ang huling clarification request upang makapagbigay po kami ng mas tumpak na payo.";
  }

  if (message.identityDetailsNeeded) {
    return useEnglish
      ? "Hello. We can continue following up your concern, but please send your full name and sitio or barangay so we can match your case properly."
      : "Kamusta po. Maitutuloy po namin ang follow-up sa concern ninyo, pero pakisend din po ang inyong buong pangalan at sitio o barangay upang maitugma po namin nang maayos ang inyong case.";
  }

  if (message.urgency === "high") {
    return useEnglish
      ? "Hello. How is the situation in your field now? Please tell us if the problem is getting worse so we can escalate it quickly."
      : "Kamusta na po ang sitwasyon sa inyong bukid? Pakisabi kung lumalala pa ang problema upang ma-escalate agad namin ito.";
  }

  return useEnglish
    ? "Hello. Did the earlier advice help? You may reply if you still need additional guidance."
    : "Kamusta po. Nakatulong po ba ang naunang payo? Maaari kayong mag-reply kung kailangan ninyo ng karagdagang gabay.";
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
    audience: "farmer",
    purpose: "follow_up",
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
