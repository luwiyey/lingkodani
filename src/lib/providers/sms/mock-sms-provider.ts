import type { SendSmsInput, SmsProvider } from "@/lib/providers/sms/types";

export const mockSmsProvider: SmsProvider = {
  async sendMessage(input: SendSmsInput) {
    return {
      status: "sent",
      providerMessageId: `mock-${Date.now()}`,
      errorMessage: undefined,
    };
  },
};
