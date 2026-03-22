import { processOfficialInboundSms, processOfficialReminderMessage, parseStaffSmsCommand } from "@/lib/services/staff-sms-service";
import type { SmsMessage, User } from "@/lib/types";

function createMessage(overrides: Partial<SmsMessage> = {}): SmsMessage {
  return {
    id: "SMS-1",
    farmerId: "F-1",
    farmerName: "Juan Dela Cruz",
    phone: "+639171234567",
    message: "Binabaha ang palayan namin at kailangan ng tulong.",
    timestamp: "2026-03-20T08:00:00.000Z",
    caseId: "CASE-F-1",
    caseStatus: "open",
    status: "pending_approval",
    parsedIntent: "EMERGENCY",
    urgency: "high",
    aiAdvice: "Initial advice",
    aiConfidence: 0.82,
    safetyFlag: "High",
    autoReplySentAt: "2026-03-20T08:05:00.000Z",
    ...overrides,
  };
}

describe("staff SMS service", () => {
  it("parses reply and resolve commands with case ids", () => {
    expect(parseStaffSmsCommand("REPLY CASE-F-1 I-check ang irrigation at iwasan muna ang malalim na bahagi.")).toEqual({
      action: "reply",
      caseId: "CASE-F-1",
      content: "I-check ang irrigation at iwasan muna ang malalim na bahagi.",
    });

    expect(parseStaffSmsCommand("RESOLVED case-f-1 Nabisita na at ligtas na ang lugar.")).toEqual({
      action: "resolve",
      caseId: "CASE-F-1",
      content: "Nabisita na at ligtas na ang lugar.",
    });
  });

  it("assigns the reminder to the saved AEW phone and records an official reminder outbound", async () => {
    const provider = {
      sendMessage: jest.fn().mockResolvedValue({
        status: "sent",
        providerMessageId: "provider-1",
      }),
    };
    const users: User[] = [
      {
        id: "admin-1",
        email: "brgy-admin@lingkodani.gov.ph",
        name: "Brgy. Admin",
        role: "barangay",
        title: "Barangay Administrator",
        phone: "+639171111111",
      },
      {
        id: "aew-1",
        email: "aew@lingkodani.gov.ph",
        name: "AEW Jose Rizal",
        role: "barangay",
        title: "AEW",
        phone: "+639174444444",
      },
    ];
    const result = await processOfficialReminderMessage({
      message: createMessage(),
      users,
      provider,
      providerName: "live-textbee",
      now: new Date("2026-03-20T08:10:00.000Z").getTime(),
      force: true,
    });

    expect(result).not.toBeNull();
    expect(result?.updatedMessage.assignedTo).toBe("AEW Jose Rizal");
    expect(result?.updatedMessage.officialReminderRecipientPhone).toBe("+639174444444");
    expect(result?.outboundRecord.audience).toBe("official");
    expect(result?.outboundRecord.purpose).toBe("official_reminder");
    expect(provider.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "+639174444444",
      })
    );
  });

  it("lets an official answer the farmer by SMS and keeps the case open until resolved", async () => {
    const provider = {
      sendMessage: jest.fn().mockResolvedValue({
        status: "sent",
        providerMessageId: "provider-2",
      }),
    };
    const official: User = {
      id: "aew-1",
      email: "aew@lingkodani.gov.ph",
      name: "AEW Jose Rizal",
      role: "barangay",
      title: "AEW",
      phone: "+639174444444",
    };
    const result = await processOfficialInboundSms({
      phone: official.phone!,
      body: "Maglagay muna ng pansamantalang kanal at i-monitor ang lebel ng tubig.",
      official,
      messages: [
        createMessage({
          assignedTo: official.name,
          assignedAt: "2026-03-20T08:06:00.000Z",
          officialReminderRecipientName: official.name,
          officialReminderRecipientPhone: official.phone,
        }),
      ],
      provider,
      providerName: "live-textbee",
      now: new Date("2026-03-20T08:20:00.000Z").getTime(),
    });

    expect(result.kind).toBe("reply");
    expect(result.message?.caseStatus).toBe("monitoring");
    expect(result.message?.closedAt).toBeUndefined();
    expect(result.message?.officialReminderDueAt).toBeDefined();
    expect(result.outboundRecords[0]?.recipientPhone).toBe("+639171234567");
    expect(result.outboundRecords[0]?.audience).toBe("farmer");
    expect(result.outboundRecords[0]?.purpose).toBe("manual_reply");
  });

  it("asks the farmer for confirmation before finally closing a case resolved by official SMS", async () => {
    const provider = {
      sendMessage: jest.fn().mockResolvedValue({
        status: "sent",
        providerMessageId: "provider-3",
      }),
    };
    const official: User = {
      id: "aew-1",
      email: "aew@lingkodani.gov.ph",
      name: "AEW Jose Rizal",
      role: "barangay",
      title: "AEW",
      phone: "+639174444444",
    };
    const result = await processOfficialInboundSms({
      phone: official.phone!,
      body: "RESOLVE CASE-F-1 Nabisita na at maayos na ang daluyan ng tubig.",
      official,
      messages: [
        createMessage({
          assignedTo: official.name,
          assignedAt: "2026-03-20T08:06:00.000Z",
          officialReminderRecipientName: official.name,
          officialReminderRecipientPhone: official.phone,
        }),
      ],
      provider,
      providerName: "live-textbee",
      now: new Date("2026-03-20T09:00:00.000Z").getTime(),
    });

    expect(result.kind).toBe("resolve");
    expect(result.message?.caseStatus).toBe("assigned");
    expect(result.message?.closedAt).toBeUndefined();
    expect(result.message?.resolutionConfirmationStatus).toBe("awaiting_farmer");
    expect(result.message?.officialReminderDueAt).toBeUndefined();
    expect(result.outboundRecords).toHaveLength(1);
    expect(result.outboundRecords[0]?.purpose).toBe("resolution_confirmation");
  });
});
