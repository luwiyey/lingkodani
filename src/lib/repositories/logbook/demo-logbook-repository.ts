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

  async updateEntry(id, updates) {
    const store = getStore();
    const index = store.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    store[index] = {
      ...store[index],
      ...updates,
    };

    return store[index];
  },
};
