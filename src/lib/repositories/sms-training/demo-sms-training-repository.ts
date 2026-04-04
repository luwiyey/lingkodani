import type { SmsTrainingExample } from "@/lib/types";
import type { SmsTrainingRepository } from "@/lib/repositories/sms-training/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoSmsTrainingStore?: SmsTrainingExample[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoSmsTrainingStore) {
    demoStore.__lingkodAniDemoSmsTrainingStore = [];
  }

  return demoStore.__lingkodAniDemoSmsTrainingStore;
}

export const demoSmsTrainingRepository: SmsTrainingRepository = {
  async listTrainingExamples() {
    return [...getStore()];
  },

  async createTrainingExample(example) {
    getStore().unshift(example);
    return example;
  },

  async updateTrainingExample(id, updates) {
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
