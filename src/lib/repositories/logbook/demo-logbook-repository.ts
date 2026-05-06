import type { LogbookEntry } from "@/lib/types";
import type { LogbookRepository } from "@/lib/repositories/logbook/types";
import { farmerLogbookEntries as initialLogbookEntries } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<LogbookEntry>({
  storageKey: "logbook",
  initialData: initialLogbookEntries,
});

export const demoLogbookRepository: LogbookRepository = {
  async listEntries() {
    return store.list();
  },

  async createEntry(entry) {
    return store.prepend(entry);
  },

  async updateEntry(id, updates) {
    return store.updateById(id, updates);
  },
};
