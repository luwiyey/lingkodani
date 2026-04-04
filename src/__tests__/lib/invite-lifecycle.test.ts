import { buildInviteLifecycleFields, getInviteLifecycleSummary, resolveInviteExpiry } from "@/lib/invite-lifecycle";
import type { User } from "@/lib/types";

function createPendingUser(overrides: Partial<User> = {}): User {
  return {
    email: "staff@lingkodani.gov.ph",
    name: "Staff User",
    role: "barangay",
    title: "Agricultural Extension Worker",
    barangay: "Batakil",
    phone: "+639171111111",
    preferredWorkspace: "simple",
    status: "pending_setup",
    inviteSentAt: "2026-04-01T08:00:00.000Z",
    inviteExpiresAt: "2026-04-04T08:00:00.000Z",
    ...overrides,
  };
}

describe("invite lifecycle", () => {
  it("marks fresh pending_setup invites as active", () => {
    const summary = getInviteLifecycleSummary(
      createPendingUser(),
      new Date("2026-04-02T08:00:00.000Z")
    );

    expect(summary.status).toBe("active");
    expect(summary.needsAttention).toBe(false);
  });

  it("marks stale invites as expired", () => {
    const summary = getInviteLifecycleSummary(
      createPendingUser(),
      new Date("2026-04-05T08:00:00.000Z")
    );

    expect(summary.status).toBe("expired");
    expect(summary.needsAttention).toBe(true);
  });

  it("marks revoked invites as revoked until used again", () => {
    const summary = getInviteLifecycleSummary(
      createPendingUser({
        inviteRevokedAt: "2026-04-02T10:00:00.000Z",
        inviteRevocationReason: "Review muna ang role assignment.",
      }),
      new Date("2026-04-02T11:00:00.000Z")
    );

    expect(summary.status).toBe("revoked");
    expect(summary.description).toContain("Review muna");
  });

  it("creates resend metadata with expiry and incremented count", () => {
    const lifecycle = buildInviteLifecycleFields(
      createPendingUser({
        inviteResendCount: 2,
      }),
      "2026-04-03T09:00:00.000Z"
    );

    expect(lifecycle.inviteExpiresAt).toBe(resolveInviteExpiry({
      inviteSentAt: "2026-04-03T09:00:00.000Z",
      inviteExpiresAt: lifecycle.inviteExpiresAt,
    }));
    expect(lifecycle.inviteResendCount).toBe(3);
    expect(lifecycle.inviteLastResentAt).toBe("2026-04-03T09:00:00.000Z");
  });
});
