import { NextResponse } from "next/server";

import { firebaseCollections } from "@/lib/firebase/collections";
import { getServerFirestore } from "@/lib/firebase/server";
import { authenticateInteractiveRequest } from "@/lib/server/interactive-auth";
import type { AuditLog, FieldVisitStatus, FieldVisitTask, LogbookEntry } from "@/lib/types";

type VerificationPayload = {
  status?: FieldVisitTask["verificationStatus"];
  source?: FieldVisitTask["verificationSource"];
  capturedAt?: string;
  lat?: number;
  lng?: number;
  accuracyMeters?: number;
  note?: string;
};

function compactUndefined<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined)
  ) as Partial<T>;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeStatus(value: unknown): FieldVisitStatus | null {
  switch (value) {
    case "scheduled":
    case "in_progress":
    case "completed":
    case "cancelled":
      return value;
    default:
      return null;
  }
}

function normalizeNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function getVerificationSummary(task: Pick<
  FieldVisitTask,
  | "verificationStatus"
  | "verificationSource"
  | "verificationAccuracyMeters"
  | "verificationNote"
>) {
  if (task.verificationStatus === "gps_captured") {
    const accuracyText =
      typeof task.verificationAccuracyMeters === "number"
        ? ` (accuracy ${Math.round(task.verificationAccuracyMeters)}m)`
        : "";
    return `GPS verified${accuracyText}`;
  }

  if (task.verificationStatus === "manual_only") {
    const source =
      task.verificationSource === "manual_dashboard"
        ? "manual dashboard"
        : "mobile manual fallback";
    return task.verificationNote
      ? `Manual verification via ${source}: ${task.verificationNote}`
      : `Manual verification via ${source}`;
  }

  return "Unverified visit metadata";
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authenticateInteractiveRequest(request, ["barangay", "developer"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const taskId = id.trim();
    const body = await request.json();
    const status = normalizeStatus(body.status);
    const note = normalizeText(body.note);
    const verificationInput = (body.verification ?? {}) as VerificationPayload;

    if (!taskId) {
      return NextResponse.json({ error: "Missing field visit ID." }, { status: 400 });
    }

    if (!status) {
      return NextResponse.json({ error: "Invalid field visit status." }, { status: 400 });
    }

    const db = getServerFirestore();
    const taskRef = db.collection(firebaseCollections.fieldVisitTasks).doc(taskId);
    const snapshot = await taskRef.get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Hindi makita ang field visit task." },
        { status: 404 }
      );
    }

    const currentTask = snapshot.data() as FieldVisitTask;
    const timestamp = new Date().toISOString();
    const verificationStatus =
      verificationInput.status ??
      ((status === "in_progress" || status === "completed")
        ? "manual_only"
        : currentTask.verificationStatus ?? "unverified");
    const verificationSource =
      verificationInput.source ??
      (verificationStatus === "gps_captured" ? "mobile_gps" : "mobile_manual");
    const verificationCapturedAt =
      normalizeText(verificationInput.capturedAt) || timestamp;
    const verificationNote =
      normalizeText(verificationInput.note) ||
      (verificationStatus === "manual_only"
        ? "Na-update mula sa mobile nang walang GPS lock."
        : currentTask.verificationNote);
    const nextTask: FieldVisitTask = {
      ...currentTask,
      status,
      updatedAt: timestamp,
      notes: note || currentTask.notes,
      startedAt:
        status === "in_progress"
          ? currentTask.startedAt ?? timestamp
          : currentTask.startedAt,
      completedAt:
        status === "completed"
          ? timestamp
          : status === "cancelled"
            ? undefined
            : currentTask.completedAt,
      verificationStatus,
      verificationSource,
      verificationCapturedAt,
      verificationLat:
        verificationStatus === "gps_captured"
          ? normalizeNumber(verificationInput.lat) ?? currentTask.verificationLat
          : undefined,
      verificationLng:
        verificationStatus === "gps_captured"
          ? normalizeNumber(verificationInput.lng) ?? currentTask.verificationLng
          : undefined,
      verificationAccuracyMeters:
        verificationStatus === "gps_captured"
          ? normalizeNumber(verificationInput.accuracyMeters) ?? currentTask.verificationAccuracyMeters
          : undefined,
      verificationNote,
    };

    const taskUpdates = compactUndefined({
      status: nextTask.status,
      updatedAt: nextTask.updatedAt,
      notes: nextTask.notes,
      startedAt: nextTask.startedAt,
      completedAt: nextTask.completedAt,
      verificationStatus: nextTask.verificationStatus,
      verificationSource: nextTask.verificationSource,
      verificationCapturedAt: nextTask.verificationCapturedAt,
      verificationLat: nextTask.verificationLat,
      verificationLng: nextTask.verificationLng,
      verificationAccuracyMeters: nextTask.verificationAccuracyMeters,
      verificationNote: nextTask.verificationNote,
    });

    const actorName = auth.profile.name ?? auth.email;
    const auditLog: AuditLog = {
      id: `AUD${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp,
      user: actorName,
      action: "MOBILE_UPDATE_FIELD_VISIT",
      details: `${currentTask.title} -> ${status} (${nextTask.verificationStatus ?? "unverified"})`,
    };
    const logbookEntry: LogbookEntry = {
      id: `LOG${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      farmerId: currentTask.farmerId,
      timestamp,
      type: "Tala sa Bukid",
      title: `Mobile field visit update: ${currentTask.title}`,
      description: `Status: ${status}. ${getVerificationSummary(nextTask)}`,
    };

    await Promise.all([
      taskRef.update(taskUpdates),
      db.collection(firebaseCollections.auditLogs).doc(auditLog.id).set(auditLog),
      db.collection(firebaseCollections.logbookEntries).doc(logbookEntry.id).set(logbookEntry),
    ]);

    return NextResponse.json({
      updated: true,
      task: nextTask,
      auditLog,
      logbookEntry,
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi ma-update ang field visit task sa ngayon." },
      { status: 500 }
    );
  }
}
