import {
  buildInterventionEffectiveness,
  getCaseOperationalConfidence,
  inferOutbreakClusters,
  summarizeOutbreakClusters,
} from "@/lib/case-intelligence";
import type { AlertHistoryEntry, Farmer, FarmerAssistanceRecord, FieldVisitTask, SmsMessage } from "@/lib/types";

const farmers: Farmer[] = [
  {
    id: "FARM-1",
    name: "Juan",
    age: 40,
    gender: "Lalaki",
    phone: "+639171234567",
    barangay: "Batakil",
    sitio: "Zone 1",
    farmSize: 2,
    crops: ["Palay"],
    registrationDate: "2025-01-01T00:00:00.000Z",
    lastSmsActivity: "2025-01-05T00:00:00.000Z",
    status: "active",
  },
  {
    id: "FARM-2",
    name: "Maria",
    age: 38,
    gender: "Babae",
    phone: "+639181234567",
    barangay: "Batakil",
    sitio: "Zone 1",
    farmSize: 1.5,
    crops: ["Palay"],
    registrationDate: "2025-01-01T00:00:00.000Z",
    lastSmsActivity: "2025-01-05T00:00:00.000Z",
    status: "active",
  },
];

const messages: SmsMessage[] = [
  {
    id: "SMS-1",
    farmerId: "FARM-1",
    farmerName: "Juan",
    phone: "+639171234567",
    message: "May uod at dilaw na dahon sa palay namin sa Zone 1",
    timestamp: "2025-01-05T00:00:00.000Z",
    parsedIntent: "PEST_DISEASE",
    urgency: "high",
    status: "approved",
    aiAdvice: "I-check po ang infestation.",
    aiConfidence: 0.86,
    safetyFlag: "Medium",
    caseOutcomeStatus: "resolved",
    resolutionConfirmationStatus: "confirmed_by_farmer",
  },
  {
    id: "SMS-2",
    farmerId: "FARM-2",
    farmerName: "Maria",
    phone: "+639181234567",
    message: "Palay din po, may peste at dilaw sa Zone 1",
    timestamp: "2025-01-06T00:00:00.000Z",
    parsedIntent: "PEST_DISEASE",
    urgency: "high",
    status: "approved",
    aiAdvice: "Mag-monitor po.",
    aiConfidence: 0.82,
    safetyFlag: "Medium",
  },
];

const alertHistory: AlertHistoryEntry[] = [
  {
    id: "ALH-1",
    title: "Pagdami ng Peste sa Palayan",
    timestamp: "2025-01-06T06:00:00.000Z",
    type: "pest",
    severity: "Warning",
    validationState: "confirmed",
    triggerScore: 66,
    message: "Babala: sunod-sunod na ulat ng peste sa palay ng Zone 1.",
    recommendation: "Mag-inspeksyon agad sa Zone 1 palayan.",
    source: "ai",
    recipientFarmerIds: ["FARM-1", "FARM-2"],
    sentCount: 2,
    failedCount: 0,
  },
];

describe("case-intelligence", () => {
  it("infers outbreak clusters from repeated zone/crop/symptom signals", () => {
    const clusters = inferOutbreakClusters({
      messages,
      farmers,
      alertHistory,
      now: "2025-01-07T00:00:00.000Z",
    });

    expect(clusters[0]?.zone).toBe("Zone 1");
    expect(clusters[0]?.reportCount).toBe(2);
    expect(clusters[0]?.score).toBeGreaterThanOrEqual(40);
    expect(clusters[0]?.validationState).toBe("confirmed");
    expect(clusters[0]?.trendDirection).toBe("rising");
    expect(clusters[0]?.recentReportCount).toBe(2);
    expect(clusters[0]?.matchedAlertId).toBe("ALH-1");
  });

  it("boosts operational confidence when visits or assistance exist", () => {
    const confidence = getCaseOperationalConfidence({
      message: messages[0],
      assistanceRecords: [
        {
          id: "ASSIST-1",
          farmerId: "FARM-1",
          relatedSmsId: "SMS-1",
          type: "Technical Advice",
          title: "Advice",
          details: "Nagbigay ng payo",
          status: "completed",
          providedBy: "AEW",
          createdAt: "2025-01-05T01:00:00.000Z",
          updatedAt: "2025-01-05T01:00:00.000Z",
        } satisfies FarmerAssistanceRecord,
      ],
      fieldVisitTasks: [
        {
          id: "VISIT-1",
          farmerId: "FARM-1",
          title: "Visit",
          purpose: "Inspect",
          scheduledFor: "2025-01-05T02:00:00.000Z",
          assignedTo: "AEW",
          priority: "high",
          status: "completed",
          createdAt: "2025-01-05T00:30:00.000Z",
          updatedAt: "2025-01-05T02:00:00.000Z",
        } satisfies FieldVisitTask,
      ],
      now: "2025-01-07T00:00:00.000Z",
    });

    expect(confidence.band).toBe("high");
    expect(confidence.score).toBeGreaterThan(0.85);
  });

  it("surfaces intervention effectiveness by intervention type", () => {
    const summary = buildInterventionEffectiveness({
      messages,
      assistanceRecords: [],
      fieldVisitTasks: [],
      now: "2025-01-07T00:00:00.000Z",
    });

    expect(summary[0]?.type).toBe("Awaiting action");
    expect(summary[0]?.totalCases).toBeGreaterThanOrEqual(1);
  });

  it("builds outbreak watch summaries for supervisor dashboards", () => {
    const clusters = inferOutbreakClusters({
      messages,
      farmers,
      alertHistory,
      now: "2025-01-07T00:00:00.000Z",
    });
    const summary = summarizeOutbreakClusters(clusters);

    expect(summary.totalClusters).toBe(1);
    expect(summary.confirmedClusters).toBe(1);
    expect(summary.risingClusters).toBe(1);
    expect(summary.highestScore).toBeGreaterThan(0);
  });
});
