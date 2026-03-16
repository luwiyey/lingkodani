import { createAuditEntry } from "@/lib/services/audit-service";
import { ensureFollowUpDueAt } from "@/lib/services/follow-up-service";
import { createInboundSmsRecord, type CreateInboundSmsInput } from "@/lib/services/inbound-sms-service";
import type { AuditLog, Farmer, SmsMessage } from "@/lib/types";

export type InboundWorkflowResult = {
  message: SmsMessage;
  auditLog: AuditLog;
  newFarmer?: Farmer;
  farmerUpdates: Array<{
    farmerId: string;
    updates: Partial<Farmer>;
  }>;
};

export type StatusWorkflowResult = {
  nextMessage: SmsMessage | null;
  auditLog?: AuditLog;
};

export function processInboundSms(input: CreateInboundSmsInput): InboundWorkflowResult {
  const created = createInboundSmsRecord(input);
  const timestamp = created.message.timestamp;

  return {
    message: created.message,
    auditLog: createAuditEntry({
      id: `AUD${Date.now()}`,
      timestamp,
      user: "system",
      action: "INBOUND_SMS_RECEIVED",
      details: created.newFarmer
        ? `Tumanggap ng bagong SMS mula sa ${created.message.farmerName} (${created.message.phone}) at gumawa ng pending farmer record.`
        : `Tumanggap ng bagong SMS mula sa ${created.message.farmerName} (${created.message.phone}).`,
    }),
    newFarmer: created.newFarmer,
    farmerUpdates: created.matchedFarmerId
      ? [
          {
            farmerId: created.matchedFarmerId,
            updates: { lastSmsActivity: timestamp },
          },
        ]
      : [],
  };
}

export function applySmsStatusUpdate(input: {
  currentMessage: SmsMessage | null;
  updates: Partial<Pick<SmsMessage, "status" | "aiAdvice" | "parsedIntent" | "urgency" | "safetyFlag" | "tone">>;
  actorName?: string;
  timestamp?: string;
}): StatusWorkflowResult {
  const current = input.currentMessage;

  if (!current) {
    return { nextMessage: null };
  }

  const nextStatus = input.updates.status ?? current.status;
  const isFarmerFacingReply = nextStatus === "approved" || nextStatus === "replied";
  const respondedAt =
    isFarmerFacingReply ? input.timestamp ?? new Date().toISOString() : current.respondedAt;

  const nextMessage: SmsMessage = {
    ...current,
    ...input.updates,
    respondedAt,
    assignedTo: current.assignedTo ?? input.actorName ?? current.assignedTo,
    assignedAt: current.assignedAt ?? (isFarmerFacingReply ? respondedAt : current.assignedAt),
    caseStatus:
      isFarmerFacingReply
        ? current.closedAt
          ? "closed"
          : "monitoring"
        : nextStatus === "rejected"
          ? current.assignedTo
            ? "assigned"
            : current.caseStatus
        : current.caseStatus,
    followUpDueAt:
      isFarmerFacingReply
        ? ensureFollowUpDueAt({
            ...current,
            ...input.updates,
            respondedAt,
          } as SmsMessage)
        : current.followUpDueAt,
  };

  if (nextStatus === current.status) {
    return { nextMessage };
  }

  const editedAdvice =
    typeof input.updates.aiAdvice === "string" && input.updates.aiAdvice !== current.aiAdvice;

  const action =
    nextStatus === "approved"
      ? editedAdvice
        ? "EDITED_REPLY_SENT"
        : "APPROVE_AI_REPLY"
      : nextStatus === "replied"
        ? "MANUAL_REPLY_SENT"
        : nextStatus === "rejected"
          ? "REJECT_AI_REPLY"
          : "UPDATE_SMS_STATUS";

  return {
    nextMessage,
    auditLog: createAuditEntry({
      id: `AUD${Date.now()}`,
      timestamp: respondedAt,
      user: input.actorName ?? "Brgy. Admin",
      action,
      details: `${current.farmerName}: ${nextStatus}`,
    }),
  };
}
