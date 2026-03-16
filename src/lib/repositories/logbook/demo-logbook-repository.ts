import type { LogbookEntry } from "@/lib/types";
import type { LogbookRepository } from "@/lib/repositories/logbook/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoLogbookStore?: LogbookEntry[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoLogbookStore) {
    demoStore.__lingkodAniDemoLogbookStore = [];
  }

  return demoStore.__lingkodAniDemoLogbookStore;
}

export const demoLogbookRepository: LogbookRepository = {
  async listEntries() {
    return [...getStore()];
  },

  async createEntry(entry) {
    getStore().unshift(entry);
    return entry;
  },
};
