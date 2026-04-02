import type { Farmer } from "@/lib/types";
import { normalizePhone } from "@/lib/sms-simulator";

export type FarmerDuplicateMatch = {
  farmerId: string;
  score: number;
  reasons: string[];
};

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

function sameLocation(left: Farmer, right: Farmer) {
  return (
    left.barangay.trim().toLowerCase() === right.barangay.trim().toLowerCase() &&
    left.sitio.trim().toLowerCase() === right.sitio.trim().toLowerCase()
  );
}

function sharedCrops(left: Farmer, right: Farmer) {
  const rightSet = new Set(right.crops.map((crop) => crop.trim().toLowerCase()));
  return left.crops
    .map((crop) => crop.trim().toLowerCase())
    .filter((crop) => rightSet.has(crop));
}

export function findPossibleFarmerDuplicates(target: Farmer, farmers: Farmer[]) {
  const targetPhone = normalizePhone(target.phone);
  const targetName = normalizeName(target.name);
  const targetTokens = tokenizeName(target.name);

  return farmers
    .filter((candidate) => candidate.id !== target.id)
    .filter((candidate) => !candidate.mergedIntoFarmerId)
    .map<FarmerDuplicateMatch | null>((candidate) => {
      let score = 0;
      const reasons: string[] = [];
      const candidatePhone = normalizePhone(candidate.phone);
      const candidateName = normalizeName(candidate.name);
      const overlap = tokenOverlapScore(targetTokens, tokenizeName(candidate.name));
      const crops = sharedCrops(target, candidate);

      if (targetPhone && candidatePhone && targetPhone === candidatePhone) {
        score += 1;
        reasons.push("parehong numero");
      }

      if (targetName && candidateName && targetName === candidateName) {
        score += 0.65;
        reasons.push("parehong pangalan");
      } else if (overlap >= 0.6) {
        score += 0.38;
        reasons.push("magkahawig ang pangalan");
      }

      if (sameLocation(target, candidate)) {
        score += 0.22;
        reasons.push("parehong lokasyon");
      }

      if (crops.length > 0) {
        score += 0.12;
        reasons.push(`shared crop: ${crops.join(", ")}`);
      }

      if (score < 0.6) {
        return null;
      }

      return {
        farmerId: candidate.id,
        score: Number(score.toFixed(2)),
        reasons,
      };
    })
    .filter((match): match is FarmerDuplicateMatch => Boolean(match))
    .sort((left, right) => right.score - left.score);
}
