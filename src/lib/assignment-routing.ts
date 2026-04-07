import type { Farmer, SmsMessage, User } from "@/lib/types";

export type AssignmentSuggestion = {
  userId: string;
  name: string;
  title?: string;
  score: number;
  openAssignments: number;
  availabilityStatus: User["availabilityStatus"];
  reasons: string[];
};

export type StaffingCoverageSummary = {
  uncoveredZones: string[];
  shiftLimitedZones: string[];
  overloadedUsers: Array<{
    userId: string;
    name: string;
    openAssignments: number;
  }>;
  offShiftUsers: string[];
  availableResponders: number;
};

function normalize(value?: string) {
  return value?.trim().toLowerCase() ?? "";
}

function inferExpertiseTags(user: User) {
  if (user.expertiseTags?.length) {
    return user.expertiseTags.map((tag) => normalize(tag)).filter(Boolean);
  }

  const haystack = `${user.title ?? ""} ${user.name}`.toLowerCase();
  const tags = new Set<string>();

  if (haystack.includes("aew") || haystack.includes("agricultural")) {
    tags.add("pest");
    tags.add("weather");
    tags.add("field");
    tags.add("crop");
  }

  if (haystack.includes("admin")) {
    tags.add("coordination");
    tags.add("routing");
  }

  if (haystack.includes("secretary")) {
    tags.add("coordination");
    tags.add("records");
  }

  if (haystack.includes("captain")) {
    tags.add("escalation");
    tags.add("emergency");
  }

  return Array.from(tags);
}

function inferAvailability(user: User) {
  if (user.availabilityStatus) {
    return user.availabilityStatus;
  }

  return user.status === "disabled" ? "off_shift" : "available";
}

function parseMinutes(value?: string) {
  if (!value || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return null;
  }

  const [hours, minutes] = value.split(":").map((part) => Number(part));
  return hours * 60 + minutes;
}

function isWithinShiftWindow(user: User, now = Date.now()) {
  const startMinutes = parseMinutes(user.shiftStartTime);
  const endMinutes = parseMinutes(user.shiftEndTime);

  if (startMinutes === null || endMinutes === null || startMinutes === endMinutes) {
    return null;
  }

  const currentDate = new Date(now);
  const currentMinutes = currentDate.getHours() * 60 + currentDate.getMinutes();

  if (startMinutes < endMinutes) {
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
}

function countOpenAssignments(messages: SmsMessage[], userName: string) {
  const normalizedUserName = normalize(userName);
  return messages.filter(
    (message) =>
      !message.closedAt &&
      normalize(message.assignedTo) === normalizedUserName
  ).length;
}

function getDirectHandlingRole(user: User) {
  return user.assignmentRole === "resolver" ||
    user.assignmentRole === "owner" ||
    user.assignmentRole === "recipient";
}

function getFarmerZone(message: SmsMessage, farmers: Farmer[]) {
  return normalize(farmers.find((farmer) => farmer.id === message.farmerId)?.sitio);
}

function getIntentTags(message: SmsMessage) {
  const tags = new Set<string>();
  const lowerMessage = message.message.toLowerCase();

  if (message.parsedIntent === "PEST_DISEASE") {
    tags.add("pest");
    tags.add("crop");
  }

  if (message.parsedIntent === "WEATHER_HELP") {
    tags.add("weather");
  }

  if (message.parsedIntent === "EMERGENCY") {
    tags.add("emergency");
    tags.add("field");
  }

  if (message.parsedIntent === "REQUEST") {
    tags.add("coordination");
  }

  if (lowerMessage.includes("visit") || lowerMessage.includes("bisita")) {
    tags.add("field");
  }

  return Array.from(tags);
}

export function buildAssignmentSuggestions(input: {
  message: SmsMessage;
  users: User[];
  farmers: Farmer[];
  smsMessages: SmsMessage[];
  now?: number;
}) {
  const { message, users, farmers, smsMessages, now = Date.now() } = input;
  const zone = getFarmerZone(message, farmers);
  const intentTags = getIntentTags(message);

  return users
    .filter((user) => user.role === "barangay" && user.status !== "disabled")
    .map((user) => {
      const availabilityStatus = inferAvailability(user);
      const expertiseTags = inferExpertiseTags(user);
      const openAssignments = countOpenAssignments(smsMessages, user.name);
      const inShift = isWithinShiftWindow(user, now);
      const reasons: string[] = [];
      let score = 40;

      if (availabilityStatus === "available") {
        score += 20;
        reasons.push("available ngayon");
      } else if (availabilityStatus === "busy") {
        score -= 12;
        reasons.push("busy ang status");
      } else {
        score -= 28;
        reasons.push("off-shift o hindi available");
      }

      if (inShift === true) {
        score += 8;
        reasons.push("pasok sa declared shift");
      } else if (inShift === false) {
        score -= 22;
        reasons.push("labas sa declared shift");
      }

      switch (user.assignmentRole) {
        case "resolver":
          score += 10;
          reasons.push("resolver ang role");
          break;
        case "owner":
          score += 8;
          reasons.push("primary case owner ang role");
          break;
        case "recipient":
          score += 4;
          reasons.push("handa sa first-touch intake");
          break;
        case "supervisor":
          if (message.urgency === "high") {
            score += 6;
            reasons.push("supervisor para sa urgent escalation");
          } else {
            score -= 6;
            reasons.push("mas bagay sa escalation kaysa routine handling");
          }
          break;
        default:
          break;
      }

      if (
        zone &&
        user.assignedZones?.some((assignedZone) => normalize(assignedZone) === zone)
      ) {
        score += 14;
        reasons.push(`covering ang ${zone}`);
      }

      const matchedExpertise = intentTags.filter((tag) => expertiseTags.includes(tag));
      if (matchedExpertise.length > 0) {
        score += matchedExpertise.length * 10;
        reasons.push(`may expertise sa ${matchedExpertise.join(", ")}`);
      }

      if (message.urgency === "high" && expertiseTags.includes("emergency")) {
        score += 12;
        reasons.push("handa sa urgent escalation");
      }

      if (message.urgency === "high" && expertiseTags.includes("field")) {
        score += 8;
        reasons.push("puwedeng mag-field action");
      }

      score += Math.max(-18, 12 - openAssignments * 4);
      reasons.push(
        openAssignments === 0
          ? "walang kasalukuyang open assignment"
          : `${openAssignments} open assignment${openAssignments > 1 ? "s" : ""}`
      );

      return {
        userId: user.id ?? user.uid ?? user.email,
        name: user.name,
        title: user.title,
        score,
        openAssignments,
        availabilityStatus,
        reasons,
      } satisfies AssignmentSuggestion;
    })
    .sort((left, right) => right.score - left.score);
}

export function getNextBestAction(message: SmsMessage) {
  if (message.closedAt || message.caseStatus === "closed") {
    return "Sarado na ang case na ito.";
  }

  if (message.multiConcernDetected) {
    return "Suriin kung kailangan itong hatiin sa hiwalay na case bago sumagot.";
  }

  if (message.threadReviewStatus === "pending") {
    return "I-review muna ang case threading bago magpadala ng final reply.";
  }

  if (message.registrationRequired || message.caseStatus === "awaiting_registration") {
    return "Kumpletuhin muna ang identity at registration details ng sender.";
  }

  if (message.clarificationNeeded || message.caseStatus === "awaiting_clarification") {
    return message.triageNextQuestion || "Humingi muna ng pinakamahalagang kulang na detalye.";
  }

  if (!message.assignedTo) {
    return "Mag-assign agad ng may hawak na staff bago tumagal ang case.";
  }

  if (!message.respondedAt) {
    return "Maglabas ng farmer-facing reply o human-reviewed advice.";
  }

  if (message.caseOutcomeStatus === "resolved" && message.resolutionConfirmationStatus === "awaiting_farmer") {
    return "Hintayin o i-follow up ang YES/NO confirmation ng magsasaka.";
  }

  if (message.followUpDueAt && !message.followUpSentAt) {
    return "May due follow-up; balikan ang magsasaka bago lumampas sa schedule.";
  }

  return "I-update ang outcome, assistance, o field visit para maging truthful ang reporting.";
}

export function getSlaAgingMeta(message: SmsMessage, now = Date.now()) {
  const startAt = new Date(message.assignedAt ?? message.timestamp).getTime();
  const dueAt = new Date(message.slaDueAt ?? 0).getTime();
  const ageHours = Number.isNaN(startAt)
    ? 0
    : Math.max(0, (now - startAt) / (1000 * 60 * 60));
  const overdue = !Number.isNaN(dueAt) && dueAt < now && !message.respondedAt && !message.closedAt;

  return {
    ageHours: Number(ageHours.toFixed(1)),
    overdue,
  };
}

export function getStaffingCoverageSummary(input: {
  users: User[];
  zoneNames: string[];
  smsMessages: SmsMessage[];
  now?: number;
}): StaffingCoverageSummary {
  const { users, zoneNames, smsMessages, now = Date.now() } = input;
  const barangayUsers = users.filter((user) => user.role === "barangay" && user.status !== "disabled");
  const uncoveredZones: string[] = [];
  const shiftLimitedZones: string[] = [];

  const overloadedUsers = barangayUsers
    .map((user) => ({
      userId: user.id ?? user.uid ?? user.email,
      name: user.name,
      openAssignments: countOpenAssignments(smsMessages, user.name),
    }))
    .filter((user) => user.openAssignments >= 4)
    .sort((left, right) => right.openAssignments - left.openAssignments);

  const offShiftUsers = barangayUsers
    .filter((user) => inferAvailability(user) === "off_shift" || isWithinShiftWindow(user, now) === false)
    .map((user) => user.name);

  const availableResponders = barangayUsers.filter((user) => {
    const availabilityStatus = inferAvailability(user);
    if (availabilityStatus !== "available") {
      return false;
    }

    const inShift = isWithinShiftWindow(user, now);
    return inShift !== false && getDirectHandlingRole(user);
  }).length;

  zoneNames
    .map((zone) => zone.trim())
    .filter(Boolean)
    .forEach((zone) => {
      const matchingUsers = barangayUsers.filter((user) =>
        user.assignedZones?.some((assignedZone) => normalize(assignedZone) === normalize(zone))
      );

      if (matchingUsers.length === 0) {
        uncoveredZones.push(zone);
        return;
      }

      const availableCoverage = matchingUsers.some((user) => {
        if (!getDirectHandlingRole(user)) {
          return false;
        }

        if (inferAvailability(user) !== "available") {
          return false;
        }

        const inShift = isWithinShiftWindow(user, now);
        return inShift !== false;
      });

      if (!availableCoverage) {
        shiftLimitedZones.push(zone);
      }
    });

  return {
    uncoveredZones,
    shiftLimitedZones,
    overloadedUsers,
    offShiftUsers,
    availableResponders,
  };
}
