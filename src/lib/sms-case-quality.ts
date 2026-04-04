import type {
  FarmerAssistanceRecord,
  FieldVisitTask,
  SmsMessage,
} from "@/lib/types";

const HIGH_RISK_CLOSEOUT_INTENTS = new Set([
  "PEST_DISEASE",
  "EMERGENCY",
  "WEATHER_HELP",
]);

function asTime(value?: string) {
  if (!value) {
    return Number.NaN;
  }

  return new Date(value).getTime();
}

function isRecentEnough(caseTimestamp: string, eventTimestamp?: string) {
  const caseTime = asTime(caseTimestamp);
  const eventTime = asTime(eventTimestamp);

  if (Number.isNaN(caseTime) || Number.isNaN(eventTime)) {
    return false;
  }

  return eventTime >= caseTime;
}

export function requiresStructuredResolutionEvidence(
  message: Pick<SmsMessage, "urgency" | "parsedIntent">
) {
  return (
    message.urgency === "high" &&
    HIGH_RISK_CLOSEOUT_INTENTS.has(message.parsedIntent)
  );
}

export type SmsCaseResolutionReadiness = {
  required: boolean;
  ready: boolean;
  blockers: string[];
  assistanceCount: number;
  linkedVisitCount: number;
  completedVisitCount: number;
};

export function getSmsCaseResolutionReadiness(input: {
  message: Pick<
    SmsMessage,
    "id" | "farmerId" | "timestamp" | "urgency" | "parsedIntent"
  >;
  assistanceRecords: FarmerAssistanceRecord[];
  fieldVisitTasks: FieldVisitTask[];
}): SmsCaseResolutionReadiness {
  const required = requiresStructuredResolutionEvidence(input.message);
  const matchingAssistance = input.assistanceRecords.filter((record) => {
    if (record.relatedSmsId === input.message.id) {
      return true;
    }

    return (
      record.farmerId === input.message.farmerId &&
      record.status !== "planned" &&
      isRecentEnough(input.message.timestamp, record.updatedAt)
    );
  });
  const matchingVisits = input.fieldVisitTasks.filter((task) => {
    if (task.relatedSmsId === input.message.id) {
      return true;
    }

    return (
      task.farmerId === input.message.farmerId &&
      isRecentEnough(input.message.timestamp, task.updatedAt)
    );
  });
  const completedVisits = matchingVisits.filter(
    (task) => task.status === "completed"
  );

  if (!required) {
    return {
      required: false,
      ready: true,
      blockers: [],
      assistanceCount: matchingAssistance.length,
      linkedVisitCount: matchingVisits.length,
      completedVisitCount: completedVisits.length,
    };
  }

  const blockers: string[] = [];

  if (matchingAssistance.length === 0 && completedVisits.length === 0) {
    blockers.push(
      "Mag-log muna ng aktuwal na action taken, tulad ng assistance record o completed field visit, bago markahang resolved ang high-risk case."
    );
  }

  return {
    required: true,
    ready: blockers.length === 0,
    blockers,
    assistanceCount: matchingAssistance.length,
    linkedVisitCount: matchingVisits.length,
    completedVisitCount: completedVisits.length,
  };
}

export function getSmsCaseReportingCompleteness(message: SmsMessage) {
  let score = 0;

  if (message.caseId) score += 10;
  if (message.caseStatus) score += 10;
  if (!message.identityDetailsNeeded && !message.registrationRequired) score += 15;
  if (message.parsedIntent !== "UNKNOWN") score += 10;
  if (message.assignedTo || message.respondedAt || message.autoReplySentAt) score += 15;
  if (message.caseOutcomeStatus) score += 15;
  if (message.caseOutcomeSummary?.trim()) score += 15;
  if (
    message.closedAt ||
    message.resolutionConfirmationStatus === "confirmed_by_farmer"
  ) {
    score += 10;
  }

  const normalizedScore = Math.min(100, score);
  const tier =
    normalizedScore >= 75
      ? "complete"
      : normalizedScore >= 45
        ? "partial"
        : "low_confidence";

  return {
    score: normalizedScore,
    tier,
    readyForReports:
      tier === "complete" &&
      Boolean(message.caseOutcomeStatus) &&
      Boolean(message.caseOutcomeSummary?.trim()),
  };
}
