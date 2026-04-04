import {
  buildFarmerProfileRevision,
  findPossibleFarmerDuplicates,
  getFarmerIdentityAssessment,
  reconcileFarmerIdentity,
} from "@/lib/farmer-identity";
import type { Farmer } from "@/lib/types";

const baseFarmer: Farmer = {
  id: "FARM-1",
  name: "Juan Dela Cruz",
  age: 45,
  gender: "Lalaki",
  phone: "+639171230001",
  barangay: "Batakil",
  sitio: "Zone 1",
  farmSize: 1,
  crops: ["Palay"],
  registrationDate: "2026-03-01T00:00:00.000Z",
  lastSmsActivity: "2026-03-21T00:00:00.000Z",
  status: "active",
};

describe("farmer identity helpers", () => {
  it("classifies obvious same-person records as high duplicate risk", () => {
    const duplicates = findPossibleFarmerDuplicates(baseFarmer, [
      {
        ...baseFarmer,
        id: "FARM-2",
        phone: "09171230001",
      },
    ]);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].matchType).toBe("high_duplicate");
    expect(duplicates[0].reasons).toContain("parehong numero");
    expect(duplicates[0].reasons).toContain("parehong pangalan");
  });

  it("distinguishes shared-household numbers from duplicate identities", () => {
    const duplicates = findPossibleFarmerDuplicates(
      {
        ...baseFarmer,
        id: "FARM-2",
        name: "Maria Dela Cruz",
        sharedPhone: true,
        householdLabel: "Sambahayan nina Dela Cruz",
      },
      [
        {
          ...baseFarmer,
          id: "FARM-3",
          sharedPhone: true,
          householdLabel: "Sambahayan nina Dela Cruz",
        },
      ]
    );

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].matchType).toBe("shared_household");
  });

  it("computes stronger trust for complete, reviewed farmer profiles", () => {
    const identity = getFarmerIdentityAssessment(baseFarmer, [baseFarmer]);

    expect(identity.trustLevel).toBe("verified");
    expect(identity.confidenceScore).toBeGreaterThanOrEqual(0.8);
  });

  it("adds shared-household metadata and keeps trust score on reconciliation", () => {
    const reconciled = reconcileFarmerIdentity(
      {
        ...baseFarmer,
        status: "pending_approval",
        sharedPhone: true,
        householdLabel: "Sambahayan nina Dela Cruz",
      },
      [baseFarmer],
      { now: "2026-04-04T08:00:00.000Z" }
    );

    expect(reconciled.sharedPhone).toBe(true);
    expect(reconciled.householdId).toMatch(/^HH-/);
    expect(reconciled.identityConfidenceReasons?.some((reason) => reason.includes("huling assessment"))).toBe(true);
  });

  it("tracks profile history revisions when key identity fields change", () => {
    const previousFarmer: Farmer = {
      ...baseFarmer,
      profileVersion: 1,
      profileHistory: [],
    };
    const revision = buildFarmerProfileRevision({
      previousFarmer,
      nextFarmer: {
        ...previousFarmer,
        sharedPhone: true,
        householdLabel: "Sambahayan nina Dela Cruz",
      },
      changedBy: "Brgy. Admin",
      source: "household_update",
      changedAt: "2026-04-04T08:00:00.000Z",
      reason: "Shared SIM review",
    });

    expect(revision.profileVersion).toBe(2);
    expect(revision.profileHistory).toHaveLength(1);
    expect(revision.profileHistory?.[0].changedFields).toContain("sharedPhone");
    expect(revision.profileHistory?.[0].changedFields).toContain("householdLabel");
  });
});
