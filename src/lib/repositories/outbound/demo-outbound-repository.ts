import type { OutboundMessage } from "@/lib/types";
import type { OutboundMessageRepository } from "@/lib/repositories/outbound/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoOutboundStore?: OutboundMessage[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoOutboundStore) {
    demoStore.__lingkodAniDemoOutboundStore = [];
  }

  return demoStore.__lingkodAniDemoOutboundStore;
}

export const demoOutboundRepository: OutboundMessageRepository = {
  async listOutboundMessages() {
    return [...getStore()];
  },

  async createOutboundMessage(message) {
    getStore().unshift(message);
    return message;
  },

  async updateOutboundMessage(id, updates) {
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

  async findByProviderMessageId(providerMessageId) {
    return getStore().find((item) => item.providerMessageId === providerMessageId) ?? null;
  },
};
