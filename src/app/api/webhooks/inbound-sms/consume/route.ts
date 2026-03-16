import { NextResponse } from "next/server";

import { isLiveMode } from "@/lib/config/app-mode";
import { consumeInboundWebhooks, peekInboundWebhookCount } from "@/lib/server/inbound-sms-queue";

export async function GET() {
  if (isLiveMode) {
    return NextResponse.json({
      queued: 0,
    });
  }

  return NextResponse.json({
    queued: peekInboundWebhookCount(),
  });
}

export async function POST() {
  if (isLiveMode) {
    return NextResponse.json({
      items: [],
      count: 0,
    });
  }

  const items = consumeInboundWebhooks();

  return NextResponse.json({
    items,
    count: items.length,
  });
}
