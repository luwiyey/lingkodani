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
};
