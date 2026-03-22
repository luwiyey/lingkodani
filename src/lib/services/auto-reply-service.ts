import { createAuditEntry } from "@/lib/services/audit-service";
import { defaultSystemSettings, getSystemTemplate, isWithinReplyWindow, replaceSystemTemplateTokens } from "@/lib/system-settings";
import type { LogbookEntry, SmsMessage, SystemSettings } from "@/lib/types";

function addMilliseconds(isoTimestamp: string, milliseconds: number) {
  return new Date(new Date(isoTimestamp).getTime() + milliseconds).toISOString();
}

export function getAutoReplyDelayMs(settings: SystemSettings = defaultSystemSettings) {
  return Math.max(1, settings.autoReplyTimeoutMinutes) * 60 * 1000;
}

export function getAutoReplyEligibleAt(
  timestamp: string,
  settings: SystemSettings = defaultSystemSettings
) {
  if (!settings.autoReplyEnabled) {
    return undefined;
  }

  return addMilliseconds(timestamp, getAutoReplyDelayMs(settings));
}

function appendAfterHoursNotice(body: string, message: SmsMessage, settings: SystemSettings) {
  if (isWithinReplyWindow(message.timestamp, settings)) {
    return body;
  }

  return `${body} Ang regular na oras ng barangay agriculture team ay ${settings.replyStartTime} hanggang ${settings.replyEndTime}. Para sa agarang concern sa labas ng oras na ito, makipag-ugnayan sa ${settings.adminPhone}.`;
}

function appendIdentityPrompt(body: string, message: SmsMessage) {
  if (!message.identityDetailsNeeded || !message.identityPrompt?.trim()) {
    return body;
  }

  if (body.includes(message.identityPrompt.trim())) {
    return body;
  }

  return `${body} ${message.identityPrompt.trim()}`.trim();
}

export function isAutoReplyOverdue(
  message: SmsMessage,
  now = Date.now(),
  settings: SystemSettings = defaultSystemSettings
) {
  if (!settings.autoReplyEnabled) return false;
  if (message.status !== "pending_approval") return false;
  if (message.autoReplySentAt) return false;
  if (!message.autoReplyEligibleAt) return false;

  return new Date(message.autoReplyEligibleAt).getTime() <= now;
}

export function buildAutoReplyBody(
  message: SmsMessage,
  settings: SystemSettings = defaultSystemSettings
) {
  const useEnglish = message.detectedLanguage === "English";
  let baseBody: string;

  if (message.clarificationNeeded && message.clarificationQuestion) {
    const investigationTemplate = getSystemTemplate(settings, "investigation");
    baseBody = useEnglish
      ? message.clarificationQuestion
      : investigationTemplate
        ? `${replaceSystemTemplateTokens(investigationTemplate.text, settings)} ${message.clarificationQuestion}`.trim()
        : message.clarificationQuestion;
    return appendAfterHoursNotice(appendIdentityPrompt(baseBody, message), message, settings);
  }

  if (message.urgency === "high" || message.parsedIntent === "EMERGENCY") {
    const emergencyTemplate = getSystemTemplate(settings, "emergency");
    baseBody = useEnglish
      ? `We have received your urgent report. While waiting for the AEW, please prioritize safety and avoid hazardous areas in the field. The barangay team will send follow-up guidance as soon as possible.`
      : emergencyTemplate
      ? replaceSystemTemplateTokens(emergencyTemplate.text, settings)
      : `Natanggap ang inyong agarang ulat. Habang hinihintay ang AEW, unahin ang kaligtasan ng tao at iwasan muna ang mapanganib na bahagi ng bukid. Magpapadala ang barangay ng follow-up sa lalong madaling panahon.`;

    return appendAfterHoursNotice(appendIdentityPrompt(baseBody, message), message, settings);
  }

  const confirmationTemplate = getSystemTemplate(settings, "confirmation");
  const resolutionTemplate = getSystemTemplate(settings, "resolution");

  switch (message.parsedIntent) {
    case "PEST_DISEASE":
      baseBody =
        useEnglish
          ? "We have received your report about a possible pest or disease issue. Please avoid applying chemicals until the barangay agriculture team has reviewed it."
          : confirmationTemplate
          ? replaceSystemTemplateTokens(confirmationTemplate.text, settings)
          : "Natanggap ang inyong ulat tungkol sa posibleng peste o sakit. Huwag munang mag-apply ng kemikal hangga't walang review mula sa barangay agriculture team. Magpapadala kami ng kasunod na payo sa lalong madaling panahon.";
      break;
    case "REQUEST":
      baseBody =
        useEnglish
          ? "We have received your request. We are checking the available equipment or supplies and will send the next update once the barangay team reviews it."
          : resolutionTemplate
          ? replaceSystemTemplateTokens(resolutionTemplate.text, settings)
          : "Natanggap ang inyong kahilingan. Sinusuri na namin ang available na kagamitan o supply at magpapadala kami ng susunod na update kapag na-review na ito ng barangay team.";
      break;
    case "WEATHER_HELP":
      baseBody =
        useEnglish
          ? "We have received your report about weather or water conditions. Please continue monitoring your area while waiting for the next advisory from the barangay team."
          : confirmationTemplate
          ? replaceSystemTemplateTokens(confirmationTemplate.text, settings)
          : "Natanggap ang inyong ulat tungkol sa panahon o kondisyon ng tubig. Hinihiling namin na bantayan ang inyong lugar at hintayin ang kasunod na abiso mula sa barangay team.";
      break;
    case "REGISTER":
      baseBody =
        useEnglish
          ? "We have received your registration request. The barangay team will review the details and send confirmation after validation."
          : confirmationTemplate
          ? replaceSystemTemplateTokens(confirmationTemplate.text, settings)
          : "Opo, natanggap po ang inyong registration request. Susuriin po ng barangay team ang detalye at magpapadala po kami ng kumpirmasyon pagkatapos ng validation.";
      break;
    default:
      baseBody =
        useEnglish
          ? "We have received your message and placed it in the queue for barangay agriculture review. We will send a follow-up as soon as possible."
          : confirmationTemplate
          ? replaceSystemTemplateTokens(confirmationTemplate.text, settings)
          : "Natanggap namin ang inyong mensahe at naka-queue na ito para sa agarang review ng barangay agriculture team. Magpapadala kami ng follow-up sa lalong madaling panahon.";
      break;
  }

  return appendAfterHoursNotice(appendIdentityPrompt(baseBody, message), message, settings);
}

export function createAutoReplyArtifacts(input: {
  message: SmsMessage;
  settings?: SystemSettings;
  actorName?: string;
  timestamp?: string;
}) {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const settings = input.settings ?? defaultSystemSettings;
  const updatedMessage: SmsMessage = {
    ...input.message,
    autoReplyEligibleAt: input.message.autoReplyEligibleAt ?? getAutoReplyEligibleAt(input.message.timestamp, settings),
    autoReplySentAt: timestamp,
    respondedAt: input.message.respondedAt ?? timestamp,
    escalatedAt: input.message.urgency === "high" ? (input.message.escalatedAt ?? timestamp) : input.message.escalatedAt,
    caseStatus: input.message.urgency === "high" ? "escalated" : input.message.caseStatus,
  };
  const body = buildAutoReplyBody(updatedMessage, settings);

  return {
    updatedMessage,
    body,
    auditLog: createAuditEntry({
      id: `AUD${Date.now()}`,
      timestamp,
      user: input.actorName ?? "system",
      action: "AUTO_TIMEOUT_REPLY_SENT",
      details: `Awtomatikong nagpadala ng fallback reply para kay ${updatedMessage.farmerName} matapos lumampas sa SLA.`,
    }),
    logbookEntry: {
      id: `LOG${Date.now()}-${updatedMessage.id}`,
      farmerId: updatedMessage.farmerId,
      timestamp,
      type: "Payo",
      title: "Awtomatikong fallback reply",
      description: body,
    } satisfies LogbookEntry,
  };
}
