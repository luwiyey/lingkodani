import type { SendSmsInput, SmsProvider } from "@/lib/providers/sms/types";
import { getClientAuth } from "@/lib/firebase/auth-client";

export const liveSmsProvider: SmsProvider = {
  async sendMessage(input: SendSmsInput) {
    const auth = getClientAuth();
    const idToken = await auth.currentUser?.getIdToken();

    if (!idToken) {
      return {
        status: "failed",
        errorMessage: "No authenticated live user session is available.",
      };
    }

    const response = await fetch("/api/outbound-sms/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify(input),
    });

    const payload = await response.json().catch(() => ({}));

    return {
      status: response.ok ? payload.status ?? "sent" : "failed",
      providerMessageId: payload.providerMessageId,
      errorMessage: response.ok ? undefined : payload.error ?? "Live SMS send failed.",
    };
  },
};
