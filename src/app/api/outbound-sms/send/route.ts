import { NextResponse } from "next/server";

import { sendLiveSms } from "@/lib/services/server-live-outbound-sms-service";
import { authenticateServerRequest } from "@/lib/server/request-auth";

export async function POST(request: Request) {
  try {
    const auth = await authenticateServerRequest(request, ["barangay", "developer"]);

    if (!auth.ok) {
      return NextResponse.json(
        { error: auth.error },
        { status: auth.status }
      );
    }

    const body = await request.json();
    const to = typeof body.to === "string" ? body.to.trim() : "";
    const messageBody = typeof body.body === "string" ? body.body.trim() : "";

    if (!to || !messageBody) {
      return NextResponse.json(
        { error: "Kinakailangan ang recipient phone at body." },
        { status: 400 }
      );
    }

    const result = await sendLiveSms({
      to,
      body: messageBody,
    });

    if (result.status === "failed") {
      return NextResponse.json(
        { error: result.errorMessage ?? "Outbound SMS send failed." },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Hindi naproseso ang outbound SMS request." },
      { status: 500 }
    );
  }
}
