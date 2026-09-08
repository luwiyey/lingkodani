import { filterVisibleInboundSmsMessages, screenInboundSms } from "@/lib/inbound-sms-screening";
import { smsMessages as seededSmsMessages } from "@/lib/data";
import {
  filterPrivacySafeContentRecords,
  filterPrivacySafeRelatedRecords,
  getPrivacyExcludedRecordIds,
} from "@/lib/sms-privacy";

describe("inbound-sms-screening", () => {
  const protectedTestPhone = "+639111222333";
  const originalPrivacyExclusions = process.env.NEXT_PUBLIC_SMS_PRIVACY_EXCLUDED_NUMBERS;

  beforeAll(() => {
    process.env.NEXT_PUBLIC_SMS_PRIVACY_EXCLUDED_NUMBERS = protectedTestPhone;
  });

  afterAll(() => {
    if (originalPrivacyExclusions === undefined) {
      delete process.env.NEXT_PUBLIC_SMS_PRIVACY_EXCLUDED_NUMBERS;
      return;
    }

    process.env.NEXT_PUBLIC_SMS_PRIVACY_EXCLUDED_NUMBERS = originalPrivacyExclusions;
  });

  it("ignores carrier promo messages from alphanumeric senders", () => {
    expect(
      screenInboundSms({
        phone: "TNT",
        message: "Nag-expire na ang FREE DATA 7 mo.",
      })
    ).toEqual({
      ignored: true,
      reason: "carrier_promo",
      normalizedPhone: "",
    });
  });

  it("ignores carrier alias variants such as TNT PH", () => {
    expect(
      screenInboundSms({
        phone: "TNT PH",
        message: "May latest offers at free data ka ngayon.",
      })
    ).toEqual({
      ignored: true,
      reason: "carrier_promo",
      normalizedPhone: "",
    });
  });

  it("ignores strong carrier promo content even when it comes from a full mobile number", () => {
    expect(
      screenInboundSms({
        phone: "+639171234567",
        message: "FREE DATA unlocked. Open the Smart App to claim your latest offers.",
      })
    ).toEqual({
      ignored: true,
      reason: "carrier_promo",
      normalizedPhone: "639171234567",
    });
  });

  it("ignores malformed non-phone senders even when they are not obvious promos", () => {
    expect(
      screenInboundSms({
        phone: "UNKNOWN-SENDER",
        message: "Hello po.",
      })
    ).toEqual({
      ignored: true,
      reason: "invalid_sender",
      normalizedPhone: "",
    });
  });

  it("allows valid Philippine mobile numbers through", () => {
    expect(
      screenInboundSms({
        phone: "+639171234567",
        message: "May uod sa palay namin.",
      })
    ).toEqual({
      ignored: false,
      normalizedPhone: "639171234567",
    });
  });

  it("excludes the protected personal sender across common phone formats", () => {
    for (const phone of ["+63 911 122 2333", "0911-122-2333", "639111222333"]) {
      expect(
        screenInboundSms({
          phone,
          message: "Personal conversation that must not enter operations.",
        })
      ).toEqual({
        ignored: true,
        reason: "privacy_excluded",
        normalizedPhone: "639111222333",
      });
    }
  });

  it("removes protected senders from already-loaded message collections", () => {
    const visibleMessages = filterVisibleInboundSmsMessages([
      { phone: protectedTestPhone, message: "Private message", id: "private" },
      { phone: "+639171234567", message: "May uod sa palay.", id: "operational" },
    ]);

    expect(visibleMessages).toEqual([
      { phone: "+639171234567", message: "May uod sa palay.", id: "operational" },
    ]);
  });

  it("keeps every seeded demo message and workflow visible", () => {
    const visibleMessages = filterVisibleInboundSmsMessages(seededSmsMessages);

    expect(visibleMessages).toHaveLength(seededSmsMessages.length);
    expect(visibleMessages.map((message) => message.id)).toEqual(
      seededSmsMessages.map((message) => message.id)
    );
  });

  it("removes derivative audit and related records for a protected sender", () => {
    const farmers = [
      { id: "private-farmer", phone: protectedTestPhone },
      { id: "operational-farmer", phone: "+639171234567" },
    ];
    const excludedFarmerIds = getPrivacyExcludedRecordIds(farmers, (farmer) => farmer.phone);

    expect(filterPrivacySafeRelatedRecords([
      { id: "private-log", farmerId: "private-farmer" },
      { id: "operational-log", farmerId: "operational-farmer" },
    ], excludedFarmerIds, (entry) => entry.farmerId)).toEqual([
      { id: "operational-log", farmerId: "operational-farmer" },
    ]);

    expect(filterPrivacySafeContentRecords([
      { id: "private-audit", details: "Inbound SMS from 0911-122-2333" },
      { id: "operational-audit", details: "Inventory updated" },
    ])).toEqual([
      { id: "operational-audit", details: "Inventory updated" },
    ]);
  });
});
