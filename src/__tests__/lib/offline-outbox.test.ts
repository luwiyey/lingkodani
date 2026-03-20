import {
  appendOfflineMutation,
  clearOfflineMutations,
  createOfflineMutationId,
  readOfflineMutations,
  sanitizeLogbookEntry,
} from "@/lib/offline-outbox";
import type { LogbookEntry } from "@/lib/types";

describe("offline-outbox", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores and reloads queued offline mutations", () => {
    const mutation = {
      id: createOfflineMutationId("settings"),
      type: "save-system-settings" as const,
      createdAt: "2026-03-20T10:00:00.000Z",
      payload: {
        settings: {
          id: "system",
          brgyDescription: "Test barangay",
          zoneDescriptions: [],
          replyStartTime: "08:00",
          replyEndTime: "17:00",
          adminPhone: "09170000000",
          templateCategories: [],
          smsLexiconRules: [],
          autoReplyEnabled: true,
          autoReplyTimeoutMinutes: 3,
        },
      },
    };

    appendOfflineMutation(mutation, window.localStorage);

    expect(readOfflineMutations(window.localStorage)).toEqual([mutation]);
  });

  it("removes runtime-only icon metadata from queued logbook entries", () => {
    const entry: LogbookEntry = {
      id: "LOG-1",
      farmerId: "FARM-1",
      timestamp: "2026-03-20T10:00:00.000Z",
      type: "Tala sa Bukid",
      title: "Test entry",
      description: "Queued for sync",
      icon: jest.fn() as unknown as LogbookEntry["icon"],
    };

    expect(sanitizeLogbookEntry(entry)).toEqual({
      ...entry,
      icon: undefined,
    });
  });

  it("clears queued mutations cleanly", () => {
    appendOfflineMutation(
      {
        id: createOfflineMutationId("logbook"),
        type: "create-logbook-entry",
        createdAt: "2026-03-20T10:00:00.000Z",
        payload: {
          entry: {
            id: "LOG-2",
            farmerId: "FARM-1",
            timestamp: "2026-03-20T10:00:00.000Z",
            type: "Tala sa Bukid",
            title: "Queued note",
            description: "Pending sync",
          },
        },
      },
      window.localStorage
    );

    clearOfflineMutations(window.localStorage);
    expect(readOfflineMutations(window.localStorage)).toEqual([]);
  });
});
