import type { SmsMessage } from "@/lib/types";
import type { SmsRepository } from "@/lib/repositories/sms/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoSmsStore?: SmsMessage[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoSmsStore) {
    demoStore.__lingkodAniDemoSmsStore = [];
  }

  return demoStore.__lingkodAniDemoSmsStore;
}

export const demoSmsRepository: SmsRepository = {
  async listMessages() {
    return [...getStore()];
  },

  async createInboundMessage(input) {
    const message: SmsMessage = {
      ...input,
      id: input.id ?? `SMS${Date.now()}`,
    };

    getStore().unshift(message);
    return message;
  },

  async updateMessage(id, updates) {
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
