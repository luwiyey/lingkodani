import { parseInboundWebhookRequest } from "@/lib/inbound-webhook";
import { analyzeInboundSmsWithFallback } from "@/lib/services/server-sms-analysis-service";

jest.mock("@/lib/services/server-sms-analysis-service", () => ({
  analyzeInboundSmsWithFallback: jest.fn(),
}));

const mockedAnalyzeInboundSms = jest.mocked(analyzeInboundSmsWithFallback);

describe("inbound webhook privacy screening", () => {
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

  beforeEach(() => {
    mockedAnalyzeInboundSms.mockReset();
  });

  it("rejects a protected sender before message analysis", async () => {
    const inbound = await parseInboundWebhookRequest({
      contentType: "application/json",
      rawBody: "",
      body: {
        phone: protectedTestPhone,
        message: "Private conversation",
      },
    });

    expect(inbound?.screening).toMatchObject({
      ignored: true,
      reason: "privacy_excluded",
    });
    expect(inbound?.analysis).toBeUndefined();
    expect(mockedAnalyzeInboundSms).not.toHaveBeenCalled();
  });
});
