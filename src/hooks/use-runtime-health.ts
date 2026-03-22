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
    caseId: string;
    sourceProvider: string;
  } | null;
  latestOutbound: {
    createdAt: string;
    recipientPhone: string;
    purpose: string;
    status: string;
    provider: string;
  } | null;
};

export function useRuntimeHealth() {
  const { authLoading, currentUser } = useAuth();
  const [runtimeHealth, setRuntimeHealth] = useState<RuntimeHealthPayload>({
    records: [],
    latestInbound: null,
    latestOutbound: null,
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
  }, [authLoading, currentUser?.uid]);

  return { runtimeHealth, runtimeHealthLoading };
}
