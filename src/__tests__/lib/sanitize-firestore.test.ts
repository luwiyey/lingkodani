import {
  sanitizeFirestoreDocument,
  sanitizeFirestorePatch,
  sanitizeFirestoreValue,
} from "@/lib/firebase/sanitize-firestore";

describe("sanitizeFirestoreValue", () => {
  it("removes undefined fields recursively from objects", () => {
    const input = {
      id: "FARM005",
      householdId: undefined,
      nested: {
        stage: "vegetative",
        note: undefined,
      },
    };

    expect(sanitizeFirestoreDocument(input)).toEqual({
      id: "FARM005",
      nested: {
        stage: "vegetative",
      },
    });
  });

  it("removes undefined array entries and nested undefined fields", () => {
    const input = {
      tags: ["rice", undefined, "corn"],
      evidence: [
        { id: "1", url: "a" },
        undefined,
        { id: "2", url: undefined, caption: "leaf photo" },
      ],
    };

    expect(sanitizeFirestoreDocument(input)).toEqual({
      tags: ["rice", "corn"],
      evidence: [
        { id: "1", url: "a" },
        { id: "2", caption: "leaf photo" },
      ],
    });
  });

  it("preserves null and non-plain objects", () => {
    const date = new Date("2026-05-04T00:00:00.000Z");
    const input = {
      reviewedAt: null,
      updatedAt: date,
    };

    const sanitized = sanitizeFirestorePatch(input);
    expect(sanitized.reviewedAt).toBeNull();
    expect(sanitized.updatedAt).toBe(date);
  });

  it("returns primitive values unchanged", () => {
    expect(sanitizeFirestoreValue("ok")).toBe("ok");
    expect(sanitizeFirestoreValue(42)).toBe(42);
    expect(sanitizeFirestoreValue(false)).toBe(false);
  });
});
