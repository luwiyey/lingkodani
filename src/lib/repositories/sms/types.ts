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
    | "parsedIntent"
    | "urgency"
    | "safetyFlag"
    | "tone"
  >
>;

export interface SmsRepository {
  listMessages(): Promise<SmsMessage[]>;
  createInboundMessage(input: NewSmsRecordInput): Promise<SmsMessage>;
  updateMessage(id: string, updates: SmsMessageUpdate): Promise<SmsMessage | null>;
}
