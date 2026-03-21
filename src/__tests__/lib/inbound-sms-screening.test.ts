import { screenInboundSms } from "@/lib/inbound-sms-screening";

describe("inbound-sms-screening", () => {
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
});
