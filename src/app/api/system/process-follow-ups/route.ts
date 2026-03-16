import { NextResponse } from "next/server";

import { isLiveMode } from "@/lib/config/app-mode";
import { processLiveFollowUpMessages } from "@/lib/services/server-follow-up-service";

function isAuthorized(request: Request) {
  const expectedToken = process.env.SYSTEM_AUTOMATION_TOKEN ?? process.env.CRON_SECRET;

  if (!expectedToken) {
    return false;
  }

  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : "";

  return token === expectedToken;
}

async function handle(request: Request) {
  if (!isLiveMode) {
    return NextResponse.json(
      { error: "Ang follow-up processor ay para lamang sa live mode." },
      { status: 400 }
    );
  }

  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Hindi awtorisado ang automation request." },
      { status: 401 }
    );
  }

  try {
    const result = await processLiveFollowUpMessages();
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      { error: "Hindi naproseso ang due follow-up batch." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
