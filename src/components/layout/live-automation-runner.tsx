'use client';

import { useEffect, useRef } from "react";

import { useAuth } from "@/context/auth-context";
import { isLiveMode } from "@/lib/config/app-mode";

const OVERDUE_PROCESS_INTERVAL_MS = 60 * 1000;
const FOLLOW_UP_PROCESS_INTERVAL_MS = 30 * 60 * 1000;
const LOCK_LEASE_MS = 45 * 1000;
const STORAGE_PREFIX = "lingkodani:live-automation";

function readNumber(key: string) {
  if (typeof window === "undefined") {
    return 0;
  }

  const raw = window.localStorage.getItem(key);
  const parsed = raw ? Number(raw) : 0;

  return Number.isFinite(parsed) ? parsed : 0;
}

function readLock(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { owner?: string; expiresAt?: number };
    return {
      owner: typeof parsed.owner === "string" ? parsed.owner : "",
      expiresAt: typeof parsed.expiresAt === "number" ? parsed.expiresAt : 0,
    };
  } catch {
    return null;
  }
}

function writeLock(key: string, owner: string, expiresAt: number) {
  window.localStorage.setItem(
    key,
    JSON.stringify({
      owner,
      expiresAt,
    })
  );
}

function clearLock(key: string, owner: string) {
  const current = readLock(key);

  if (current?.owner === owner) {
    window.localStorage.removeItem(key);
  }
}

function tryAcquireLock(key: string, owner: string) {
  const now = Date.now();
  const current = readLock(key);

  if (current?.owner && current.expiresAt > now && current.owner !== owner) {
    return false;
  }

  writeLock(key, owner, now + LOCK_LEASE_MS);
  const confirmed = readLock(key);

  return confirmed?.owner === owner;
}

function markRun(key: string) {
  window.localStorage.setItem(key, String(Date.now()));
}

function isDue(key: string, intervalMs: number) {
  return Date.now() - readNumber(key) >= intervalMs;
}

type AutomationTarget = {
  name: "overdue" | "followup";
  path: string;
  intervalMs: number;
};

const automationTargets: AutomationTarget[] = [
  {
    name: "overdue",
    path: "/api/system/process-overdue-sms",
    intervalMs: OVERDUE_PROCESS_INTERVAL_MS,
  },
  {
    name: "followup",
    path: "/api/system/process-follow-ups",
    intervalMs: FOLLOW_UP_PROCESS_INTERVAL_MS,
  },
];

export function LiveAutomationRunner() {
  const { currentUser, currentUserProfile } = useAuth();
  const ownerRef = useRef(`tab-${Math.random().toString(36).slice(2, 10)}`);

  useEffect(() => {
    if (!isLiveMode || !currentUser || !currentUserProfile) {
      return;
    }

    let cancelled = false;

    const runTarget = async (target: AutomationTarget) => {
      if (cancelled || document.visibilityState === "hidden") {
        return;
      }

      const runKey = `${STORAGE_PREFIX}:${target.name}:last-run`;
      const lockKey = `${STORAGE_PREFIX}:${target.name}:lock`;
      const owner = ownerRef.current;

      if (!isDue(runKey, target.intervalMs)) {
        return;
      }

      if (!tryAcquireLock(lockKey, owner)) {
        return;
      }

      try {
        const token = await currentUser.getIdToken();
        const response = await fetch(target.path, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          markRun(runKey);
        }
      } catch {
        // Background automation should fail silently in the UI.
      } finally {
        clearLock(lockKey, owner);
      }
    };

    const tick = async () => {
      for (const target of automationTargets) {
        await runTarget(target);
      }
    };

    void tick();

    const intervalId = window.setInterval(() => {
      void tick();
    }, OVERDUE_PROCESS_INTERVAL_MS);

    const handleWakeUp = () => {
      if (document.visibilityState === "visible") {
        void tick();
      }
    };

    window.addEventListener("focus", handleWakeUp);
    document.addEventListener("visibilitychange", handleWakeUp);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleWakeUp);
      document.removeEventListener("visibilitychange", handleWakeUp);
    };
  }, [currentUser, currentUserProfile]);

  return null;
}
