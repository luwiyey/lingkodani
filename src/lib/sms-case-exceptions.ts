import { getSmsCaseReportingCompleteness, getSmsCaseResolutionReadiness } from "@/lib/sms-case-quality";
import { isAwaitingFarmerConfirmation } from "@/lib/sms-case-outcomes";
import type { FarmerAssistanceRecord, FieldVisitTask, OutboundMessage, SmsMessage } from "@/lib/types";

export type SmsCaseExceptionSeverity = "low" | "medium" | "high";

export type SmsCaseExceptionFlag = {
  id:
    | "missing_resolution_evidence"
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

  return flags;
}
