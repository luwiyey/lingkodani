type RateLimitPolicy = {
  key: string;
  maxRequests: number;
  windowMs: number;
};

type RateLimitRecord = {
  count: number;
  resetAt: number;
};

export type RateLimitResult = {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfterSeconds?: number;
};

type RateLimitStore = Map<string, RateLimitRecord>;

declare global {
  var __lingkodAniRateLimitStore: RateLimitStore | undefined;
}

function getRateLimitStore(): RateLimitStore {
  if (!globalThis.__lingkodAniRateLimitStore) {
    globalThis.__lingkodAniRateLimitStore = new Map<string, RateLimitRecord>();
  }

  return globalThis.__lingkodAniRateLimitStore;
}

function normalizeIpPart(value: string): string {
  return value.split(",")[0]?.trim() ?? "";
}

export function getRequestClientIp(request: Request): string {
  const forwardedFor = normalizeIpPart(
    request.headers.get("x-forwarded-for") ?? ""
  );
  const realIp = normalizeIpPart(request.headers.get("x-real-ip") ?? "");

  return forwardedFor || realIp || "unknown";
}

export function checkRequestRateLimit(
  request: Request,
  policy: RateLimitPolicy
): RateLimitResult {
  const store = getRateLimitStore();
  const now = Date.now();
  const bucketKey = `${policy.key}:${getRequestClientIp(request)}`;
  const current = store.get(bucketKey);

  if (!current || current.resetAt <= now) {
    const nextRecord: RateLimitRecord = {
      count: 1,
      resetAt: now + policy.windowMs,
    };
    store.set(bucketKey, nextRecord);
    return {
      allowed: true,
      limit: policy.maxRequests,
      remaining: Math.max(policy.maxRequests - 1, 0),
      resetAt: nextRecord.resetAt,
    };
  }

  if (current.count >= policy.maxRequests) {
    return {
      allowed: false,
      limit: policy.maxRequests,
      remaining: 0,
      resetAt: current.resetAt,
      retryAfterSeconds: Math.max(
        Math.ceil((current.resetAt - now) / 1000),
        1
      ),
    };
  }

  current.count += 1;
  store.set(bucketKey, current);

  return {
    allowed: true,
    limit: policy.maxRequests,
    remaining: Math.max(policy.maxRequests - current.count, 0),
    resetAt: current.resetAt,
  };
}
