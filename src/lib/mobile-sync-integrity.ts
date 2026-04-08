import type { Farmer, FieldVisitTask, SmsMessage } from "@/lib/types";

type MobileSyncConflictTarget = "sms_message" | "farmer" | "field_visit";

type MobileSyncConflictInput = {
  expectedSyncVersion?: string;
  currentSyncVersion: string;
  target: MobileSyncConflictTarget;
  summary: string;
  recommendedAction: string;
  currentState: Record<string, unknown>;
};

function normalizePart(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.map((entry) => normalizePart(entry)).join(",");
  }

  return `${value}`.trim();
}

function buildSyncVersion(parts: unknown[]): string {
  return parts.map((part) => normalizePart(part)).join("|");
}

export function getSmsMessageSyncVersion(message: SmsMessage) {
  return buildSyncVersion([
    message.id,
    message.status,
    message.caseStatus,
    message.assignedTo,
    message.assignedAt,
    message.respondedAt,
    message.closedAt,
    message.caseOutcomeStatus,
    message.caseOutcomeUpdatedAt,
    message.resolutionConfirmationStatus,
    message.resolutionConfirmationRequestedAt,
    message.resolutionConfirmedAt,
    message.followUpAttemptCount,
    message.followUpLastReminderAt,
    message.threadReviewStatus,
    message.threadReviewedAt,
    message.aiAdvice,
    message.urgency,
    message.safetyFlag,
    message.timestamp,
  ]);
}

export function getFarmerSyncVersion(farmer: Farmer) {
  return buildSyncVersion([
    farmer.id,
    farmer.status,
    farmer.profileVersion,
    farmer.identityTrustLevel,
    farmer.identityConfidenceScore,
    farmer.lastProfileReviewedAt,
    farmer.lastSmsActivity,
    farmer.archivedAt,
    farmer.retentionRedactedAt,
    farmer.mergedIntoFarmerId,
    farmer.crops,
    farmer.plots?.map((plot) => [plot.id, plot.crop, plot.sizeHectares, plot.sitio]),
    farmer.seasonalCropHistory?.map((season) => [
      season.seasonLabel,
      season.updatedAt,
      season.crops,
    ]),
  ]);
}

export function getFieldVisitTaskSyncVersion(task: FieldVisitTask) {
  return buildSyncVersion([
    task.id,
    task.status,
    task.updatedAt,
    task.startedAt,
    task.completedAt,
    task.assignedTo,
    task.verificationStatus,
    task.verificationSource,
    task.verificationCapturedAt,
    task.verificationLat,
    task.verificationLng,
    task.verificationAccuracyMeters,
    task.notes,
    task.outcomeSummary,
    task.attachmentCount,
  ]);
}

export function hasExpectedSyncConflict(
  expectedSyncVersion: string | undefined,
  currentSyncVersion: string
) {
  const normalizedExpected = expectedSyncVersion?.trim() ?? "";

  if (!normalizedExpected) {
    return false;
  }

  return normalizedExpected !== currentSyncVersion;
}

export function buildMobileSyncConflict(input: MobileSyncConflictInput) {
  return {
    code: "mobile_sync_conflict",
    conflict: {
      expectedSyncVersion: input.expectedSyncVersion?.trim() || undefined,
      currentSyncVersion: input.currentSyncVersion,
      target: input.target,
      summary: input.summary,
      recommendedAction: input.recommendedAction,
      currentState: input.currentState,
    },
  };
}
