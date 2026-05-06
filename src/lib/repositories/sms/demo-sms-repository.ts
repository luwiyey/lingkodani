import type { SmsMessage } from "@/lib/types";
import type { SmsRepository } from "@/lib/repositories/sms/types";
import { smsMessages as initialSmsMessages } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<SmsMessage>({
  storageKey: "smsMessages",
  initialData: initialSmsMessages,
});

export const demoSmsRepository: SmsRepository = {
  async listMessages() {
    return store.list();
  },

  async createInboundMessage(input) {
    const message: SmsMessage = {
      ...input,
      id: input.id ?? `SMS${Date.now()}`,
    };

    return store.prepend(message);
  },

  async updateMessage(id, updates) {
    return store.updateById(id, updates);
  },
};
