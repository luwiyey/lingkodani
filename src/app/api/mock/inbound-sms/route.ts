import { NextResponse } from "next/server";

import { analyzeInboundSmsWithFallback } from "@/lib/services/server-sms-analysis-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!phone || !message) {
      return NextResponse.json(
        { error: "Kinakailangan ang phone at message." },
        { status: 400 }
      );
    }

    const analysis = await analyzeInboundSmsWithFallback({
      message,
    });

    return NextResponse.json({
      phone,
      message,
      analysis,
    });
  } catch {
    return NextResponse.json(
      { error: "Hindi naproseso ang mock inbound SMS request." },
      { status: 500 }
    );
  }
}
