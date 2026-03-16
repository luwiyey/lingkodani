export type WebhookPayloadRecord = Record<string, unknown>;

export type ParsedWebhookRequest = {
  contentType: string;
  rawBody: string;
  body: WebhookPayloadRecord;
};

function isRecord(value: unknown): value is WebhookPayloadRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toRecord(value: unknown): WebhookPayloadRecord {
  return isRecord(value) ? value : {};
}

function formDataToRecord(formData: FormData): WebhookPayloadRecord {
  const entries: WebhookPayloadRecord = {};

  for (const [key, value] of formData.entries()) {
    entries[key] = typeof value === "string" ? value : value.name;
  }

  return entries;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function parseUrlEncoded(text: string): WebhookPayloadRecord {
  const params = new URLSearchParams(text);

  if (Array.from(params.keys()).length === 0) {
    return {};
  }

  return Object.fromEntries(params.entries());
}

export async function readWebhookRequest(request: Request): Promise<ParsedWebhookRequest> {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();

    return {
      contentType,
      rawBody: "",
      body: formDataToRecord(formData),
    };
  }

  const rawBody = await request.text();

  if (contentType.includes("application/json")) {
    return {
      contentType,
      rawBody,
      body: toRecord(parseJson(rawBody)),
    };
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return {
      contentType,
      rawBody,
      body: parseUrlEncoded(rawBody),
    };
  }

  const parsedJson = parseJson(rawBody);

  if (isRecord(parsedJson)) {
    return {
      contentType,
      rawBody,
      body: parsedJson,
    };
  }

  return {
    contentType,
    rawBody,
    body: parseUrlEncoded(rawBody),
  };
}

export function getValueAtPath(body: WebhookPayloadRecord, path: string[]): unknown {
  let current: unknown = body;

  for (const segment of path) {
    if (!isRecord(current) || !(segment in current)) {
      return undefined;
    }

    current = current[segment];
  }

  return current;
}

function normalizeStringValue(value: unknown): string | undefined {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim();
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return undefined;
}

export function getStringAtPaths(body: WebhookPayloadRecord, ...paths: string[][]): string | undefined {
  for (const path of paths) {
    const value = normalizeStringValue(getValueAtPath(body, path));

    if (value) {
      return value;
    }
  }

  return undefined;
}
