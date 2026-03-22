import { createAuditEntry } from "@/lib/services/audit-service";
import { sendOutboundMessage } from "@/lib/services/outbound-sms-service";
import type { LogbookEntry, SmsMessage } from "@/lib/types";
import type { SmsProvider } from "@/lib/providers/sms/types";

function normalizeReply(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function includesAny(value: string, terms: string[]) {
  return terms.some((term) => value === term || value.startsWith(`${term} `) || value.includes(` ${term} `));
}

function extractCaseId(value: string) {
  return value.match(/\bCASE-[A-Z0-9-]+\b/i)?.[0]?.toUpperCase();
}

export function buildFarmerResolutionConfirmationBody(message: SmsMessage) {
  const caseId = message.caseId ?? message.id;
  if (message.detectedLanguage === "English") {
    return `Lingkod-Ani ${caseId}: The barangay team marked your concern as ready for closure. Please reply YES if the issue is already okay, or NO if you still need additional help.`;
  }

  return `Lingkod-Ani ${caseId}: Minarkahan na po ng barangay team na handa nang isara ang inyong concern. Pakireply po ng YES kung okay na, o NO kung kailangan pa po ninyo ng dagdag na tulong.`;
}

export function parseFarmerResolutionConfirmationReply(message: string) {
  const normalized = normalizeReply(message);
  const caseId = extractCaseId(message);

  if (!normalized) {
    return null;
  }

  if (includesAny(normalized, ["yes", "oo", "opo", "ok", "okay", "ayos na", "pwede na", "resolved"])) {
    return {
      status: "confirmed_by_farmer" as const,
      caseId,
    };
  }

  if (includesAny(normalized, ["no", "hindi", "di pa", "hindi pa", "not yet", "kulang pa", "hindi okay"])) {
    return {
      status: "reopened" as const,
      caseId,
    };
  }

  return null;
}

export async function requestFarmerResolutionConfirmation(input: {
  message: SmsMessage;
  provider: SmsProvider;
  providerName: string;
  actorName?: string;
  note?: string;
  now?: number;
}) {
  const timestamp = new Date(input.now ?? Date.now()).toISOString();
  const body = buildFarmerResolutionConfirmationBody(input.message);
  const updatedMessage: SmsMessage = {
    ...input.message,
    caseStatus: input.message.assignedTo ? "assigned" : "monitoring",
    caseOutcomeStatus: "resolved",
    caseOutcomeSummary:
      input.note?.trim() ||
      input.message.caseOutcomeSummary ||
      "Minarkahang handa nang isara. Hinihintay ang kumpirmasyon ng magsasaka.",
    caseOutcomeUpdatedAt: timestamp,
    caseOutcomeUpdatedBy: input.actorName ?? "Barangay team",
    closedAt: undefined,
    resolutionNote: input.note?.trim() || input.message.resolutionNote,
    resolutionConfirmationStatus: "awaiting_farmer",
    resolutionConfirmationRequestedAt: timestamp,
    resolutionConfirmedAt: undefined,
    resolutionConfirmedBy: undefined,
    resolutionConfirmationNote: "Nagpadala ng SMS confirmation sa magsasaka bago tuluyang isara ang case.",
  };
  const outboundRecord = await sendOutboundMessage({
    sourceMessage: updatedMessage,
    body,
    provider: input.provider,
    providerName: input.providerName,
    audience: "farmer",
    purpose: "resolution_confirmation",
  });
  const caseId = updatedMessage.caseId ?? updatedMessage.id;

  return {
    updatedMessage,
    outboundRecord,
    auditLog: createAuditEntry({
      id: `AUD${Date.now()}-RESOLUTION-CONFIRM`,
      timestamp,
      user: input.actorName ?? "system",
      action: "REQUEST_SMS_CASE_CONFIRMATION",
      details: `Nagpadala ng resolution confirmation SMS para sa ${caseId}.`,
    }),
    logbookEntry: {
      id: `LOG${Date.now()}-${updatedMessage.id}-RESOLUTION-CONFIRM`,
      farmerId: updatedMessage.farmerId,
      timestamp,
      type: "Payo",
      title: "Kumpirmasyon bago isara ang case",
      description: body,
    } satisfies LogbookEntry,
  };
}

export function applyFarmerResolutionConfirmation(input: {
  message: SmsMessage;
  confirmationStatus: "confirmed_by_farmer" | "reopened";
  replyBody: string;
  now?: number;
}) {
  const timestamp = new Date(input.now ?? Date.now()).toISOString();
  const isConfirmed = input.confirmationStatus === "confirmed_by_farmer";
  const replySummary = input.replyBody.trim();

  const updatedMessage: SmsMessage = {
    ...input.message,
    caseStatus: isConfirmed ? "closed" : input.message.assignedTo ? "assigned" : "monitoring",
    closedAt: isConfirmed ? timestamp : undefined,
    caseOutcomeStatus: isConfirmed ? "resolved" : "needs_follow_up",
    caseOutcomeSummary:
      isConfirmed
        ? "Kinumpirma ng magsasaka sa SMS na okay na ang concern."
        : "Hindi pa kumpirmadong okay ang concern; ibinalik sa follow-up queue matapos tumugon ang magsasaka.",
    caseOutcomeUpdatedAt: timestamp,
    caseOutcomeUpdatedBy: "Farmer SMS",
    resolutionConfirmationStatus: input.confirmationStatus,
    resolutionConfirmedAt: timestamp,
    resolutionConfirmedBy: "Farmer SMS",
    resolutionConfirmationNote: replySummary || (isConfirmed ? "YES" : "NO"),
    followUpDueAt: isConfirmed ? input.message.followUpDueAt : timestamp,
  };

  return {
    updatedMessage,
    auditLog: createAuditEntry({
      id: `AUD${Date.now()}-FARMER-CONFIRM`,
      timestamp,
      user: "Farmer SMS",
      action: isConfirmed ? "FARMER_CONFIRMED_CASE_RESOLUTION" : "FARMER_REOPENED_CASE",
      details: `${updatedMessage.caseId ?? updatedMessage.id}: ${replySummary || (isConfirmed ? "YES" : "NO")}`,
    }),
    logbookEntry: {
      id: `LOG${Date.now()}-${updatedMessage.id}-FARMER-CONFIRM`,
      farmerId: updatedMessage.farmerId,
      timestamp,
      type: "SMS",
      title: isConfirmed ? "Kinumpirma ng magsasaka" : "Humiling pa ng dagdag na follow-up",
      description: replySummary || (isConfirmed ? "YES" : "NO"),
    } satisfies LogbookEntry,
  };
}
