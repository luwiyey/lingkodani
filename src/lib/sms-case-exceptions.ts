import { getSmsCaseReportingCompleteness, getSmsCaseResolutionReadiness } from "@/lib/sms-case-quality";
import { isAwaitingFarmerConfirmation } from "@/lib/sms-case-outcomes";
import type { FarmerAssistanceRecord, FieldVisitTask, OutboundMessage, SmsMessage } from "@/lib/types";

export type SmsCaseExceptionSeverity = "low" | "medium" | "high";

export type SmsCaseExceptionFlag = {
  id:
    | "missing_resolution_evidence"
    | "distressed_unassigned"
    | "frustrated_no_response"
    | "lexicon_review_needed"
    | "thread_review_blocked"
    | "urgent_unassigned"
    | "urgent_no_action"
    | "follow_up_overdue"
    | "awaiting_farmer_confirmation_stale"
    | "last_farmer_outbound_failed"
    | "reporting_incomplete";
  severity: SmsCaseExceptionSeverity;
  title: string;
  reason: string;
};

function hoursBetween(left: string, right: string) {
  return Math.abs(new Date(left).getTime() - new Date(right).getTime()) / (1000 * 60 * 60);
}

function sortByNewest<T extends { createdAt?: string; sentAt?: string; lastStatusAt?: string }>(items: T[]) {
  return [...items].sort((left, right) => {
    const leftTime = new Date(left.lastStatusAt ?? left.sentAt ?? left.createdAt ?? 0).getTime();
    const rightTime = new Date(right.lastStatusAt ?? right.sentAt ?? right.createdAt ?? 0).getTime();
    return rightTime - leftTime;
  });
}

export function getSmsCaseExceptionFlags(input: {
  message: SmsMessage;
  assistanceRecords?: FarmerAssistanceRecord[];
  fieldVisitTasks?: FieldVisitTask[];
  outboundMessages?: OutboundMessage[];
  now?: string;
}) {
  const {
    message,
    assistanceRecords = [],
    fieldVisitTasks = [],
    outboundMessages = [],
    now = new Date().toISOString(),
  } = input;
  const flags: SmsCaseExceptionFlag[] = [];

  const relatedAssistance = assistanceRecords.filter(
    (record) => record.farmerId === message.farmerId && (!record.relatedSmsId || record.relatedSmsId === message.id)
  );
  const relatedVisits = fieldVisitTasks.filter(
    (task) => task.farmerId === message.farmerId && (!task.relatedSmsId || task.relatedSmsId === message.id)
  );
  const relatedOutbound = sortByNewest(
    outboundMessages.filter((record) => record.smsMessageId === message.id && record.audience !== "official")
  );

  const resolutionReadiness = getSmsCaseResolutionReadiness({
    message,
    assistanceRecords: relatedAssistance,
    fieldVisitTasks: relatedVisits,
  });
  const reportingCompleteness = getSmsCaseReportingCompleteness(message);
  const messageAgeHours = hoursBetween(message.timestamp, now);
  const timeSinceAssignmentHours = message.assignedAt ? hoursBetween(message.assignedAt, now) : undefined;
  const latestFarmerOutbound = relatedOutbound[0];

  if (message.sentiment === "distressed" && !message.assignedTo && !message.closedAt && messageAgeHours >= 1) {
    flags.push({
      id: "distressed_unassigned",
      severity: "high",
      title: "Matinding farmer distress pero wala pang naka-assign",
      reason: "Mukhang distressed ang farmer at lampas na sa 1 oras ang mensahe nang walang malinaw na naka-assign na responder.",
    });
  }

  if (
    message.sentiment === "frustrated" &&
    !message.respondedAt &&
    !message.closedAt &&
    (timeSinceAssignmentHours ?? messageAgeHours) >= 4
  ) {
    flags.push({
      id: "frustrated_no_response",
      severity: message.urgency === "high" ? "high" : "medium",
      title: "Frustrated na ang farmer pero wala pang malinaw na response",
      reason: "Paulit-ulit o frustrated ang tono ng mensahe at wala pang sapat na documented response o follow-through.",
    });
  }

  if (
    !message.closedAt &&
    message.normalizationUnknownTokens &&
    message.normalizationUnknownTokens.length >= 2 &&
    (message.triageConfidence ?? message.aiConfidence) < 0.72
  ) {
    flags.push({
      id: "lexicon_review_needed",
      severity: "medium",
      title: "Kailangan ng dialect o lexicon review",
      reason: `May hindi pa kilalang lokal na termino (${message.normalizationUnknownTokens.slice(0, 3).join(", ")}) at mababa ang triage confidence para dito.`,
    });
  }

  if (
    !message.closedAt &&
    !message.respondedAt &&
    (
      message.threadReviewStatus === "pending" ||
      message.multiConcernDetected ||
      Boolean(message.possibleDuplicateOfCaseId)
    )
  ) {
    flags.push({
      id: "thread_review_blocked",
      severity: "medium",
      title: "Kailangan munang i-review ang threading bago final reply",
      reason: "May senyales na maaaring continuation, duplicate, o halong concern ang case na ito kaya kailangan muna ng thread review bago magsara o magpadala ng final advice.",
    });
  }

  if (
    (message.caseOutcomeStatus === "resolved" || message.caseStatus === "closed") &&
    !resolutionReadiness.ready
  ) {
    flags.push({
      id: "missing_resolution_evidence",
      severity: "high",
      title: "Kulangan ang closeout evidence",
      reason: resolutionReadiness.blockers.join(" "),
    });
  }

  if (message.urgency === "high" && !message.assignedTo && !message.closedAt && messageAgeHours >= 2) {
    flags.push({
      id: "urgent_unassigned",
      severity: "high",
      title: "Urgent na kaso pero walang naka-assign",
      reason: "Lampas na sa 2 oras ang urgent case ngunit wala pang malinaw na assignee.",
    });
  }

  if (
    message.urgency === "high" &&
    message.assignedTo &&
    !message.respondedAt &&
    !message.caseOutcomeUpdatedAt &&
    !message.closedAt &&
    (timeSinceAssignmentHours ?? messageAgeHours) >= 6
  ) {
    flags.push({
      id: "urgent_no_action",
      severity: "high",
      title: "Urgent na kaso pero walang naka-log na aksyon",
      reason: "Naka-assign na ang case ngunit wala pang response, outcome update, o closeout activity.",
    });
  }

  if (
    message.followUpDueAt &&
    !message.closedAt &&
    new Date(message.followUpDueAt).getTime() < new Date(now).getTime()
  ) {
    flags.push({
      id: "follow_up_overdue",
      severity: "medium",
      title: "Lampas na ang follow-up due",
      reason: "May nakatakdang follow-up na hindi pa naisara o nao-update sa oras.",
    });
  }

  if (
    isAwaitingFarmerConfirmation(message) &&
    message.resolutionConfirmationRequestedAt &&
    hoursBetween(message.resolutionConfirmationRequestedAt, now) >= 48
  ) {
    flags.push({
      id: "awaiting_farmer_confirmation_stale",
      severity: "medium",
      title: "Matagal nang naghihintay ng farmer confirmation",
      reason: "Mahigit 48 oras nang walang kumpirmasyon mula sa magsasaka pagkatapos ng closure request.",
    });
  }

  if (
    latestFarmerOutbound?.status === "failed" &&
    !relatedOutbound.some((record) => record.status === "sent" || record.status === "delivered")
  ) {
    flags.push({
      id: "last_farmer_outbound_failed",
      severity: "medium",
      title: "Nabigong outbound follow-through",
      reason: "Ang pinakahuling outbound message para sa kasong ito ay failed at wala pang successful retry.",
    });
  }

  if (
    (message.caseOutcomeStatus || message.closedAt) &&
    !reportingCompleteness.readyForReports
  ) {
    const reportingReason =
      reportingCompleteness.tier === "low_confidence"
        ? "Masyadong kulang ang structured fields kaya hindi dapat i-trato bilang trusted resolved case."
        : "May closeout state ang case pero kulang pa ang summary o outcome details para sa truthful reporting.";
    flags.push({
      id: "reporting_incomplete",
      severity: reportingCompleteness.tier === "low_confidence" ? "high" : "medium",
      title: "Hindi pa handa ang case para sa truthful reporting",
      reason: reportingReason,
    });
  }

  const severityRank: Record<SmsCaseExceptionSeverity, number> = {
    high: 3,
    medium: 2,
    low: 1,
  };

  return [...flags].sort((left, right) => {
    if (severityRank[right.severity] !== severityRank[left.severity]) {
      return severityRank[right.severity] - severityRank[left.severity];
    }

    return left.title.localeCompare(right.title);
  });
}
