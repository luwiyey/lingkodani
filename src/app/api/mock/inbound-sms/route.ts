import { NextResponse } from "next/server";

import { analyzeInboundSmsWithFallback } from "@/lib/services/server-sms-analysis-service";

function readMode() {
  return (process.env.APP_MODE ?? process.env.NEXT_PUBLIC_APP_MODE ?? "demo") === "live"
    ? "live"
    : "demo";
}

export async function POST(request: Request) {
  if (readMode() === "live") {
    return NextResponse.json(
      { error: "Naka-disable ang SMS simulation tool sa live deployment." },
      { status: 403 }
    );
  }

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
