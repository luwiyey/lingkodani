import {
  getCompletedOnboardingStepIds,
  isUserOnboardingComplete,
  shouldForceUserOnboarding,
  syncUserOnboardingState,
} from "@/lib/onboarding-checklist";
import type { User } from "@/lib/types";

function createUser(overrides: Partial<User> = {}): User {
  return {
    email: "staff@lingkodani.gov.ph",
    name: "Staff User",
    role: "barangay",
    title: "Agricultural Extension Worker",
    barangay: "Batakil",
    phone: "+639171111111",
    preferredWorkspace: "simple",
    status: "pending_setup",
    ...overrides,
  };
}

describe("onboarding checklist", () => {
  it("marks complete only when all required signals are present", () => {
    const incomplete = createUser({
      phoneVerifiedAt: "2026-04-03T08:00:00.000Z",
    });

    expect(getCompletedOnboardingStepIds(incomplete)).toEqual([
      "profile_details",
      "contact_number",
      "workspace",
    ]);
    expect(isUserOnboardingComplete(incomplete)).toBe(false);

    const complete = createUser({
      phoneVerifiedAt: "2026-04-03T08:00:00.000Z",
      privacyAcknowledgedAt: "2026-04-03T08:05:00.000Z",
      securityReviewVerifiedAt: "2026-04-03T08:10:00.000Z",
    });

    expect(isUserOnboardingComplete(complete)).toBe(true);
  });

  it("forces onboarding only for pending_setup accounts", () => {
    const pendingUser = createUser({
      phoneVerifiedAt: "2026-04-03T08:00:00.000Z",
    });
    const activeUser = createUser({
      status: "active",
    });

    expect(shouldForceUserOnboarding(pendingUser)).toBe(true);
    expect(shouldForceUserOnboarding(activeUser)).toBe(false);
  });

  it("promotes a pending_setup user to active when onboarding becomes complete", () => {
    const synced = syncUserOnboardingState(
      createUser({
        phoneVerifiedAt: "2026-04-03T08:00:00.000Z",
        privacyAcknowledgedAt: "2026-04-03T08:05:00.000Z",
        securityReviewVerifiedAt: "2026-04-03T08:10:00.000Z",
      }),
      "Tester",
      "2026-04-03T08:15:00.000Z"
    );

    expect(synced.status).toBe("active");
    expect(synced.onboarding?.completedAt).toBe("2026-04-03T08:15:00.000Z");
    expect(synced.onboarding?.completedStepIds).toHaveLength(5);
  });
});
