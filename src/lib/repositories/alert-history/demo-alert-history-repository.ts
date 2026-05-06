import type { AlertHistoryEntry } from "@/lib/types";
import type { AlertHistoryRepository } from "@/lib/repositories/alert-history/types";
import { alertHistory as initialAlertHistory } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<AlertHistoryEntry>({
  storageKey: "alertHistory",
  initialData: initialAlertHistory,
});

export const demoAlertHistoryRepository: AlertHistoryRepository = {
  async listAlertHistory() {
    return store.list();
  },

  async createAlertHistoryEntry(entry) {
    return store.prepend(entry);
  },
};
