import type { AlertHistoryEntry } from "@/lib/types";
import type { AlertHistoryRepository } from "@/lib/repositories/alert-history/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoAlertHistoryStore?: AlertHistoryEntry[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoAlertHistoryStore) {
    demoStore.__lingkodAniDemoAlertHistoryStore = [];
  }

  return demoStore.__lingkodAniDemoAlertHistoryStore;
}

export const demoAlertHistoryRepository: AlertHistoryRepository = {
  async listAlertHistory() {
    return [...getStore()];
  },

  async createAlertHistoryEntry(entry) {
    getStore().unshift(entry);
    return entry;
  },
};
