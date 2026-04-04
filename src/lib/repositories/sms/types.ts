import type { SmsMessage } from "@/lib/types";

export type NewSmsRecordInput = Omit<SmsMessage, "id"> & {
  id?: string;
};

export type SmsMessageUpdate = Partial<
  Pick<
    SmsMessage,
    | "status"
    | "aiAdvice"
    | "respondedAt"
    | "autoReplyEligibleAt"
    | "autoReplySentAt"
    | "officialReminderRecipientName"
    | "officialReminderRecipientPhone"
    | "officialReminderDueAt"
    | "officialReminderLastSentAt"
    | "officialReminderCount"
    | "clarificationNeeded"
    | "clarificationQuestion"
    | "caseStatus"
    | "assignedTo"
    | "assignedAt"
    | "slaDueAt"
    | "escalatedAt"
    | "registrationRequired"
    | "followUpDueAt"
    | "followUpSentAt"
    | "closedAt"
    | "resolutionNote"
    | "caseOutcomeStatus"
    | "caseOutcomeSummary"
    | "caseOutcomeUpdatedAt"
    | "caseOutcomeUpdatedBy"
    | "farmerId"
    | "farmerName"
    | "caseId"
    | "parsedIntent"
    | "urgency"
    | "safetyFlag"
    | "tone"
    | "threadConfidence"
    | "threadReason"
    | "threadReviewStatus"
    | "threadReviewedAt"
    | "threadReviewedBy"
    | "threadReviewNote"
  >
>;

export interface SmsRepository {
  listMessages(): Promise<SmsMessage[]>;
  createInboundMessage(input: NewSmsRecordInput): Promise<SmsMessage>;
  updateMessage(id: string, updates: SmsMessageUpdate): Promise<SmsMessage | null>;
}
