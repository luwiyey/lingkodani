import type { NormalizedInboundWebhook } from "@/lib/inbound-webhook";

const globalStore = globalThis as typeof globalThis & {
  __lingkodAniInboundQueue?: NormalizedInboundWebhook[];
};

function getQueue() {
  if (!globalStore.__lingkodAniInboundQueue) {
    globalStore.__lingkodAniInboundQueue = [];
  }

  return globalStore.__lingkodAniInboundQueue;
}

export function enqueueInboundWebhook(message: NormalizedInboundWebhook) {
  const queue = getQueue();
  queue.push(message);
}

export function consumeInboundWebhooks() {
  const queue = getQueue();
  const items = [...queue];
  queue.length = 0;
  return items;
}

export function peekInboundWebhookCount() {
  return getQueue().length;
}
