function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function sanitizeFirestoreValue<T>(value: T): T {
  if (value === undefined) {
    return undefined as T;
  }

  if (Array.isArray(value)) {
    return value
      .flatMap((item) => {
        const sanitizedItem = sanitizeFirestoreValue(item);
        return sanitizedItem === undefined ? [] : [sanitizedItem];
      }) as T;
  }

  if (isPlainObject(value)) {
    return Object.fromEntries(
      Object.entries(value).flatMap(([key, item]) => {
        const sanitizedItem = sanitizeFirestoreValue(item);
        return sanitizedItem === undefined ? [] : [[key, sanitizedItem]];
      })
    ) as T;
  }

  return value;
}

export function sanitizeFirestoreDocument<T extends Record<string, unknown>>(value: T): T {
  return sanitizeFirestoreValue(value);
}

export function sanitizeFirestorePatch<T extends Record<string, unknown>>(value: T): Partial<T> {
  return sanitizeFirestoreValue(value) as Partial<T>;
}
