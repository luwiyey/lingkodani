import { checkRequestRateLimit, getRequestClientIp } from "@/lib/server/request-rate-limit";

function buildRequest(ip: string) {
  return {
    headers: {
      get(name: string) {
        if (name.toLowerCase() === "x-forwarded-for") {
          return ip;
        }

        return null;
      },
    },
  } as Request;
}

describe("request security", () => {
  it("reads the client IP from forwarded headers", () => {
    expect(getRequestClientIp(buildRequest("203.0.113.10, 10.0.0.1"))).toBe(
      "203.0.113.10"
    );
  });

  it("allows requests until the limit is reached", () => {
    const request = buildRequest("203.0.113.10");
    const policy = {
      key: `test-limit-${Date.now()}`,
      maxRequests: 2,
      windowMs: 60_000,
    };

    const first = checkRequestRateLimit(request, policy);
    const second = checkRequestRateLimit(request, policy);
    const third = checkRequestRateLimit(request, policy);

    expect(first.allowed).toBe(true);
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(0);
    expect(third.allowed).toBe(false);
    expect(third.retryAfterSeconds).toBeGreaterThan(0);
  });

});
