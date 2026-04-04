import { normalizePhone } from "@/lib/sms-simulator";
import type {
  Farmer,
  FarmerDuplicateRiskLevel,
  FarmerIdentityTrustLevel,
  FarmerProfileRevision,
  FarmerProfileRevisionSource,
  FarmerProfileSnapshot,
} from "@/lib/types";

export type FarmerDuplicateMatchType = Exclude<FarmerDuplicateRiskLevel, "none">;

export type FarmerDuplicateMatch = {
  farmerId: string;
  score: number;
  matchType: FarmerDuplicateMatchType;
  confidenceLabel: "medium" | "high";
  reasons: string[];
};

type ReconcileFarmerIdentityOptions = {
  now?: string;
};

type FarmerProfileRevisionOptions = {
  previousFarmer?: Farmer;
  nextFarmer: Farmer;
  changedBy: string;
  source: FarmerProfileRevisionSource;
  reason?: string;
  changedAt?: string;
};

const UNKNOWN_NAME = "hindi pa nakilalang magsasaka";
const UNKNOWN_LOCATION = "hindi tukoy";

function normalizeName(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeName(name: string) {
  return normalizeName(name)
    .split(" ")
    .filter((token) => token.length >= 2);
}

function tokenOverlapScore(left: string[], right: string[]) {
  if (left.length === 0 || right.length === 0) {
    return 0;
  }

  const rightSet = new Set(right);
  const shared = left.filter((token) => rightSet.has(token));
  return shared.length / Math.max(left.length, right.length);
}

function normalizeLocation(value: string) {
  return value.trim().toLowerCase();
}

function sameLocation(left: Farmer, right: Farmer) {
  return (
    normalizeLocation(left.barangay) === normalizeLocation(right.barangay) &&
    normalizeLocation(left.sitio) === normalizeLocation(right.sitio)
  );
}

function sameBarangay(left: Farmer, right: Farmer) {
  return normalizeLocation(left.barangay) === normalizeLocation(right.barangay);
}

function sameHouseholdLabel(left?: string, right?: string) {
  if (!left || !right) {
    return false;
  }

  return normalizeName(left) === normalizeName(right);
}

function sharedCrops(left: Farmer, right: Farmer) {
  const rightSet = new Set(right.crops.map((crop) => normalizeName(crop)));
  return left.crops
    .map((crop) => normalizeName(crop))
    .filter((crop) => rightSet.has(crop));
}

function farmSizeSimilarity(left: number, right: number) {
  if (left <= 0 || right <= 0) {
    return 0;
  }

  const delta = Math.abs(left - right);
  const maxValue = Math.max(left, right);

  if (delta <= 0.2) {
    return 1;
  }

  if (delta / maxValue <= 0.25) {
    return 0.65;
  }

  if (delta / maxValue <= 0.5) {
    return 0.35;
  }

  return 0;
}

function isKnownName(name: string) {
  const normalized = normalizeName(name);
  return Boolean(normalized) && normalized !== UNKNOWN_NAME;
}

function isKnownLocation(value: string) {
  const normalized = normalizeLocation(value);
  return Boolean(normalized) && normalized !== UNKNOWN_LOCATION;
}

function clampConfidence(value: number) {
  return Math.max(0, Math.min(1, Number(value.toFixed(2))));
}

function createDeterministicHouseholdId(seed: string) {
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }

  return `HH-${hash.toString(36).toUpperCase()}`;
}

function resolveHouseholdFields(farmer: Farmer) {
  const explicitSharedPhone = Boolean(farmer.sharedPhone);
  const householdLabel = farmer.householdLabel?.trim();

  if (!explicitSharedPhone && !householdLabel) {
    return {
      householdId: undefined,
      householdLabel: undefined,
      sharedPhone: false,
    } as const;
  }

  const resolvedLabel =
    householdLabel ||
    `Sambahayan sa ${farmer.sitio || "Hindi tukoy"} (${farmer.phone || "walang numero"})`;
  const householdSeed = [
    normalizePhone(farmer.phone),
    normalizeName(resolvedLabel),
    normalizeLocation(farmer.barangay),
    normalizeLocation(farmer.sitio),
  ]
    .filter(Boolean)
    .join("|");

  return {
    householdId: farmer.householdId ?? createDeterministicHouseholdId(householdSeed),
    householdLabel: resolvedLabel,
    sharedPhone: true,
  } as const;
}

export function findPossibleFarmerDuplicates(target: Farmer, farmers: Farmer[]) {
  const targetPhone = normalizePhone(target.phone);
  const targetName = normalizeName(target.name);
  const targetTokens = tokenizeName(target.name);

  return farmers
    .filter((candidate) => candidate.id !== target.id)
    .filter((candidate) => !candidate.mergedIntoFarmerId)
    .map<FarmerDuplicateMatch | null>((candidate) => {
      const candidatePhone = normalizePhone(candidate.phone);
      const candidateName = normalizeName(candidate.name);
      const overlap = tokenOverlapScore(targetTokens, tokenizeName(candidate.name));
      const crops = sharedCrops(target, candidate);
      const samePhone = Boolean(targetPhone && candidatePhone && targetPhone === candidatePhone);
      const exactName = Boolean(targetName && candidateName && targetName === candidateName);
      const exactLocation = sameLocation(target, candidate);
      const sharedLocation = sameBarangay(target, candidate);
      const sizeSimilarity = farmSizeSimilarity(target.farmSize, candidate.farmSize);
      const sharedHousehold = sameHouseholdLabel(target.householdLabel, candidate.householdLabel);

      let score = 0;
      const reasons: string[] = [];

      if (samePhone) {
        score += 0.56;
        reasons.push("parehong numero");
      }

      if (exactName) {
        score += 0.28;
        reasons.push("parehong pangalan");
      } else if (overlap >= 0.8) {
        score += 0.2;
        reasons.push("halos pareho ang pangalan");
      } else if (overlap >= 0.55) {
        score += 0.14;
        reasons.push("magkahawig ang pangalan");
      }

      if (exactLocation) {
        score += 0.16;
        reasons.push("parehong lokasyon");
      } else if (sharedLocation) {
        score += 0.08;
        reasons.push("parehong barangay");
      }

      if (crops.length > 0) {
        score += 0.08;
        reasons.push(`shared crop: ${crops.join(", ")}`);
      }

      if (sizeSimilarity >= 0.65) {
        score += 0.06;
        reasons.push("magkalapit ang lawak ng bukid");
      }

      if (sharedHousehold) {
        score += 0.18;
        reasons.push("parehong household label");
      }

      if (target.sharedPhone && candidate.sharedPhone && samePhone) {
        score += 0.05;
        reasons.push("minarkahang shared phone");
      }

      let matchType: FarmerDuplicateMatchType | null = null;

      if (samePhone && exactName && (exactLocation || sizeSimilarity >= 0.35)) {
        matchType = "high_duplicate";
      } else if (
        samePhone &&
        !exactName &&
        (
          (sharedHousehold && (target.sharedPhone || candidate.sharedPhone)) ||
          (overlap < 0.45 && (exactLocation || target.sharedPhone || candidate.sharedPhone))
        )
      ) {
        matchType = "shared_household";
      } else if (score >= 0.62) {
        matchType = "possible_duplicate";
      }

      if (!matchType) {
        return null;
      }

      return {
        farmerId: candidate.id,
        score: Number(score.toFixed(2)),
        matchType,
        confidenceLabel: score >= 0.9 ? "high" : "medium",
        reasons,
      };
    })
    .filter((match): match is FarmerDuplicateMatch => Boolean(match))
    .sort((left, right) => right.score - left.score);
}

export function getFarmerIdentityAssessment(target: Farmer, farmers: Farmer[]) {
  const duplicateMatches = findPossibleFarmerDuplicates(target, farmers);
  const duplicateRiskLevel: FarmerDuplicateRiskLevel = duplicateMatches.some(
    (match) => match.matchType === "high_duplicate"
  )
    ? "high_duplicate"
    : duplicateMatches.some((match) => match.matchType === "possible_duplicate")
      ? "possible_duplicate"
      : duplicateMatches.some((match) => match.matchType === "shared_household")
        ? "shared_household"
        : "none";
  const confidenceReasons: string[] = [];
  let score = 0.34;

  if (isKnownName(target.name)) {
    score += 0.16;
    confidenceReasons.push("may malinaw na pangalan");
  }

  if (normalizePhone(target.phone)) {
    score += 0.12;
    confidenceReasons.push("may contact number");
  }

  if (isKnownLocation(target.sitio)) {
    score += 0.12;
    confidenceReasons.push("may tiyak na sitio o zone");
  }

  if (isKnownLocation(target.barangay)) {
    score += 0.06;
    confidenceReasons.push("nakatalang barangay");
  }

  if (target.crops.length > 0) {
    score += 0.08;
    confidenceReasons.push("may nakatalang pananim");
  }

  if (target.farmSize > 0) {
    score += 0.05;
    confidenceReasons.push("may lawak ng bukid");
  }

  if (target.age > 0 || (target.gender && target.gender !== "Hindi natukoy")) {
    score += 0.04;
    confidenceReasons.push("may karagdagang detalye sa profile");
  }

  if (target.status === "active" || target.status === "inactive") {
    score += 0.08;
    confidenceReasons.push("na-review na ng barangay");
  }

  if (target.sharedPhone) {
    if (target.householdLabel) {
      score += 0.05;
      confidenceReasons.push("nakamarka bilang shared household number");
    } else {
      score -= 0.05;
      confidenceReasons.push("shared number pero kulang ang household label");
    }
  } else {
    const samePhoneCount = farmers.filter(
      (candidate) => normalizePhone(candidate.phone) && normalizePhone(candidate.phone) === normalizePhone(target.phone)
    ).length;

    if (samePhoneCount <= 1) {
      score += 0.1;
      confidenceReasons.push("unique ang numero");
    }
  }

  if (duplicateRiskLevel === "high_duplicate") {
    score -= 0.3;
    confidenceReasons.push("may mataas na duplicate risk");
  } else if (duplicateRiskLevel === "possible_duplicate") {
    score -= 0.16;
    confidenceReasons.push("may kailangan pang duplicate review");
  } else if (duplicateRiskLevel === "shared_household") {
    confidenceReasons.push("may posibleng kaparehong household");
  }

  const confidenceScore = clampConfidence(score);
  const trustLevel: FarmerIdentityTrustLevel =
    confidenceScore >= 0.82 && target.status === "active" && duplicateRiskLevel !== "high_duplicate"
      ? "verified"
      : confidenceScore >= 0.56
        ? "probable"
        : "unknown";

  return {
    trustLevel,
    confidenceScore,
    confidenceReasons,
    duplicateRiskLevel,
    duplicateMatches,
  };
}

export function reconcileFarmerIdentity(
  farmer: Farmer,
  farmers: Farmer[],
  options?: ReconcileFarmerIdentityOptions
): Pick<
  Farmer,
  | "householdId"
  | "householdLabel"
  | "sharedPhone"
  | "identityTrustLevel"
  | "identityConfidenceScore"
  | "identityConfidenceReasons"
  | "duplicateRiskLevel"
> {
  const householdFields = resolveHouseholdFields(farmer);
  const candidateFarmer = {
    ...farmer,
    ...householdFields,
  };
  const assessment = getFarmerIdentityAssessment(candidateFarmer, farmers);

  return {
    ...householdFields,
    identityTrustLevel: assessment.trustLevel,
    identityConfidenceScore: assessment.confidenceScore,
    identityConfidenceReasons: [
      ...assessment.confidenceReasons,
      options?.now ? `huling assessment: ${options.now}` : undefined,
    ].filter((value): value is string => Boolean(value)),
    duplicateRiskLevel: assessment.duplicateRiskLevel,
  };
}

export function buildFarmerProfileSnapshot(farmer: Farmer): FarmerProfileSnapshot {
  return {
    name: farmer.name,
    phone: farmer.phone,
    barangay: farmer.barangay,
    sitio: farmer.sitio,
    crops: [...farmer.crops],
    farmSize: farmer.farmSize,
    age: farmer.age,
    gender: farmer.gender,
    status: farmer.status,
    householdId: farmer.householdId,
    householdLabel: farmer.householdLabel,
    sharedPhone: farmer.sharedPhone,
    sharedPhoneNotes: farmer.sharedPhoneNotes,
    identityTrustLevel: farmer.identityTrustLevel,
    identityConfidenceScore: farmer.identityConfidenceScore,
    duplicateRiskLevel: farmer.duplicateRiskLevel,
  };
}

function getChangedSnapshotFields(
  previousSnapshot: FarmerProfileSnapshot | null,
  nextSnapshot: FarmerProfileSnapshot
) {
  if (!previousSnapshot) {
    return Object.keys(nextSnapshot);
  }

  return Object.keys(nextSnapshot).filter((fieldName) => {
    const key = fieldName as keyof FarmerProfileSnapshot;
    return JSON.stringify(previousSnapshot[key]) !== JSON.stringify(nextSnapshot[key]);
  });
}

export function buildFarmerProfileRevision(
  options: FarmerProfileRevisionOptions
): Pick<Farmer, "profileHistory" | "profileVersion"> {
  const previousSnapshot = options.previousFarmer
    ? buildFarmerProfileSnapshot(options.previousFarmer)
    : null;
  const nextSnapshot = buildFarmerProfileSnapshot(options.nextFarmer);
  const changedFields = getChangedSnapshotFields(previousSnapshot, nextSnapshot);
  const previousHistory = options.previousFarmer?.profileHistory ?? [];
  const previousVersion = options.previousFarmer?.profileVersion ?? 0;

  if (changedFields.length === 0) {
    return {
      profileHistory: previousHistory,
      profileVersion: previousVersion,
    };
  }

  const nextVersion = previousVersion + 1;
  const revision: FarmerProfileRevision = {
    id: `FREV-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    version: nextVersion,
    changedAt: options.changedAt ?? new Date().toISOString(),
    changedBy: options.changedBy,
    source: options.source,
    reason: options.reason,
    changedFields,
    snapshot: nextSnapshot,
  };

  return {
    profileHistory: [...previousHistory, revision],
    profileVersion: nextVersion,
  };
}
