import { getUrgentPushPolicyDecision } from "@/lib/mobile-push-policy";
import { defaultSystemSettings } from "@/lib/system-settings";
import type { SmsMessage } from "@/lib/types";

const baseMessage: SmsMessage = {
  id: "SMS-PUSH-1",
  farmerId: "FARM-1",
  farmerName: "Juan Dela Cruz",
  phone: "+639171234567",
  message: "May matinding peste sa palay at kailangan ng agarang tulong.",
  timestamp: "2025-01-05T12:00:00.000Z",
  parsedIntent: "PEST_DISEASE",
  urgency: "high",
  status: "approved",
  aiAdvice: "Maghintay ng field validation.",
  aiConfidence: 0.82,
  safetyFlag: "Medium",
};

describe("mobile-push-service policy", () => {
  it("suppresses duplicate urgent push attempts inside cooldown", () => {
    const decision = getUrgentPushPolicyDecision({
      message: {
        ...baseMessage,
        urgentPushLastSentAt: "2025-01-05T12:10:00.000Z",
      },
      settings: {
        ...defaultSystemSettings,
        notificationPolicy: {
          ...defaultSystemSettings.notificationPolicy,
          urgentPushCooldownMinutes: 30,
        },
      },
      now: "2025-01-05T12:20:00.000Z",
    });

    expect(decision.shouldSend).toBe(false);
    expect(decision.reason).toBe("duplicate_cooldown");
    expect(decision.suppressedUntil).toBe("2025-01-05T12:40:00.000Z");
  });

  it("suppresses non-critical urgent push during quiet hours", () => {
    const decision = getUrgentPushPolicyDecision({
      message: baseMessage,
      settings: {
        ...defaultSystemSettings,
        notificationPolicy: {
          ...defaultSystemSettings.notificationPolicy,
          quietHoursEnabled: true,
          quietHoursStart: "21:00",
          quietHoursEnd: "06:00",
        },
      },
      now: "2025-01-05T22:30:00+08:00",
    });

    expect(decision.shouldSend).toBe(false);
    expect(decision.reason).toBe("quiet_hours");
  });

  it("allows emergency pushes even during quiet hours", () => {
    const decision = getUrgentPushPolicyDecision({
      message: {
        ...baseMessage,
        parsedIntent: "EMERGENCY",
        safetyFlag: "High",
      },
      settings: {
        ...defaultSystemSettings,
        notificationPolicy: {
          ...defaultSystemSettings.notificationPolicy,
          quietHoursEnabled: true,
          quietHoursStart: "21:00",
          quietHoursEnd: "06:00",
        },
      },
      now: "2025-01-05T22:30:00+08:00",
    });

    expect(decision.shouldSend).toBe(true);
    expect(decision.reason).toBe("allowed");
  });
});
