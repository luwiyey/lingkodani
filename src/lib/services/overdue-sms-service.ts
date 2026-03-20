import type { SmsProvider } from "@/lib/providers/sms/types";
import { createAutoReplyArtifacts, isAutoReplyOverdue } from "@/lib/services/auto-reply-service";
import { sendOutboundMessage } from "@/lib/services/outbound-sms-service";
import { defaultSystemSettings } from "@/lib/system-settings";
import type { SmsMessage, SystemSettings } from "@/lib/types";

export async function processOverdueSmsMessage(input: {
  message: SmsMessage;
  settings?: SystemSettings;
  provider: SmsProvider;
  providerName: string;
  actorName?: string;
  now?: number;
}) {
  const settings = input.settings ?? defaultSystemSettings;

  if (!isAutoReplyOverdue(input.message, input.now, settings)) {
    return null;
  }

  const artifacts = createAutoReplyArtifacts({
    message: input.message,
    settings,
    actorName: input.actorName ?? "system",
  });
  const outboundRecord = await sendOutboundMessage({
    sourceMessage: artifacts.updatedMessage,
    body: artifacts.body,
    provider: input.provider,
    providerName: input.providerName,
    audience: "farmer",
    purpose: "auto_reply",
  });

  return {
    ...artifacts,
    outboundRecord,
  };
}
