import { firebaseCollections } from "@/lib/firebase/collections";
import type { RuntimeHealthRecord, RuntimeHealthStatus } from "@/lib/types";

function compactUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

type RuntimeHealthInput = {
  id: string;
  label: string;
  status: RuntimeHealthStatus;
  error?: string;
  meta?: Record<string, unknown>;
  timestamp?: string;
};

function shouldSkipRuntimeHealthPersistence() {
  return process.env.NODE_ENV === "test";
}

async function writeRuntimeHealth(input: RuntimeHealthInput) {
  if (shouldSkipRuntimeHealthPersistence()) {
    return;
  }

  const { getServerFirestore } = await import("@/lib/firebase/server");
  const db = getServerFirestore();
  const timestamp = input.timestamp ?? new Date().toISOString();
  const payload: RuntimeHealthRecord = {
    id: input.id,
    label: input.label,
    status: input.status,
    updatedAt: timestamp,
    lastRunAt: timestamp,
    lastSuccessAt: input.status === "ok" ? timestamp : undefined,
    lastFailureAt: input.status === "error" ? timestamp : undefined,
    lastError: input.status === "error" ? input.error ?? "Unknown runtime failure" : undefined,
    meta: input.meta ? compactUndefined(input.meta) : undefined,
  };

  await db
    .collection(firebaseCollections.systemHealth)
    .doc(input.id)
    .set(compactUndefined(payload), { merge: true });
}

export async function recordRuntimeHealthSuccess(
  id: string,
  label: string,
  meta?: Record<string, unknown>
) {
  await writeRuntimeHealth({
    id,
    label,
    status: "ok",
    meta,
  });
}

export async function recordRuntimeHealthFailure(
  id: string,
  label: string,
  error: unknown,
  meta?: Record<string, unknown>
) {
  await writeRuntimeHealth({
    id,
    label,
    status: "error",
    error: error instanceof Error ? error.message : String(error ?? "Unknown runtime failure"),
    meta,
  });
}

export async function recordRuntimeHealthWarning(
  id: string,
  label: string,
  meta?: Record<string, unknown>
) {
  await writeRuntimeHealth({
    id,
    label,
    status: "warn",
    meta,
  });
}

export async function listRuntimeHealthRecords() {
  if (shouldSkipRuntimeHealthPersistence()) {
    return [] as RuntimeHealthRecord[];
  }

  const { getServerFirestore } = await import("@/lib/firebase/server");
  const db = getServerFirestore();
  const snapshot = await db.collection(firebaseCollections.systemHealth).get();

  return snapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Omit<RuntimeHealthRecord, "id">) }))
    .sort((left, right) => left.label.localeCompare(right.label));
}
