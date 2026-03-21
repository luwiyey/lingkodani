jest.mock("@/lib/providers/sms/live-sms-config", () => ({
  readLiveSmsProvider: jest.fn(() => "textbee"),
  readTextbeeApiKey: jest.fn(() => "api-key"),
  readTextbeeDeviceId: jest.fn(() => "device-id"),
  readSmsgateUsername: jest.fn(),
  readSmsgatePassword: jest.fn(),
  readSmsgateDeviceId: jest.fn(),
}));

jest.mock("@/lib/providers/sms/textbee", () => ({
  getTextbeeBaseUrl: jest.fn(() => "https://textbee.example.test"),
}));

import { sendLiveSms } from "@/lib/services/server-live-outbound-sms-service";

describe("server-live-outbound-sms-service", () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    jest.restoreAllMocks();

    if (originalFetch) {
      Object.defineProperty(globalThis, "fetch", {
        value: originalFetch,
        configurable: true,
        writable: true,
      });
      return;
    }

    delete (globalThis as Partial<typeof globalThis>).fetch;
  });

  it("fails fast for invalid recipient phones without calling the provider", async () => {
    const fetchSpy = jest.fn();
    Object.defineProperty(globalThis, "fetch", {
      value: fetchSpy,
      configurable: true,
      writable: true,
    });
    const result = await sendLiveSms({
      to: "TNT",
      body: "Test message",
    });

    expect(result.status).toBe("failed");
    expect(result.errorMessage).toContain("valid Philippine mobile number");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("returns a failed send result instead of throwing on provider errors", async () => {
    Object.defineProperty(globalThis, "fetch", {
      value: jest.fn().mockRejectedValue(new Error("Provider unavailable")),
      configurable: true,
      writable: true,
    });

    const result = await sendLiveSms({
      to: "+639171234567",
      body: "Test message",
    });

    expect(result).toEqual({
      status: "failed",
      errorMessage: "Provider unavailable",
    });
  });
});
