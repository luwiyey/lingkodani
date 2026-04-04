import type { SendSmsInput, SmsProvider } from "@/lib/providers/sms/types";

export const mockSmsProvider: SmsProvider = {
  async sendMessage(input: SendSmsInput) {
    void input;
    return {
      status: "sent",
      providerMessageId: `mock-${Date.now()}`,
      errorMessage: undefined,
    };
  },
};
