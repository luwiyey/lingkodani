import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { authenticateServerRequest } from "@/lib/server/request-auth";
import { listRuntimeHealthRecords } from "@/lib/system-health";
import type { OutboundMessage, RuntimeHealthRecord, SmsMessage } from "@/lib/types";

const OUTBOUND_ATTENTION_WINDOW_MS = 15 * 60 * 1000;
const OUTBOUND_QUEUE_STALE_MS = 5 * 60 * 1000;

function runtimeRecordSortValue(record?: RuntimeHealthRecord | null) {
  if (!record) {
    return Number.NEGATIVE_INFINITY;
  }

  return new Date(record.lastFailureAt ?? record.updatedAt).getTime();
}

function serializeRuntimeRecord(record?: RuntimeHealthRecord | null) {
  if (!record) {
    return null;
  }

  return {
    id: record.id,
    label: record.label,
    status: record.status,
    updatedAt: record.updatedAt,
    lastSuccessAt: record.lastSuccessAt ?? null,
    lastFailureAt: record.lastFailureAt ?? null,
    lastError: record.lastError ?? null,
    meta: record.meta ?? {},
  };
}

function asTimestamp(value?: string | null) {
  if (!value) {
    return Number.NaN;
  }

  return new Date(value).getTime();
}

function normalizeOutboundAttention(message: OutboundMessage) {
  const createdAt = asTimestamp(message.createdAt);
  const ageMs = Number.isNaN(createdAt) ? 0 : Date.now() - createdAt;
  const deliveryReceived = Boolean(message.deliveryReceivedAt) || message.status === "delivered";

  if (message.status === "failed") {
    return {
      needsAttention: true,
      attentionReason: message.errorMessage ?? "Hindi naipadala ang mensahe.",
      deliveryState: "failed" as const,
    };
  }

  if (!deliveryReceived && message.status === "queued" && ageMs >= OUTBOUND_QUEUE_STALE_MS) {
    return {
      needsAttention: true,
      attentionReason: "Matagal nang queued at wala pang send confirmation.",
      deliveryState: "queued" as const,
    };
  }

  if (!deliveryReceived && ["sent", "retried"].includes(message.status) && ageMs >= OUTBOUND_ATTENTION_WINDOW_MS) {
    return {
      needsAttention: true,
      attentionReason: "Naipadala na pero wala pang delivery receipt mula sa provider.",
      deliveryState: "awaiting_receipt" as const,
    };
  }

  if (deliveryReceived) {
    return {
      needsAttention: false,
      attentionReason: null,
      deliveryState: "delivered" as const,
    };
  }

  return {
    needsAttention: false,
    attentionReason: null,
    deliveryState:
      message.status === "queued"
        ? ("queued" as const)
        : (message.status === "retried" ? "awaiting_receipt" : "sent"),
  };
}

function serializeOutboundWatch(message: OutboundMessage) {
  const attention = normalizeOutboundAttention(message);

  return {
    id: message.id,
    createdAt: message.createdAt,
    recipientPhone: message.recipientPhone,
    purpose: message.purpose ?? "other",
    audience: message.audience ?? "farmer",
    status: message.status,
    provider: message.provider,
    providerMessageId: message.providerMessageId ?? null,
    queuePriority: message.queuePriority ?? null,
    queuePriorityLabel: message.queuePriorityLabel ?? null,
    lastStatusAt: message.lastStatusAt ?? null,
    deliveryReceivedAt: message.deliveryReceivedAt ?? null,
    errorMessage: message.errorMessage ?? null,
    needsAttention: attention.needsAttention,
    attentionReason: attention.attentionReason,
    deliveryState: attention.deliveryState,
  };
}

export async function GET(request: Request) {
  const auth = await authenticateServerRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getServerFirestore();
  const [records, latestInboundSnapshot, latestOutboundSnapshot, recentOutboundSnapshot] = await Promise.all([
    listRuntimeHealthRecords(),
    db.collection(firebaseCollections.smsMessages).orderBy("timestamp", "desc").limit(1).get(),
    db.collection(firebaseCollections.outboundMessages).orderBy("createdAt", "desc").limit(1).get(),
    db.collection(firebaseCollections.outboundMessages).orderBy("createdAt", "desc").limit(20).get(),
  ]);

  const latestInbound = latestInboundSnapshot.docs[0]?.data() as SmsMessage | undefined;
  const latestOutbound = latestOutboundSnapshot.docs[0]?.data() as OutboundMessage | undefined;
  const recentOutbound = recentOutboundSnapshot.docs.map((doc) => doc.data() as OutboundMessage);
  const latestFailure = [...records]
    .filter((record) => record.status !== "ok")
    .sort((left, right) => runtimeRecordSortValue(right) - runtimeRecordSortValue(left))[0];
  const latestAutomationFailure = [...records]
    .filter(
      (record) =>
        (record.id === "automation_overdue" || record.id === "automation_followups") &&
        (record.lastFailureAt || record.status !== "ok")
    )
      .sort((left, right) => runtimeRecordSortValue(right) - runtimeRecordSortValue(left))[0];
  const latestWebhook = records.find((record) => record.id === "sms_outbound_webhook");
  const latestPush = records.find((record) => record.id === "mobile_push");
  const latestDeliveredOutbound = recentOutbound.find(
    (message) => message.status === "delivered" || Boolean(message.deliveryReceivedAt)
  );
  const recentOutboundWatch = recentOutbound.map(serializeOutboundWatch);
  const outboundAttentionItems = recentOutboundWatch.filter((item) => item.needsAttention).slice(0, 5);
  const outboundDeliverySummary = {
    recentCount: recentOutboundWatch.length,
    failedCount: recentOutboundWatch.filter((item) => item.deliveryState === "failed").length,
    awaitingReceiptCount: recentOutboundWatch.filter((item) => item.deliveryState === "awaiting_receipt").length,
    queuedCount: recentOutboundWatch.filter((item) => item.deliveryState === "queued").length,
    deliveredCount: recentOutboundWatch.filter((item) => item.deliveryState === "delivered").length,
    needsAttentionCount: outboundAttentionItems.length,
  };

  return NextResponse.json({
    records,
    latestInbound: latestInbound
      ? {
          timestamp: latestInbound.timestamp,
          farmerName: latestInbound.farmerName,
          messagePreview: latestInbound.message.slice(0, 160),
          caseId: latestInbound.caseId ?? latestInbound.id,
          sourceProvider: latestInbound.sourceProvider ?? "unknown",
        }
      : null,
    latestOutbound: latestOutbound
      ? {
          createdAt: latestOutbound.createdAt,
          recipientPhone: latestOutbound.recipientPhone,
          purpose: latestOutbound.purpose ?? "other",
          audience: latestOutbound.audience ?? "farmer",
          status: latestOutbound.status,
          provider: latestOutbound.provider,
          providerMessageId: latestOutbound.providerMessageId ?? null,
          queuePriorityLabel: latestOutbound.queuePriorityLabel ?? null,
          deliveryReceivedAt: latestOutbound.deliveryReceivedAt ?? null,
          lastStatusAt: latestOutbound.lastStatusAt ?? null,
          errorMessage: latestOutbound.errorMessage ?? null,
        }
      : null,
    latestDeliveredOutbound: latestDeliveredOutbound ? serializeOutboundWatch(latestDeliveredOutbound) : null,
    outboundDeliverySummary,
    outboundAttentionItems,
    recentOutboundWatch,
    latestFailure: serializeRuntimeRecord(latestFailure),
    latestAutomationFailure: serializeRuntimeRecord(latestAutomationFailure),
    latestWebhook: serializeRuntimeRecord(latestWebhook),
    latestPush: serializeRuntimeRecord(latestPush),
  });
}
