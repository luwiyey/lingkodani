import { buildAssignmentSuggestions, getStaffingCoverageSummary } from "@/lib/assignment-routing";
import type { Farmer, SmsMessage, User } from "@/lib/types";

const farmer: Farmer = {
  id: "FARM-1",
  name: "Juan Dela Cruz",
  age: 52,
  gender: "Lalaki",
  phone: "+639171234567",
  barangay: "Batakil",
  sitio: "Zone 1",
  farmSize: 1.5,
  crops: ["Palay"],
  registrationDate: "2025-01-01T00:00:00.000Z",
  lastSmsActivity: "2025-01-01T00:00:00.000Z",
  status: "active",
};

const message: SmsMessage = {
  id: "SMS-1",
  farmerId: farmer.id,
  farmerName: farmer.name,
  phone: farmer.phone,
  message: "May matinding peste sa palay namin sa Zone 1.",
  timestamp: "2025-01-05T01:00:00.000Z",
  parsedIntent: "PEST_DISEASE",
  urgency: "high",
  status: "approved",
  aiAdvice: "Maghintay ng field validation.",
  aiConfidence: 0.82,
  safetyFlag: "Medium",
};

describe("assignment routing", () => {
  it("prefers staff whose declared shift is active", () => {
    const users: User[] = [
      {
        id: "USER-1",
        email: "inside@example.com",
        name: "Inside Shift AEW",
        role: "barangay",
        status: "active",
        title: "Agricultural Extension Worker",
        availabilityStatus: "available",
        assignmentRole: "resolver",
        assignedZones: ["Zone 1"],
        expertiseTags: ["pest", "field"],
        shiftStartTime: "08:00",
        shiftEndTime: "17:00",
      },
      {
        id: "USER-2",
        email: "outside@example.com",
        name: "Outside Shift AEW",
        role: "barangay",
        status: "active",
        title: "Agricultural Extension Worker",
        availabilityStatus: "available",
        assignmentRole: "resolver",
        assignedZones: ["Zone 1"],
        expertiseTags: ["pest", "field"],
        shiftStartTime: "18:00",
        shiftEndTime: "23:00",
      },
    ];

    const suggestions = buildAssignmentSuggestions({
      message,
      users,
      farmers: [farmer],
      smsMessages: [],
      now: new Date("2025-01-05T09:30:00+08:00").getTime(),
    });

    expect(suggestions[0]?.name).toBe("Inside Shift AEW");
    expect(suggestions[0]?.reasons).toContain("pasok sa declared shift");
    expect(suggestions[1]?.reasons).toContain("labas sa declared shift");
  });

  it("keeps supervisors lower than owners for routine handling", () => {
    const users: User[] = [
      {
        id: "USER-OWNER",
        email: "owner@example.com",
        name: "Case Owner",
        role: "barangay",
        status: "active",
        title: "Barangay AEW",
        availabilityStatus: "available",
        assignmentRole: "owner",
        assignedZones: ["Zone 1"],
        expertiseTags: ["pest"],
      },
      {
        id: "USER-SUP",
        email: "supervisor@example.com",
        name: "Supervisor",
        role: "barangay",
        status: "active",
        title: "Barangay Captain",
        availabilityStatus: "available",
        assignmentRole: "supervisor",
        assignedZones: ["Zone 1"],
        expertiseTags: ["pest", "emergency"],
      },
    ];

    const routineMessage: SmsMessage = {
      ...message,
      urgency: "medium",
    };

    const suggestions = buildAssignmentSuggestions({
      message: routineMessage,
      users,
      farmers: [farmer],
      smsMessages: [],
    });

    expect(suggestions[0]?.name).toBe("Case Owner");
    expect(suggestions[1]?.reasons).toContain("mas bagay sa escalation kaysa routine handling");
  });

  it("flags uncovered and shift-limited zones in staffing coverage", () => {
    const users: User[] = [
      {
        id: "USER-Z1",
        email: "zone1@example.com",
        name: "Zone 1 Owner",
        role: "barangay",
        status: "active",
        title: "Barangay AEW",
        availabilityStatus: "available",
        assignmentRole: "owner",
        assignedZones: ["Zone 1"],
        shiftStartTime: "08:00",
        shiftEndTime: "17:00",
      },
      {
        id: "USER-Z2",
        email: "zone2@example.com",
        name: "Zone 2 Resolver",
        role: "barangay",
        status: "active",
        title: "Barangay AEW",
        availabilityStatus: "available",
        assignmentRole: "resolver",
        assignedZones: ["Zone 2"],
        shiftStartTime: "18:00",
        shiftEndTime: "23:00",
      },
    ];

    const summary = getStaffingCoverageSummary({
      users,
      zoneNames: ["Zone 1", "Zone 2", "Zone 3"],
      smsMessages: [],
      now: new Date("2025-01-05T09:30:00+08:00").getTime(),
    });

    expect(summary.uncoveredZones).toEqual(["Zone 3"]);
    expect(summary.shiftLimitedZones).toEqual(["Zone 2"]);
    expect(summary.availableResponders).toBe(1);
  });
});
