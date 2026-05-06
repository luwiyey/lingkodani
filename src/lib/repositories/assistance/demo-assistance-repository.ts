import type { FarmerAssistanceRecord } from "@/lib/types";
import type { AssistanceRepository } from "@/lib/repositories/assistance/types";
import { assistanceRecords as initialAssistanceRecords } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<FarmerAssistanceRecord>({
  storageKey: "assistanceRecords",
  initialData: initialAssistanceRecords,
});

export const demoAssistanceRepository: AssistanceRepository = {
  async listAssistanceRecords() {
    return store.list();
  },

  async createAssistanceRecord(record) {
    return store.prepend(record);
  },

  async updateAssistanceRecord(id, updates) {
    return store.updateById(id, updates);
  },
};
