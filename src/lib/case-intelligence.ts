import { getEffectiveSmsCaseOutcome, isFarmerConfirmedResolution } from "@/lib/sms-case-outcomes";
import { normalizeSmsMessage } from "@/lib/sms-normalization";
import type { Farmer, FarmerAssistanceRecord, FieldVisitTask, SmsMessage } from "@/lib/types";

const CROP_HINTS = [
  "palay",
  "mais",
  "kamatis",
  "talong",
  "sitaw",
  "sibuyas",
  "gulay",
  "okra",
  "sili",
  "tubo",
  "monggo",
];

const SYMPTOM_GROUPS = [
  { key: "pest", label: "Pest pressure", tokens: ["peste", "uod", "daga", "kuhol", "leafminer", "borer", "bugs", "insekto"] },
  { key: "leaf_yellowing", label: "Leaf yellowing", tokens: ["dilaw", "yellow", "naninilaw", "batik"] },
  { key: "flooding", label: "Flood or water damage", tokens: ["baha", "lubog", "water", "tubig", "ulan", "bagyo"] },
  { key: "wilting", label: "Wilting or drying", tokens: ["lanta", "dry", "natutuyo", "nalalanta"] },
  { key: "market", label: "Market / price concern", tokens: ["presyo", "price", "benta", "bagsak-presyo"] },
];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function asMs(value?: string) {
  if (!value) {
    return Number.NaN;
  }

  return new Date(value).getTime();
}

function getNormalizedLowerText(message: string) {
  return normalizeSmsMessage(message).normalizedMessage.toLowerCase();
}

function extractCrop(message: SmsMessage, farmer?: Farmer) {
  const normalized = getNormalizedLowerText(message.message);
  const hintedCrop = CROP_HINTS.find((crop) => normalized.includes(crop));

  if (hintedCrop) {
    return hintedCrop;
  }

  return farmer?.crops[0]?.toLowerCase() ?? "hindi tukoy";
}

function extractSymptomGroup(message: SmsMessage) {
  const normalized = getNormalizedLowerText(message.message);
  const matched = SYMPTOM_GROUPS.find((group) =>
    group.tokens.some((token) => normalized.includes(token))
  );

  return matched ?? { key: "general", label: "General concern", tokens: [] };
}

function classifyInterventionType(input: {
  message: SmsMessage;
  assistanceRecords: FarmerAssistanceRecord[];
  fieldVisitTasks: FieldVisitTask[];
}) {
  const relatedAssistance = input.assistanceRecords.filter(
    (record) =>
      record.relatedSmsId === input.message.id ||
      (record.farmerId === input.message.farmerId && asMs(record.updatedAt) >= asMs(input.message.timestamp))
  );
  const relatedVisits = input.fieldVisitTasks.filter(
    (task) =>
      task.relatedSmsId === input.message.id ||
      (task.farmerId === input.message.farmerId && asMs(task.updatedAt) >= asMs(input.message.timestamp))
  );
  const completedVisits = relatedVisits.filter((task) => task.status === "completed");

  if (completedVisits.length > 0 && relatedAssistance.length > 0) {
    return "Visit + assistance";
  }

  if (completedVisits.length > 0) {
    return "Field visit";
  }

  if (relatedAssistance.length > 0) {
    return "Assistance";
  }

  if (input.message.respondedAt || input.message.autoReplySentAt) {
    return "SMS advice only";
  }

  return "Awaiting action";
}

export function getCaseOperationalConfidence(input: {
  message: SmsMessage;
  assistanceRecords: FarmerAssistanceRecord[];
  fieldVisitTasks: FieldVisitTask[];
  now?: string;
}) {
  const nowIso = input.now ?? new Date().toISOString();
  const currentTime = asMs(nowIso);
  const caseTime = asMs(input.message.caseOutcomeUpdatedAt ?? input.message.respondedAt ?? input.message.timestamp);
  const ageDays =
    Number.isNaN(caseTime) || Number.isNaN(currentTime)
      ? 0
      : Math.max(0, (currentTime - caseTime) / (1000 * 60 * 60 * 24));
  const relatedAssistance = input.assistanceRecords.filter(
    (record) =>
      record.relatedSmsId === input.message.id ||
      (record.farmerId === input.message.farmerId && asMs(record.updatedAt) >= asMs(input.message.timestamp))
  );
  const relatedVisits = input.fieldVisitTasks.filter(
    (task) =>
      task.relatedSmsId === input.message.id ||
      (task.farmerId === input.message.farmerId && asMs(task.updatedAt) >= asMs(input.message.timestamp))
  );
  const completedVisits = relatedVisits.filter((task) => task.status === "completed");

  let confidence = input.message.aiConfidence;
  confidence -= Math.min(0.32, ageDays * 0.03);

  if (input.message.parsedIntent === "UNKNOWN") confidence -= 0.1;
  if (input.message.clarificationNeeded) confidence -= 0.08;
  if (input.message.registrationRequired || input.message.identityDetailsNeeded) confidence -= 0.05;
  if (input.message.status !== "pending_approval") confidence += 0.05;
  if (input.message.assignedTo) confidence += 0.04;
  if (input.message.respondedAt) confidence += 0.07;
  if (relatedAssistance.length > 0) confidence += 0.05;
  if (completedVisits.length > 0) confidence += 0.08;
  if (input.message.caseOutcomeStatus) confidence += 0.04;
  if (isFarmerConfirmedResolution(input.message)) confidence += 0.1;
  if (input.message.resolutionConfirmationStatus === "reopened") confidence -= 0.12;

  const score = clamp(Number(confidence.toFixed(2)), 0.15, 0.99);
  const band = score >= 0.75 ? "high" : score >= 0.5 ? "medium" : "low";

  return {
    score,
    ageDays: Number(ageDays.toFixed(1)),
    band,
  };
}

export type OutbreakCluster = {
  key: string;
  zone: string;
  crop: string;
  signal: string;
  affectedFarmers: number;
  reportCount: number;
  unresolvedCount: number;
  urgencyWeight: number;
  score: number;
  stage: "weak" | "suspected" | "strong";
  latestObservedAt: string;
};

export function inferOutbreakClusters(input: {
  messages: SmsMessage[];
  farmers: Farmer[];
}) {
  const grouped = new Map<
    string,
    {
      zone: string;
      crop: string;
      signal: string;
      reportCount: number;
      farmerIds: Set<string>;
      unresolvedCount: number;
      urgencyWeight: number;
      latestObservedAt: string;
    }
  >();

  for (const message of input.messages) {
    if (!["PEST_DISEASE", "WEATHER_HELP", "EMERGENCY"].includes(message.parsedIntent)) {
      continue;
    }

    const farmer = input.farmers.find((entry) => entry.id === message.farmerId);
    const zone = farmer?.sitio ?? "Hindi tukoy";
    const crop = extractCrop(message, farmer);
    const symptom = extractSymptomGroup(message);
    const key = `${zone}::${crop}::${symptom.key}`;
    const current = grouped.get(key);
    const urgencyWeight = message.urgency === "high" ? 3 : message.urgency === "medium" ? 2 : 1;
    const unresolved = getEffectiveSmsCaseOutcome(message) === "resolved" ? 0 : 1;

    grouped.set(key, {
      zone,
      crop,
      signal: symptom.label,
      reportCount: (current?.reportCount ?? 0) + 1,
      farmerIds: new Set([...(current?.farmerIds ?? []), message.farmerId]),
      unresolvedCount: (current?.unresolvedCount ?? 0) + unresolved,
      urgencyWeight: (current?.urgencyWeight ?? 0) + urgencyWeight,
      latestObservedAt:
        asMs(message.timestamp) > asMs(current?.latestObservedAt)
          ? message.timestamp
          : current?.latestObservedAt ?? message.timestamp,
    });
  }

  return [...grouped.entries()]
    .map(([key, entry]) => {
      const score = entry.reportCount * 12 + entry.farmerIds.size * 9 + entry.unresolvedCount * 5 + entry.urgencyWeight * 4;

      return {
        key,
        zone: entry.zone,
        crop: entry.crop,
        signal: entry.signal,
        affectedFarmers: entry.farmerIds.size,
        reportCount: entry.reportCount,
        unresolvedCount: entry.unresolvedCount,
        urgencyWeight: entry.urgencyWeight,
        score,
        stage: score >= 70 ? "strong" : score >= 42 ? "suspected" : "weak",
        latestObservedAt: entry.latestObservedAt,
      } satisfies OutbreakCluster;
    })
    .filter((cluster) => cluster.reportCount >= 2)
    .sort((left, right) => right.score - left.score);
}

export function buildOutbreakSeries(input: {
  messages: SmsMessage[];
  farmers: Farmer[];
}) {
  const clusters = inferOutbreakClusters(input);
  const dayCounts = new Map<string, number>();

  for (const cluster of clusters) {
    const date = cluster.latestObservedAt.slice(5, 10);
    dayCounts.set(date, (dayCounts.get(date) ?? 0) + cluster.reportCount);
  }

  return [...dayCounts.entries()]
    .sort((left, right) => left[0].localeCompare(right[0]))
    .map(([date, ulat]) => ({ date, ulat }));
}

export type InterventionEffectiveness = {
  type: string;
  totalCases: number;
  resolvedCases: number;
  confirmedCases: number;
  reopenedCases: number;
  avgConfidence: number;
  resolvedRate: number;
  confirmedRate: number;
};

export function buildInterventionEffectiveness(input: {
  messages: SmsMessage[];
  assistanceRecords: FarmerAssistanceRecord[];
  fieldVisitTasks: FieldVisitTask[];
  now?: string;
}) {
  const grouped = new Map<
    string,
    {
      totalCases: number;
      resolvedCases: number;
      confirmedCases: number;
      reopenedCases: number;
      confidenceSum: number;
    }
  >();

  for (const message of input.messages) {
    const type = classifyInterventionType({
      message,
      assistanceRecords: input.assistanceRecords,
      fieldVisitTasks: input.fieldVisitTasks,
    });
    const current = grouped.get(type);
    const confidence = getCaseOperationalConfidence({
      message,
      assistanceRecords: input.assistanceRecords,
      fieldVisitTasks: input.fieldVisitTasks,
      now: input.now,
    }).score;
    const resolved = getEffectiveSmsCaseOutcome(message) === "resolved" ? 1 : 0;
    const confirmed = isFarmerConfirmedResolution(message) ? 1 : 0;
    const reopened = message.resolutionConfirmationStatus === "reopened" ? 1 : 0;

    grouped.set(type, {
      totalCases: (current?.totalCases ?? 0) + 1,
      resolvedCases: (current?.resolvedCases ?? 0) + resolved,
      confirmedCases: (current?.confirmedCases ?? 0) + confirmed,
      reopenedCases: (current?.reopenedCases ?? 0) + reopened,
      confidenceSum: (current?.confidenceSum ?? 0) + confidence,
    });
  }

  return [...grouped.entries()]
    .map(([type, entry]) => ({
      type,
      totalCases: entry.totalCases,
      resolvedCases: entry.resolvedCases,
      confirmedCases: entry.confirmedCases,
      reopenedCases: entry.reopenedCases,
      avgConfidence: Number((entry.confidenceSum / Math.max(entry.totalCases, 1)).toFixed(2)),
      resolvedRate: Number(((entry.resolvedCases / Math.max(entry.totalCases, 1)) * 100).toFixed(1)),
      confirmedRate: Number(((entry.confirmedCases / Math.max(entry.totalCases, 1)) * 100).toFixed(1)),
    }))
    .sort((left, right) => {
      if (right.confirmedRate !== left.confirmedRate) {
        return right.confirmedRate - left.confirmedRate;
      }

      return right.totalCases - left.totalCases;
    });
}
