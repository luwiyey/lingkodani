import { getEffectiveSmsCaseOutcome, isFarmerConfirmedResolution } from "@/lib/sms-case-outcomes";
import { normalizeSmsMessage } from "@/lib/sms-normalization";
import type { AlertHistoryEntry, Farmer, FarmerAssistanceRecord, FieldVisitTask, SmsMessage } from "@/lib/types";

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

const SIGNAL_TOKEN_MAP: Record<string, string[]> = {
  pest: ["peste", "uod", "daga", "kuhol", "rice bug", "borer", "leafminer", "bugs", "insekto", "palay bug"],
  leaf_yellowing: ["dilaw", "yellow", "naninilaw", "yellowing"],
  flooding: ["baha", "lubog", "water", "tubig", "ulan", "bagyo", "flood"],
  wilting: ["lanta", "dry", "natutuyo", "nalalanta", "init", "tagtuyot"],
  market: ["presyo", "price", "benta", "bagsak-presyo"],
  general: ["concern", "issue", "ulat", "sakit"],
};

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
  validationState: "unreviewed" | "suspected" | "confirmed" | "dismissed";
  validationSource?: "history" | "inferred";
  matchedAlertId?: string;
  recentReportCount: number;
  baselineReportCount: number;
  trendDelta: number;
  trendDirection: "rising" | "steady" | "cooling";
  recommendedAction: string;
};

export type OutbreakWatchSummary = {
  totalClusters: number;
  strongClusters: number;
  suspectedClusters: number;
  weakClusters: number;
  confirmedClusters: number;
  dismissedClusters: number;
  unreviewedClusters: number;
  risingClusters: number;
  coolingClusters: number;
  highestScore: number;
};

function inferAlertTypeForSignal(input: {
  message: SmsMessage;
  symptomKey: string;
}) {
  if (input.symptomKey === "flooding" || input.message.parsedIntent === "EMERGENCY") {
    return "flood";
  }

  if (input.symptomKey === "wilting" || input.message.parsedIntent === "WEATHER_HELP") {
    return "heat";
  }

  return "pest";
}

function getClusterAlertMatch(cluster: {
  zone: string;
  crop: string;
  signalKey: string;
  alertType: AlertHistoryEntry["type"];
}, alertHistory: AlertHistoryEntry[]) {
  const zone = cluster.zone.toLowerCase();
  const crop = cluster.crop.toLowerCase();
  const signalTokens = SIGNAL_TOKEN_MAP[cluster.signalKey] ?? SIGNAL_TOKEN_MAP.general;

  return [...alertHistory]
    .sort((left, right) => asMs(right.timestamp) - asMs(left.timestamp))
    .find((entry) => {
      if (entry.type !== cluster.alertType) {
        return false;
      }

      const haystack = `${entry.title} ${entry.message} ${entry.recommendation}`.toLowerCase();
      const zoneMatch = zone === "hindi tukoy" ? true : haystack.includes(zone);
      const cropMatch = crop === "hindi tukoy" ? true : haystack.includes(crop);
      const signalMatch = signalTokens.some((token) => haystack.includes(token));

      return zoneMatch && (cropMatch || signalMatch);
    });
}

function getClusterWindowCounts(input: {
  key: string;
  messages: SmsMessage[];
  farmers: Farmer[];
  now: string;
  recentWindowDays: number;
}) {
  const nowMs = asMs(input.now);
  const recentWindowMs = input.recentWindowDays * 24 * 60 * 60 * 1000;
  const previousWindowStart = nowMs - recentWindowMs * 2;
  const recentWindowStart = nowMs - recentWindowMs;
  let recentReportCount = 0;
  let baselineReportCount = 0;

  for (const message of input.messages) {
    if (!["PEST_DISEASE", "WEATHER_HELP", "EMERGENCY"].includes(message.parsedIntent)) {
      continue;
    }

    const farmer = input.farmers.find((entry) => entry.id === message.farmerId);
    const crop = extractCrop(message, farmer);
    const symptom = extractSymptomGroup(message);
    const clusterKey = `${farmer?.sitio ?? "Hindi tukoy"}::${crop}::${symptom.key}`;

    if (clusterKey !== input.key) {
      continue;
    }

    const timestamp = asMs(message.timestamp);

    if (timestamp >= recentWindowStart && timestamp <= nowMs) {
      recentReportCount += 1;
    } else if (timestamp >= previousWindowStart && timestamp < recentWindowStart) {
      baselineReportCount += 1;
    }
  }

  return {
    recentReportCount,
    baselineReportCount,
    trendDelta: recentReportCount - baselineReportCount,
  };
}

function getClusterTrendDirection(input: {
  recentReportCount: number;
  baselineReportCount: number;
  stage: "weak" | "suspected" | "strong";
}) {
  if (
    input.recentReportCount >= Math.max(input.baselineReportCount + 1, 2) &&
    (input.baselineReportCount === 0 || input.recentReportCount >= Math.ceil(input.baselineReportCount * 1.35))
  ) {
    return "rising" as const;
  }

  if (input.baselineReportCount >= 2 && input.recentReportCount + 1 < input.baselineReportCount) {
    return "cooling" as const;
  }

  if (input.stage === "strong" && input.recentReportCount >= 2) {
    return "rising" as const;
  }

  return "steady" as const;
}

function getClusterRecommendedAction(input: {
  stage: "weak" | "suspected" | "strong";
  validationState: OutbreakCluster["validationState"];
  trendDirection: OutbreakCluster["trendDirection"];
}) {
  if (input.validationState === "dismissed") {
    return "Huwag munang mag-broadcast. I-review lang ulit kung may bagong ebidensiya o panibagong ulat.";
  }

  if (input.validationState === "confirmed" && input.trendDirection === "rising") {
    return "Maghanda ng targeted broadcast at field validation sa hotspot zone sa loob ng 24 oras.";
  }

  if (input.validationState === "confirmed") {
    return "Panatilihin ang field monitoring at gumawa ng follow-up sa mga apektadong magsasaka.";
  }

  if (input.stage === "strong" || input.trendDirection === "rising") {
    return "I-validate agad sa AEW o barangay staff bago magdesisyon sa advisory broadcast.";
  }

  if (input.stage === "suspected") {
    return "Maghanda ng clarifying questions at hotspot review para makumpleto ang ebidensiya.";
  }

  return "I-monitor muna at hintayin ang dagdag na magkakatugmang ulat bago mag-escalate.";
}

export function inferOutbreakClusters(input: {
  messages: SmsMessage[];
  farmers: Farmer[];
  alertHistory?: AlertHistoryEntry[];
  now?: string;
  recentWindowDays?: number;
}) {
  const nowIso =
    input.now ??
    input.messages
      .map((message) => message.timestamp)
      .sort((left, right) => asMs(right) - asMs(left))[0] ??
    new Date().toISOString();
  const recentWindowDays = input.recentWindowDays ?? 7;
  const grouped = new Map<
    string,
    {
      zone: string;
      crop: string;
      signal: string;
      signalKey: string;
      alertType: AlertHistoryEntry["type"];
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
    const alertType = inferAlertTypeForSignal({
      message,
      symptomKey: symptom.key,
    });
    const urgencyWeight = message.urgency === "high" ? 3 : message.urgency === "medium" ? 2 : 1;
    const unresolved = getEffectiveSmsCaseOutcome(message) === "resolved" ? 0 : 1;

    grouped.set(key, {
      zone,
      crop,
      signal: symptom.label,
      signalKey: symptom.key,
      alertType,
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
      const stage = score >= 70 ? "strong" : score >= 42 ? "suspected" : "weak";
      const match = getClusterAlertMatch(
        {
          zone: entry.zone,
          crop: entry.crop,
          signalKey: entry.signalKey,
          alertType: entry.alertType,
        },
        input.alertHistory ?? []
      );
      const windowCounts = getClusterWindowCounts({
        key,
        messages: input.messages,
        farmers: input.farmers,
        now: nowIso,
        recentWindowDays,
      });
      const trendDirection = getClusterTrendDirection({
        recentReportCount: windowCounts.recentReportCount,
        baselineReportCount: windowCounts.baselineReportCount,
        stage,
      });
      const validationState =
        match?.validationState ??
        (stage === "strong" || stage === "suspected" ? "suspected" : "unreviewed");

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
        stage,
        latestObservedAt: entry.latestObservedAt,
        validationState,
        validationSource: match?.validationState ? "history" : "inferred",
        matchedAlertId: match?.id,
        recentReportCount: windowCounts.recentReportCount,
        baselineReportCount: windowCounts.baselineReportCount,
        trendDelta: windowCounts.trendDelta,
        trendDirection,
        recommendedAction: getClusterRecommendedAction({
          stage,
          validationState,
          trendDirection,
        }),
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

export function summarizeOutbreakClusters(clusters: OutbreakCluster[]): OutbreakWatchSummary {
  return clusters.reduce<OutbreakWatchSummary>(
    (summary, cluster) => {
      summary.totalClusters += 1;
      summary.highestScore = Math.max(summary.highestScore, cluster.score);

      if (cluster.stage === "strong") summary.strongClusters += 1;
      if (cluster.stage === "suspected") summary.suspectedClusters += 1;
      if (cluster.stage === "weak") summary.weakClusters += 1;

      if (cluster.validationState === "confirmed") summary.confirmedClusters += 1;
      if (cluster.validationState === "dismissed") summary.dismissedClusters += 1;
      if (cluster.validationState === "unreviewed") summary.unreviewedClusters += 1;

      if (cluster.trendDirection === "rising") summary.risingClusters += 1;
      if (cluster.trendDirection === "cooling") summary.coolingClusters += 1;

      return summary;
    },
    {
      totalClusters: 0,
      strongClusters: 0,
      suspectedClusters: 0,
      weakClusters: 0,
      confirmedClusters: 0,
      dismissedClusters: 0,
      unreviewedClusters: 0,
      risingClusters: 0,
      coolingClusters: 0,
      highestScore: 0,
    }
  );
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
