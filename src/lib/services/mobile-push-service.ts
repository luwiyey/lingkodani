import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore, getServerMessaging } from "@/lib/firebase/server";
import { getUrgentPushPolicyDecision } from "@/lib/mobile-push-policy";
import { getServerSystemSettings } from "@/lib/server/system-settings";
import { buildOfficialReminderBody } from "@/lib/services/staff-sms-service";
import { sendLiveSms } from "@/lib/services/server-live-outbound-sms-service";
import {
  recordRuntimeHealthFailure,
  recordRuntimeHealthSuccess,
  recordRuntimeHealthWarning,
} from "@/lib/system-health";
import type {
  MobileDeviceToken,
  MobileDeviceTokenPlatform,
  SmsMessage,
  SystemSettings,
  User,
  UserRole,
} from "@/lib/types";

export const MOBILE_PUSH_STAFF_TOPIC = "lingkod_ani_staff_mobile";

const MOBILE_PUSH_RUNTIME_HEALTH_ID = "mobile_push";
const MOBILE_PUSH_RUNTIME_HEALTH_LABEL = "Mobile Push Notifications";

function withoutUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

function buildMobileDeviceTokenId(userId: string, token: string) {
  return Buffer.from(`${userId}:${token}`, "utf8").toString("base64url");
}

function summarizeCaseMessage(value: string, maxLength = 110) {
  const compact = value.replace(/\s+/g, " ").trim();

  if (compact.length <= maxLength) {
    return compact;
  }

  return `${compact.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
}

function normalizeName(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function buildUrgentPushTitle(message: SmsMessage) {
  const farmerName = message.farmerName?.trim() || "Farmer concern";
  return `Urgent case: ${farmerName}`;
}

function buildUrgentPushBody(message: SmsMessage) {
  const caseLabel = message.caseId?.trim() || message.id;
  const summary = summarizeCaseMessage(message.message);
  return `${caseLabel} - ${summary}`;
}

async function listRegisteredDeviceDocsForToken(token: string) {
  const db = getServerFirestore();
  const snapshot = await db
    .collection(firebaseCollections.mobileDeviceTokens)
    .where("token", "==", token)
    .get();

  return snapshot.docs;
}

async function persistPushState(message: SmsMessage, updates: Partial<SmsMessage>) {
  if (!message.id) {
    return;
  }

  await getServerFirestore()
    .collection(firebaseCollections.smsMessages)
    .doc(message.id)
    .set(withoutUndefined(updates), { merge: true });
}

async function listFallbackUsers() {
  const db = getServerFirestore();
  const snapshot = await db.collection(firebaseCollections.users).get();

  return snapshot.docs
    .map((documentSnapshot) => ({
      id: documentSnapshot.id,
      ...(documentSnapshot.data() as User),
    }))
    .filter((user) => user.phone && user.status !== "disabled");
}

async function findFallbackRecipient(input: {
  message: SmsMessage;
  settings: SystemSettings;
}) {
  const users = await listFallbackUsers();
  const assigned = users.find(
    (user) => normalizeName(user.name) === normalizeName(input.message.assignedTo)
  );

  if (assigned?.phone) {
    return {
      name: assigned.name,
      phone: assigned.phone,
      source: "assigned_staff" as const,
    };
  }

  const prioritized = users.find((user) =>
    ["owner", "resolver", "supervisor"].includes(user.assignmentRole ?? "")
  );

  if (prioritized?.phone) {
    return {
      name: prioritized.name,
      phone: prioritized.phone,
      source: "staff_roster" as const,
    };
  }

  if (input.settings.adminPhone?.trim()) {
    return {
      name: "Barangay agriculture hotline",
      phone: input.settings.adminPhone.trim(),
      source: "admin_hotline" as const,
    };
  }

  return null;
}

async function sendStaffSmsFallback(input: {
  message: SmsMessage;
  settings: SystemSettings;
}) {
  const recipient = await findFallbackRecipient(input);

  if (!recipient?.phone) {
    return {
      sent: false,
      reason: "no_staff_sms_recipient",
    } as const;
  }

  const body = `PUSH fallback: ${buildOfficialReminderBody(input.message)}`;
  const result = await sendLiveSms({
    to: recipient.phone,
    body,
  });

  if (result.status === "failed") {
    return {
      sent: false,
      reason: result.errorMessage ?? "staff_sms_fallback_failed",
      recipient,
    } as const;
  }

  return {
    sent: true,
    recipient,
    providerMessageId: result.providerMessageId,
  } as const;
}

export async function registerMobilePushToken(input: {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
  token: string;
  platform?: MobileDeviceTokenPlatform;
  deviceLabel?: string;
}) {
  const token = input.token.trim();

  if (!token) {
    throw new Error("Missing push token.");
  }

  const db = getServerFirestore();
  const messaging = getServerMessaging();
  const now = new Date().toISOString();
  const documentId = buildMobileDeviceTokenId(input.userId, token);
  const payload: MobileDeviceToken = {
    id: documentId,
    userId: input.userId,
    email: input.email.trim().toLowerCase(),
    name: input.name.trim(),
    role: input.role,
    token,
    platform: input.platform ?? "unknown",
    topic: MOBILE_PUSH_STAFF_TOPIC,
    deviceLabel: input.deviceLabel?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
    lastSeenAt: now,
  };

  try {
    const existingDeviceDocs = await listRegisteredDeviceDocsForToken(token);

    await Promise.all([
      db
        .collection(firebaseCollections.mobileDeviceTokens)
        .doc(documentId)
        .set(withoutUndefined(payload), { merge: true }),
      messaging.subscribeToTopic([token], MOBILE_PUSH_STAFF_TOPIC),
      ...existingDeviceDocs
        .filter((documentSnapshot) => documentSnapshot.id !== documentId)
        .map((documentSnapshot) => documentSnapshot.ref.delete()),
    ]);

    await recordRuntimeHealthSuccess(
      MOBILE_PUSH_RUNTIME_HEALTH_ID,
      MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
      {
        action: "register",
        userId: input.userId,
        platform: payload.platform,
      }
    );

    return {
      id: documentId,
      topic: MOBILE_PUSH_STAFF_TOPIC,
    };
  } catch (error) {
    await recordRuntimeHealthFailure(
      MOBILE_PUSH_RUNTIME_HEALTH_ID,
      MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
      error,
      {
        action: "register",
        userId: input.userId,
      }
    );
    throw error;
  }
}

export async function unregisterMobilePushToken(input: {
  userId: string;
  token: string;
}) {
  const token = input.token.trim();

  if (!token) {
    return { removed: false };
  }

  const messaging = getServerMessaging();
  const matchingDocs = await listRegisteredDeviceDocsForToken(token);

  try {
    await Promise.all([
      messaging.unsubscribeFromTopic([token], MOBILE_PUSH_STAFF_TOPIC),
      ...matchingDocs
        .filter(
          (documentSnapshot) =>
            (documentSnapshot.data() as Partial<MobileDeviceToken>).userId ===
            input.userId
        )
        .map((documentSnapshot) => documentSnapshot.ref.delete()),
    ]);

    await recordRuntimeHealthSuccess(
      MOBILE_PUSH_RUNTIME_HEALTH_ID,
      MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
      {
        action: "unregister",
        userId: input.userId,
      }
    );

    return { removed: true };
  } catch (error) {
    await recordRuntimeHealthFailure(
      MOBILE_PUSH_RUNTIME_HEALTH_ID,
      MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
      error,
      {
        action: "unregister",
        userId: input.userId,
      }
    );
    throw error;
  }
}

export async function sendUrgentCasePush(input: { message: SmsMessage }) {
  const { message } = input;
  const settings = await getServerSystemSettings();
  const now = new Date().toISOString();
  const policyDecision = getUrgentPushPolicyDecision({
    message,
    settings,
    now,
  });

  if (!policyDecision.shouldSend) {
    await persistPushState(message, {
      urgentPushLastStatus:
        policyDecision.reason === "duplicate_cooldown"
          ? "skipped_duplicate"
          : policyDecision.reason === "quiet_hours"
            ? "skipped_quiet_hours"
            : "skipped_not_urgent",
      urgentPushSuppressedUntil: policyDecision.suppressedUntil,
      urgentPushLastError: undefined,
    });

    await recordRuntimeHealthWarning(
      MOBILE_PUSH_RUNTIME_HEALTH_ID,
      MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
      {
        action: "urgent_case_broadcast",
        caseId: message.caseId ?? message.id,
        reason: policyDecision.reason,
        suppressedUntil: policyDecision.suppressedUntil,
      }
    );

    return {
      sent: false,
      skipped: true,
      reason: policyDecision.reason,
    };
  }

  try {
    const db = getServerFirestore();
    const deviceSnapshot = await db
      .collection(firebaseCollections.mobileDeviceTokens)
      .limit(1)
      .get();

    if (deviceSnapshot.empty) {
      const fallbackResult = settings.notificationPolicy.fallbackToStaffSms
        ? await sendStaffSmsFallback({ message, settings })
        : { sent: false, reason: "fallback_disabled" as const };
      const nextFailureCount = (message.urgentPushFailureCount ?? 0) + 1;

      await persistPushState(message, {
        urgentPushLastStatus: fallbackResult.sent
          ? "fallback_sms_sent"
          : "skipped_no_devices",
        urgentPushLastError: fallbackResult.sent
          ? undefined
          : "Walang registered mobile devices para sa urgent push.",
        urgentPushFailureCount: nextFailureCount,
        urgentPushFallbackSentAt: fallbackResult.sent
          ? now
          : message.urgentPushFallbackSentAt,
      });

      await recordRuntimeHealthWarning(
        MOBILE_PUSH_RUNTIME_HEALTH_ID,
        MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
        {
          action: "urgent_case_broadcast",
          caseId: message.caseId ?? message.id,
          reason: "no_registered_devices",
          fallbackAction: fallbackResult.sent
            ? "staff_sms_sent"
            : "fallback_needed",
          fallbackRecipient:
            "recipient" in fallbackResult && fallbackResult.recipient
              ? fallbackResult.recipient.phone
              : undefined,
          failureCount: nextFailureCount,
        }
      );

      return {
        sent: fallbackResult.sent,
        skipped: !fallbackResult.sent,
        reason: fallbackResult.sent
          ? "fallback_sms_sent"
          : "no_registered_devices",
      };
    }

    const messaging = getServerMessaging();
    const messageId = await messaging.send({
      topic: MOBILE_PUSH_STAFF_TOPIC,
      notification: {
        title: buildUrgentPushTitle(message),
        body: buildUrgentPushBody(message),
      },
      data: {
        type: "urgent_case",
        messageId: message.id,
        farmerId: message.farmerId ?? "",
        caseId: message.caseId ?? message.id,
        urgency: message.urgency,
        safetyFlag: message.safetyFlag,
        parsedIntent: message.parsedIntent,
      },
      android: {
        priority: "high",
        notification: {
          priority: "high",
          defaultSound: true,
          clickAction: "FLUTTER_NOTIFICATION_CLICK",
        },
      },
    });

    await persistPushState(message, {
      urgentPushLastSentAt: now,
      urgentPushLastStatus: "sent",
      urgentPushLastError: undefined,
      urgentPushFailureCount: 0,
      urgentPushSuppressedUntil: undefined,
      urgentPushLastProviderMessageId: messageId,
    });

    await recordRuntimeHealthSuccess(
      MOBILE_PUSH_RUNTIME_HEALTH_ID,
      MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
      {
        action: "urgent_case_broadcast",
        caseId: message.caseId ?? message.id,
        messageId,
        cooldownMinutes: settings.notificationPolicy.urgentPushCooldownMinutes,
      }
    );

    return {
      sent: true,
      messageId,
    };
  } catch (error) {
    const nextFailureCount = (message.urgentPushFailureCount ?? 0) + 1;
    const shouldFallback =
      settings.notificationPolicy.fallbackToStaffSms &&
      nextFailureCount >=
        Math.max(1, settings.notificationPolicy.maxConsecutivePushFailures);
    const fallbackResult = shouldFallback
      ? await sendStaffSmsFallback({ message, settings })
      : { sent: false, reason: "threshold_not_reached" as const };

    await persistPushState(message, {
      urgentPushLastStatus: fallbackResult.sent
        ? "fallback_sms_sent"
        : shouldFallback
          ? "fallback_needed"
          : "failed",
      urgentPushLastError:
        error instanceof Error ? error.message : String(error),
      urgentPushFailureCount: nextFailureCount,
      urgentPushFallbackSentAt: fallbackResult.sent
        ? now
        : message.urgentPushFallbackSentAt,
    });

    await recordRuntimeHealthFailure(
      MOBILE_PUSH_RUNTIME_HEALTH_ID,
      MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
      error,
      {
        action: "urgent_case_broadcast",
        caseId: message.caseId ?? message.id,
        failureCount: nextFailureCount,
        fallbackAction: fallbackResult.sent
          ? "staff_sms_sent"
          : shouldFallback
            ? "fallback_needed"
            : "none",
        fallbackRecipient:
          "recipient" in fallbackResult && fallbackResult.recipient
            ? fallbackResult.recipient.phone
            : undefined,
      }
    );

    if (shouldFallback) {
      await recordRuntimeHealthWarning(
        MOBILE_PUSH_RUNTIME_HEALTH_ID,
        MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
        {
          action: "urgent_case_push_fallback",
          caseId: message.caseId ?? message.id,
          fallbackAction: fallbackResult.sent
            ? "staff_sms_sent"
            : "fallback_needed",
          fallbackRecipient:
            "recipient" in fallbackResult && fallbackResult.recipient
              ? fallbackResult.recipient.phone
              : undefined,
          failureCount: nextFailureCount,
        }
      );
    }

    return {
      sent: fallbackResult.sent,
      skipped: false,
      reason: fallbackResult.sent
        ? "fallback_sms_sent"
        : error instanceof Error
          ? error.message
          : String(error),
    };
  }
}
