import type { OutboundMessage } from "@/lib/types";

export interface OutboundMessageRepository {
  listOutboundMessages(): Promise<OutboundMessage[]>;
  createOutboundMessage(message: OutboundMessage): Promise<OutboundMessage>;
  updateOutboundMessage(id: string, updates: Partial<OutboundMessage>): Promise<OutboundMessage | null>;
  findByProviderMessageId(providerMessageId: string): Promise<OutboundMessage | null>;
}
