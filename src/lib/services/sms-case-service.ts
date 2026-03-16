import type { SmsMessage, SmsCaseStatus } from "@/lib/types";

const SLA_BY_URGENCY_MINUTES: Record<SmsMessage["urgency"], number> = {
  low: 20,
  medium: 10,
  high: 3,
};

const FOLLOW_UP_BY_URGENCY_HOURS: Record<SmsMessage["urgency"], number> = {
  low: 24,
  medium: 12,
  high: 6,
};

function addMinutes(isoTimestamp: string, minutes: number) {
  return new Date(new Date(isoTimestamp).getTime() + minutes * 60 * 1000).toISOString();
}

function addHours(isoTimestamp: string, hours: number) {
  return new Date(new Date(isoTimestamp).getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function getSlaDueAt(timestamp: string, urgency: SmsMessage["urgency"]) {
  return addMinutes(timestamp, SLA_BY_URGENCY_MINUTES[urgency]);
}

export function getFollowUpDueAt(timestamp: string, urgency: SmsMessage["urgency"]) {
  return addHours(timestamp, FOLLOW_UP_BY_URGENCY_HOURS[urgency]);
}

export function buildCaseId(input: {
  farmerId?: string;
  normalizedPhone: string;
}) {
  return `CASE-${input.farmerId ?? input.normalizedPhone}`;
}

export function deriveInitialCaseStatus(input: {
  clarificationNeeded?: boolean;
  registrationRequired?: boolean;
}): SmsCaseStatus {
  if (input.registrationRequired) return "awaiting_registration";
  if (input.clarificationNeeded) return "awaiting_clarification";
  return "open";
}
