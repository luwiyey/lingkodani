import { NextResponse } from "next/server";

import { isLiveMode } from "@/lib/config/app-mode";
import { consumeInboundWebhooks, peekInboundWebhookCount } from "@/lib/server/inbound-sms-queue";
import { hasServerDemoPreviewAccess } from "@/lib/server/session-auth";

export async function GET() {
  if (isLiveMode && !(await hasServerDemoPreviewAccess())) {
    return NextResponse.json({
      queued: 0,
    });
  }

  return NextResponse.json({
    queued: peekInboundWebhookCount(),
  });
}

export async function POST() {
  if (isLiveMode && !(await hasServerDemoPreviewAccess())) {
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
