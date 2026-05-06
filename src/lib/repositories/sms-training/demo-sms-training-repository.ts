import type { SmsTrainingExample } from "@/lib/types";
import type { SmsTrainingRepository } from "@/lib/repositories/sms-training/types";
import { smsTrainingExamples as initialSmsTrainingExamples } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<SmsTrainingExample>({
  storageKey: "smsTrainingExamples",
  initialData: initialSmsTrainingExamples,
});

export const demoSmsTrainingRepository: SmsTrainingRepository = {
  async listTrainingExamples() {
    return store.list();
  },

  async createTrainingExample(example) {
    return store.prepend(example);
  },

  async updateTrainingExample(id, updates) {
    return store.updateById(id, updates);
  },
};
