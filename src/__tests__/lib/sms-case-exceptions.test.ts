import { getSmsCaseExceptionFlags } from "@/lib/sms-case-exceptions";
import type { SmsMessage } from "@/lib/types";

const baseMessage: SmsMessage = {
  id: "SMS-EX-1",
  farmerId: "FARM-1",
  farmerName: "Juan Dela Cruz",
  phone: "+639171234567",
  message: "Marami pong uod sa palay namin",
  timestamp: "2026-03-22T08:00:00.000Z",
  caseId: "CASE-1",
  caseStatus: "open",
  parsedIntent: "PEST_DISEASE",
  urgency: "high",
  status: "approved",
  aiAdvice: "Mag-ingat po at hintayin ang validation.",
  aiConfidence: 0.86,
  safetyFlag: "High",
};

describe("sms-case-exceptions", () => {
  it("flags urgent unassigned cases that stay open too long", () => {
    const flags = getSmsCaseExceptionFlags({
      message: baseMessage,
      now: "2026-03-22T11:00:00.000Z",
    });

    expect(flags.some((flag) => flag.id === "urgent_unassigned")).toBe(true);
  });

  it("flags resolved high-risk cases without evidence", () => {
    const flags = getSmsCaseExceptionFlags({
      message: {
        ...baseMessage,
        caseStatus: "closed",
        caseOutcomeStatus: "resolved",
        closedAt: "2026-03-22T12:00:00.000Z",
      },
      now: "2026-03-22T12:10:00.000Z",
    });

    expect(flags.some((flag) => flag.id === "missing_resolution_evidence")).toBe(true);
    expect(flags.some((flag) => flag.id === "reporting_incomplete")).toBe(true);
  });

  it("does not flag missing resolution evidence when linked assistance exists", () => {
    const flags = getSmsCaseExceptionFlags({
      message: {
        ...baseMessage,
        caseStatus: "closed",
        caseOutcomeStatus: "resolved",
        closedAt: "2026-03-22T12:00:00.000Z",
      },
      assistanceRecords: [
        {
          id: "ASSIST-1",
          farmerId: "FARM-1",
          relatedSmsId: "SMS-EX-1",
          type: "Technical Advice",
          title: "Nagbigay ng payo",
          details: "Nagbigay ng verified field intervention",
          status: "completed",
          providedBy: "AEW",
          createdAt: "2026-03-22T09:00:00.000Z",
          updatedAt: "2026-03-22T10:00:00.000Z",
        },
      ],
      now: "2026-03-22T12:10:00.000Z",
    });

    expect(flags.some((flag) => flag.id === "missing_resolution_evidence")).toBe(false);
  });

  it("flags failed outbound follow-through when the latest farmer message failed", () => {
    const flags = getSmsCaseExceptionFlags({
      message: baseMessage,
      outboundMessages: [
        {
          id: "OUT-1",
          smsMessageId: "SMS-EX-1",
          recipientPhone: "+639171234567",
          audience: "farmer",
          purpose: "manual_reply",
          body: "Reply",
          status: "failed",
          provider: "textbee",
          createdAt: "2026-03-22T08:30:00.000Z",
          lastStatusAt: "2026-03-22T08:31:00.000Z",
        },
      ],
      now: "2026-03-22T09:00:00.000Z",
    });

    expect(flags.some((flag) => flag.id === "last_farmer_outbound_failed")).toBe(true);
  });

  it("flags distressed cases with no assignee quickly", () => {
    const flags = getSmsCaseExceptionFlags({
      message: {
        ...baseMessage,
        sentiment: "distressed",
        urgency: "medium",
      },
      now: "2026-03-22T09:05:00.000Z",
    });

    expect(flags.some((flag) => flag.id === "distressed_unassigned")).toBe(true);
  });

  it("flags low-confidence dialect cases for lexicon review", () => {
    const flags = getSmsCaseExceptionFlags({
      message: {
        ...baseMessage,
        urgency: "medium",
        aiConfidence: 0.61,
        triageConfidence: 0.58,
        normalizationUnknownTokens: ["lamisaan", "nagrigat"],
      },
      now: "2026-03-22T08:30:00.000Z",
    });

    expect(flags.some((flag) => flag.id === "lexicon_review_needed")).toBe(true);
  });

  it("flags pending thread review before final reply", () => {
    const flags = getSmsCaseExceptionFlags({
      message: {
        ...baseMessage,
        urgency: "medium",
        threadReviewStatus: "pending",
        possibleDuplicateOfCaseId: "CASE-2",
      },
      now: "2026-03-22T08:30:00.000Z",
    });

    expect(flags.some((flag) => flag.id === "thread_review_blocked")).toBe(true);
  });
});
