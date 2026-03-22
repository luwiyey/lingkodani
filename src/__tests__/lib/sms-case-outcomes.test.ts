import {
  getCaseStatusForOutcome,
  getEffectiveSmsCaseOutcome,
  getSmsCaseOutcomeMeta,
} from "@/lib/sms-case-outcomes";

describe("sms-case-outcomes", () => {
  it("maps recorded outcomes to workflow case states", () => {
    expect(getCaseStatusForOutcome("monitoring")).toBe("monitoring");
    expect(getCaseStatusForOutcome("needs_follow_up")).toBe("monitoring");
    expect(getCaseStatusForOutcome("referred")).toBe("escalated");
    expect(getCaseStatusForOutcome("resolved")).toBe("monitoring");
  });

  it("derives a fallback outcome from older case records", () => {
    expect(
      getEffectiveSmsCaseOutcome({
        caseOutcomeStatus: undefined,
        caseStatus: "monitoring",
        closedAt: undefined,
      })
    ).toBe("monitoring");

    expect(
      getEffectiveSmsCaseOutcome({
        caseOutcomeStatus: undefined,
        caseStatus: "closed",
        closedAt: undefined,
      })
    ).toBe("resolved");

    expect(
      getEffectiveSmsCaseOutcome({
        caseOutcomeStatus: undefined,
        caseStatus: "escalated",
        closedAt: undefined,
      })
    ).toBe("referred");
  });

  it("returns display metadata for the UI", () => {
    const meta = getSmsCaseOutcomeMeta("improving");

    expect(meta?.label).toBe("May pagbuti");
    expect(meta?.helper).toContain("umuubra");
  });
});
