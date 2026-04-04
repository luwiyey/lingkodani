import type { SmsProvider } from "@/lib/providers/sms/types";
import { sendOutboundMessage } from "@/lib/services/outbound-sms-service";
import { getFollowUpDueAt } from "@/lib/services/sms-case-service";
import { createAuditEntry } from "@/lib/services/audit-service";
import type { LogbookEntry, SmsMessage } from "@/lib/types";

const MAX_FOLLOW_UP_ATTEMPTS = 3;

export function isFollowUpDue(message: SmsMessage, now = Date.now()) {
  if (!message.respondedAt) return false;
  if (message.closedAt) return false;
  if (message.followUpStopReason) return false;
  if (!message.followUpDueAt) return false;
  if ((message.followUpAttemptCount ?? 0) >= MAX_FOLLOW_UP_ATTEMPTS) return false;

  return new Date(message.followUpDueAt).getTime() <= now;
}

export function getFollowUpLadderState(message: Pick<SmsMessage, "followUpAttemptCount" | "followUpStopReason" | "followUpOutcome">) {
  const attempts = message.followUpAttemptCount ?? 0;

  if (message.followUpStopReason) {
    return {
      label: "Tumigil na ang reminder ladder",
      helper: message.followUpStopReason,
    };
  }

  if (attempts <= 0) {
    return {
      label: "Unang follow-up pa lang",
      helper: "Magse-send pa lang ng unang check-in pagkatapos ng initial response.",
    };
  }

  if (attempts === 1) {
    return {
      label: "Unang reminder sent",
      helper: "Susunod na tanong ay mas nakatuon sa actual outcome o paglala ng concern.",
    };
  }

  if (attempts === 2) {
    return {
      label: "Ikalawang reminder sent",
      helper: "Kung wala pa ring malinaw na sagot, dapat nang i-consider ang admin closeout o human outreach.",
    };
  }

  return {
    label: "Last allowed reminder sent",
    helper:
      message.followUpOutcome === "no_response"
        ? "Wala pa ring malinaw na sagot; maaari nang i-mark na administrative no-response follow-up."
        : "Dapat nang i-decide kung may kailangan pang manual outreach o closeout review.",
  };
}

function getNextFollowUpDueAt(timestamp: string, message: SmsMessage, attempts: number) {
  if (attempts >= MAX_FOLLOW_UP_ATTEMPTS) {
    return undefined;
  }

  if (message.urgency === "high") {
    return new Date(new Date(timestamp).getTime() + 12 * 60 * 60 * 1000).toISOString();
  }

  if (attempts >= 2) {
    return new Date(new Date(timestamp).getTime() + 24 * 60 * 60 * 1000).toISOString();
  }

  return getFollowUpDueAt(timestamp, message.urgency);
}

export function buildFollowUpBody(message: SmsMessage) {
  const useEnglish = message.detectedLanguage === "English";
  const attempts = message.followUpAttemptCount ?? 0;

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

  if (attempts >= 2) {
    return useEnglish
      ? "Hello. We are checking one last time. Please reply with IMPROVED, WORSE, SAME, or NEW ISSUE so we can update your case correctly."
      : "Kamusta po. Huli na po itong follow-up bago namin i-review ang case. Maaari po bang sumagot ng GUMANDA, LUMALA, GANON PA RIN, o BAGONG PROBLEMA para tama ang aming update?";
  }

  if (message.urgency === "high") {
    return useEnglish
      ? "Hello. How is the situation in your field now? Reply IMPROVED, WORSE, or SAME so we can escalate quickly if needed."
      : "Kamusta na po ang sitwasyon sa inyong bukid? Pakisagot po kung GUMANDA, LUMALA, o GANON PA RIN upang ma-escalate agad namin kung kailangan.";
  }

  return useEnglish
    ? "Hello. Did the earlier advice help? Reply IMPROVED, SAME, WORSE, or NEW ISSUE if you still need guidance."
    : "Kamusta po. Nakatulong po ba ang naunang payo? Maaari kayong sumagot ng GUMANDA, GANON PA RIN, LUMALA, o BAGONG PROBLEMA kung kailangan ninyo pa ng gabay.";
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
  const nextAttemptCount = (input.message.followUpAttemptCount ?? 0) + 1;
  const shouldStop = nextAttemptCount >= MAX_FOLLOW_UP_ATTEMPTS;
  const updatedMessage: SmsMessage = {
    ...input.message,
    followUpSentAt: timestamp,
    followUpLastReminderAt: timestamp,
    followUpAttemptCount: nextAttemptCount,
    followUpStopReason: shouldStop
      ? "Naabot na ang maximum follow-up reminders nang walang final outcome. Kailangan na ng manual review o administrative closeout."
      : undefined,
    followUpOutcome: shouldStop ? "no_response" : input.message.followUpOutcome,
    followUpDueAt: getNextFollowUpDueAt(timestamp, input.message, nextAttemptCount),
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
      details: `Nagpadala ng follow-up SMS #${nextAttemptCount} para kay ${updatedMessage.farmerName}.`,
      category: "automation",
      severity: shouldStop ? "warning" : "info",
    }),
    logbookEntry: {
      id: `LOG${Date.now()}-${updatedMessage.id}`,
      farmerId: updatedMessage.farmerId,
      timestamp,
      type: "Payo",
      title: shouldStop ? "Final follow-up SMS" : "Follow-up SMS",
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
