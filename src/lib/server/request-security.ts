import { NextResponse } from "next/server";

import {
  type RateLimitResult,
} from "@/lib/server/request-rate-limit";

export { checkRequestRateLimit } from "@/lib/server/request-rate-limit";

export function applyRateLimitHeaders(
  response: NextResponse,
  result: Pick<RateLimitResult, "limit" | "remaining" | "resetAt">,
  now = Date.now()
) {
  response.headers.set("x-ratelimit-limit", `${result.limit}`);
  response.headers.set("x-ratelimit-remaining", `${Math.max(result.remaining, 0)}`);
  response.headers.set(
    "x-ratelimit-reset",
    `${Math.max(Math.ceil((result.resetAt - now) / 1000), 0)}`
  );

  return response;
}

export function createRateLimitResponse(
  result: RateLimitResult,
  error: string
) {
  const response = NextResponse.json(
    {
      error,
      code: "rate_limited",
      retryAfterSeconds: result.retryAfterSeconds ?? 60,
    },
    { status: 429 }
  );

  response.headers.set(
    "retry-after",
    `${result.retryAfterSeconds ?? 60}`
  );

  return applyRateLimitHeaders(response, result);
}

export function applySecurityHeaders(response: NextResponse) {
  response.headers.set("x-frame-options", "DENY");
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "permissions-policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()"
  );
  return response;
}
