import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore, getServerMessaging } from "@/lib/firebase/server";
import {
  recordRuntimeHealthFailure,
  recordRuntimeHealthSuccess,
  recordRuntimeHealthWarning,
} from "@/lib/system-health";
import type {
  MobileDeviceToken,
  MobileDeviceTokenPlatform,
  SmsMessage,
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

function buildUrgentPushTitle(message: SmsMessage) {
  const farmerName = message.farmerName?.trim() || "Farmer concern";
  return `Urgent case: ${farmerName}`;
}

function buildUrgentPushBody(message: SmsMessage) {
  const caseLabel = message.caseId?.trim() || message.id;
  const summary = summarizeCaseMessage(message.message);
  return `${caseLabel} • ${summary}`;
}

async function listRegisteredDeviceDocsForToken(token: string) {
  const db = getServerFirestore();
  const snapshot = await db
    .collection(firebaseCollections.mobileDeviceTokens)
    .where("token", "==", token)
    .get();

  return snapshot.docs;
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
            (documentSnapshot.data() as Partial<MobileDeviceToken>).userId === input.userId
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

function shouldSendUrgentCasePush(message: SmsMessage) {
  return (
    message.urgency === "high" ||
    message.parsedIntent === "EMERGENCY" ||
    message.safetyFlag === "High"
  );
}

export async function sendUrgentCasePush(input: { message: SmsMessage }) {
  const { message } = input;

  if (!shouldSendUrgentCasePush(message)) {
    return {
      sent: false,
      skipped: true,
      reason: "not_urgent",
    };
  }

  try {
    const db = getServerFirestore();
    const deviceSnapshot = await db
      .collection(firebaseCollections.mobileDeviceTokens)
      .limit(1)
      .get();

    if (deviceSnapshot.empty) {
      await recordRuntimeHealthWarning(
        MOBILE_PUSH_RUNTIME_HEALTH_ID,
        MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
        {
          action: "urgent_case_broadcast",
          caseId: message.caseId ?? message.id,
          reason: "no_registered_devices",
        }
      );

      return {
        sent: false,
        skipped: true,
        reason: "no_registered_devices",
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

    await recordRuntimeHealthSuccess(
      MOBILE_PUSH_RUNTIME_HEALTH_ID,
      MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
      {
        action: "urgent_case_broadcast",
        caseId: message.caseId ?? message.id,
        messageId,
      }
    );

    return {
      sent: true,
      messageId,
    };
  } catch (error) {
    await recordRuntimeHealthFailure(
      MOBILE_PUSH_RUNTIME_HEALTH_ID,
      MOBILE_PUSH_RUNTIME_HEALTH_LABEL,
      error,
      {
        action: "urgent_case_broadcast",
        caseId: message.caseId ?? message.id,
      }
    );

    return {
      sent: false,
      skipped: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
