import { normalizePhone } from "@/lib/sms-simulator";

const PRIVACY_FINGERPRINT_SALT = "lingkod-ani/privacy/v1/";
const BUILT_IN_EXCLUDED_PHONE_FINGERPRINTS = new Set(["ce670185a3b682d4"]);

function fingerprintPhone(phone: string) {
  const value = `${PRIVACY_FINGERPRINT_SALT}${normalizePhone(phone)}`;
  let first = 0xdeadbeef ^ 0x9e3779b9;
  let second = 0x41c6ce57 ^ 0x9e3779b9;

  for (const character of value) {
    const code = character.charCodeAt(0);
    first = Math.imul(first ^ code, 2654435761);
    second = Math.imul(second ^ code, 1597334677);
  }

  first =
    Math.imul(first ^ (first >>> 16), 2246822507) ^
    Math.imul(second ^ (second >>> 13), 3266489909);
  second =
    Math.imul(second ^ (second >>> 16), 2246822507) ^
    Math.imul(first ^ (first >>> 13), 3266489909);

  return `${(second >>> 0).toString(16).padStart(8, "0")}${(first >>> 0)
    .toString(16)
    .padStart(8, "0")}`;
}

function readConfiguredExcludedPhoneNumbers() {
  const configuredNumbers = [process.env.NEXT_PUBLIC_SMS_PRIVACY_EXCLUDED_NUMBERS];

  if (typeof window === "undefined") {
    configuredNumbers.push(process.env.SMS_PRIVACY_EXCLUDED_NUMBERS);
  }

  return configuredNumbers
    .filter(Boolean)
    .join(",")
    .split(",")
    .map((phone) => normalizePhone(phone))
    .filter(Boolean);
}

export function isPrivacyExcludedPhone(phone: string) {
  const normalizedPhone = normalizePhone(phone);
  const excludedPhoneNumbers = new Set(readConfiguredExcludedPhoneNumbers());
  return (
    normalizedPhone.length > 0 &&
    (excludedPhoneNumbers.has(normalizedPhone) ||
      BUILT_IN_EXCLUDED_PHONE_FINGERPRINTS.has(fingerprintPhone(normalizedPhone)))
  );
}

export function redactSmsSender(phone: string) {
  if (isPrivacyExcludedPhone(phone)) {
    return "[privacy-excluded]";
  }

  const normalizedPhone = normalizePhone(phone);
  if (normalizedPhone.length < 4) return "[invalid-sender]";

  return `***${normalizedPhone.slice(-4)}`;
}

export function filterPrivacySafePhoneRecords<T>(
  records: T[],
  getPhone: (record: T) => string | undefined
) {
  return records.filter((record) => {
    const phone = getPhone(record);
    return !phone || !isPrivacyExcludedPhone(phone);
  });
}

export function getPrivacyExcludedRecordIds<T extends { id: string }>(
  records: T[],
  getPhone: (record: T) => string | undefined
) {
  return new Set(
    records
      .filter((record) => {
        const phone = getPhone(record);
        return Boolean(phone && isPrivacyExcludedPhone(phone));
      })
      .map((record) => record.id)
  );
}

export function filterPrivacySafeRelatedRecords<T>(
  records: T[],
  excludedRelatedIds: ReadonlySet<string>,
  getRelatedId: (record: T) => string | undefined
) {
  return records.filter((record) => {
    const relatedId = getRelatedId(record);
    return !relatedId || !excludedRelatedIds.has(relatedId);
  });
}

function containsExcludedPhone(value: unknown, visited: Set<object>): boolean {
  if (typeof value === "string") {
    const phoneCandidates = value.match(/\+?\d[\d\s().-]{8,}\d/g) ?? [];
    return phoneCandidates.some((candidate) => isPrivacyExcludedPhone(candidate));
  }

  if (!value || typeof value !== "object" || visited.has(value)) {
    return false;
  }

  visited.add(value);
  return Object.values(value).some((entry) => containsExcludedPhone(entry, visited));
}

export function filterPrivacySafeContentRecords<T>(records: T[]) {
  return records.filter((record) => !containsExcludedPhone(record, new Set()));
}
