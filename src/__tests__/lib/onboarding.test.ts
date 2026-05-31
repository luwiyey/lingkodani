import { normalizeDemoProfile } from "@/lib/onboarding";
import type { User } from "@/lib/types";

describe("onboarding demo profile normalization", () => {
  it("keeps the privileged preview role while applying the requested workspace", () => {
    const developerProfile: User = {
      id: "dev-1",
      email: "dev@lingkodani.gov.ph",
      name: "Developer",
      role: "developer",
      title: "Platform Developer",
      preferredWorkspace: "detailed",
    };

    const normalized = normalizeDemoProfile(developerProfile, "simple");

    expect(normalized.role).toBe("developer");
    expect(normalized.email).toBe(developerProfile.email);
    expect(normalized.preferredWorkspace).toBe("simple");
  });
});
