"use client";

import { useEffect, useState } from "react";

import { useAuth } from "@/context/auth-context";
import { getClientAuth } from "@/lib/firebase/auth-client";
import type { RuntimeHealthRecord } from "@/lib/types";

type RuntimeHealthPayload = {
  records: RuntimeHealthRecord[];
  latestInbound: {
    timestamp: string;
    farmerName: string;
    messagePreview: string;
    caseId: string;
    sourceProvider: string;
  } | null;
  latestOutbound: {
    createdAt: string;
    recipientPhone: string;
    purpose: string;
    audience: string;
    status: string;
    provider: string;
    providerMessageId: string | null;
    queuePriorityLabel: string | null;
    deliveryReceivedAt: string | null;
    lastStatusAt: string | null;
    errorMessage: string | null;
  } | null;
  latestDeliveredOutbound: {
    id: string;
    createdAt: string;
    recipientPhone: string;
    purpose: string;
    audience: string;
    status: string;
    provider: string;
    providerMessageId: string | null;
    queuePriority: number | null;
    queuePriorityLabel: string | null;
    lastStatusAt: string | null;
    deliveryReceivedAt: string | null;
    errorMessage: string | null;
    needsAttention: boolean;
    attentionReason: string | null;
    deliveryState: string;
  } | null;
  outboundDeliverySummary: {
    recentCount: number;
    failedCount: number;
    awaitingReceiptCount: number;
    queuedCount: number;
    deliveredCount: number;
    needsAttentionCount: number;
  };
  outboundAttentionItems: Array<{
    id: string;
    createdAt: string;
    recipientPhone: string;
    purpose: string;
    audience: string;
    status: string;
    provider: string;
    providerMessageId: string | null;
    queuePriority: number | null;
    queuePriorityLabel: string | null;
    lastStatusAt: string | null;
    deliveryReceivedAt: string | null;
    errorMessage: string | null;
    needsAttention: boolean;
    attentionReason: string | null;
    deliveryState: string;
  }>;
  recentOutboundWatch: Array<{
    id: string;
    createdAt: string;
    recipientPhone: string;
    purpose: string;
    audience: string;
    status: string;
    provider: string;
    providerMessageId: string | null;
    queuePriority: number | null;
    queuePriorityLabel: string | null;
    lastStatusAt: string | null;
    deliveryReceivedAt: string | null;
    errorMessage: string | null;
    needsAttention: boolean;
    attentionReason: string | null;
    deliveryState: string;
  }>;
  latestFailure: {
    id: string;
    label: string;
    status: string;
    updatedAt: string;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    lastError: string | null;
    meta: Record<string, unknown>;
  } | null;
  latestAutomationFailure: {
    id: string;
    label: string;
    status: string;
    updatedAt: string;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    lastError: string | null;
    meta: Record<string, unknown>;
  } | null;
  latestWebhook: {
    id: string;
    label: string;
    status: string;
    updatedAt: string;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    lastError: string | null;
    meta: Record<string, unknown>;
  } | null;
  latestPush: {
    id: string;
    label: string;
    status: string;
    updatedAt: string;
    lastSuccessAt: string | null;
    lastFailureAt: string | null;
    lastError: string | null;
    meta: Record<string, unknown>;
  } | null;
};

export function useRuntimeHealth() {
  const { authLoading, currentUser } = useAuth();
  const [runtimeHealth, setRuntimeHealth] = useState<RuntimeHealthPayload>({
    records: [],
    latestInbound: null,
    latestOutbound: null,
    latestDeliveredOutbound: null,
    outboundDeliverySummary: {
      recentCount: 0,
      failedCount: 0,
      awaitingReceiptCount: 0,
      queuedCount: 0,
      deliveredCount: 0,
      needsAttentionCount: 0,
    },
    outboundAttentionItems: [],
    recentOutboundWatch: [],
    latestFailure: null,
    latestAutomationFailure: null,
    latestWebhook: null,
    latestPush: null,
  });
  const [runtimeHealthLoading, setRuntimeHealthLoading] = useState(true);

  useEffect(() => {
    let active = true;

    if (authLoading) {
      return () => {
        active = false;
      };
    }

    if (!currentUser) {
      setRuntimeHealthLoading(false);
      return () => {
        active = false;
      };
    }

    void (async () => {
      try {
        const idToken = await getClientAuth().currentUser?.getIdToken();

        if (!idToken) {
          return;
        }

        const response = await fetch("/api/system/runtime-health", {
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        if (!response.ok) {
          return;
        }

        const payload = (await response.json()) as RuntimeHealthPayload;

        if (active) {
          setRuntimeHealth(payload);
        }
      } catch {
        // Keep the empty state when the runtime-health endpoint is unavailable.
      } finally {
        if (active) {
          setRuntimeHealthLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [authLoading, currentUser]);

  return { runtimeHealth, runtimeHealthLoading };
}
