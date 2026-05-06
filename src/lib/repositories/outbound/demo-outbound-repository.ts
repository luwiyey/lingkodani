import type { OutboundMessage } from "@/lib/types";
import type { OutboundMessageRepository } from "@/lib/repositories/outbound/types";
import { outboundMessages as initialOutboundMessages } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<OutboundMessage>({
  storageKey: "outboundMessages",
  initialData: initialOutboundMessages,
});

export const demoOutboundRepository: OutboundMessageRepository = {
  async listOutboundMessages() {
    return store.list();
  },

  async createOutboundMessage(message) {
    return store.prepend(message);
  },

  async updateOutboundMessage(id, updates) {
    return store.updateById(id, updates);
  },

  async findByProviderMessageId(providerMessageId) {
    return store.find((item) => item.providerMessageId === providerMessageId);
  },
};
