import type { FarmerAssistanceRecord } from "@/lib/types";
import type { AssistanceRepository } from "@/lib/repositories/assistance/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoAssistanceStore?: FarmerAssistanceRecord[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoAssistanceStore) {
    demoStore.__lingkodAniDemoAssistanceStore = [];
  }

  return demoStore.__lingkodAniDemoAssistanceStore;
}

export const demoAssistanceRepository: AssistanceRepository = {
  async listAssistanceRecords() {
    return [...getStore()];
  },

  async createAssistanceRecord(record) {
    getStore().unshift(record);
    return record;
  },

  async updateAssistanceRecord(id, updates) {
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
