export type OutboundSmsStatus = "queued" | "sent" | "failed";

export type SendSmsInput = {
  to: string;
  body: string;
};

export type SendSmsResult = {
  status: OutboundSmsStatus;
  providerMessageId?: string;
  errorMessage?: string;
};

export interface SmsProvider {
  sendMessage(input: SendSmsInput): Promise<SendSmsResult>;
}
