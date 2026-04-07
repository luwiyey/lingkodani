import { isWithinQuietHours } from "@/lib/system-settings";
import type { SmsMessage, SystemSettings } from "@/lib/types";

export type UrgentPushPolicyReason =
  | "allowed"
  | "not_urgent"
  | "duplicate_cooldown"
  | "quiet_hours";

export type UrgentPushPolicyDecision = {
  shouldSend: boolean;
  reason: UrgentPushPolicyReason;
  suppressedUntil?: string;
};

function addMinutes(isoTimestamp: string, minutes: number) {
  return new Date(new Date(isoTimestamp).getTime() + minutes * 60 * 1000).toISOString();
}

export function shouldSendUrgentCasePush(message: SmsMessage) {
  return (
    message.urgency === "high" ||
    message.parsedIntent === "EMERGENCY" ||
    message.safetyFlag === "High"
  );
}

export function isCriticalUrgentPush(message: SmsMessage) {
  return message.parsedIntent === "EMERGENCY" || message.safetyFlag === "High";
}

export function getUrgentPushPolicyDecision(input: {
  message: SmsMessage;
  settings: SystemSettings;
  now: string;
}): UrgentPushPolicyDecision {
  const { message, settings, now } = input;

  if (!shouldSendUrgentCasePush(message)) {
    return {
      shouldSend: false,
      reason: "not_urgent",
    };
  }

  const cooldownMinutes = Math.max(5, settings.notificationPolicy.urgentPushCooldownMinutes);
  const lastSentAt = message.urgentPushLastSentAt
    ? new Date(message.urgentPushLastSentAt).getTime()
    : Number.NaN;
  const nowMs = new Date(now).getTime();

  if (!Number.isNaN(lastSentAt) && nowMs - lastSentAt < cooldownMinutes * 60 * 1000) {
    return {
      shouldSend: false,
      reason: "duplicate_cooldown",
      suppressedUntil: addMinutes(message.urgentPushLastSentAt!, cooldownMinutes),
    };
  }

  if (
    settings.notificationPolicy.quietHoursEnabled &&
    !isCriticalUrgentPush(message) &&
    isWithinQuietHours(now, settings)
  ) {
    return {
      shouldSend: false,
      reason: "quiet_hours",
    };
  }

  return {
    shouldSend: true,
    reason: "allowed",
  };
}
