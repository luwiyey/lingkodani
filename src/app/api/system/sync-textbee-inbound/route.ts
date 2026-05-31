import { NextResponse } from "next/server";

import { isLiveMode } from "@/lib/config/app-mode";
import { authenticateAutomationRequest } from "@/lib/server/automation-request";
import { withAutomationLock } from "@/lib/server/automation-lock";
import { syncTextbeeInbox } from "@/lib/services/server-textbee-inbox-sync-service";
import {
  recordRuntimeHealthFailure,
  recordRuntimeHealthSuccess,
  recordRuntimeHealthWarning,
} from "@/lib/system-health";

async function handle(request: Request) {
  if (!isLiveMode) {
    return NextResponse.json(
      { error: "Ang TextBee inbox sync ay para lamang sa live mode." },
      { status: 400 }
    );
  }

  const auth = await authenticateAutomationRequest(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const run = await withAutomationLock(
      "sync-textbee-inbound",
      10 * 60 * 1000,
      () => syncTextbeeInbox()
    );

    if (!run.acquired) {
      await recordRuntimeHealthSuccess(
        "automation_textbee_inbound_sync",
        "TextBee Inbox Sync",
        {
          skipped: true,
          reason: "already_running",
        }
      );

      return NextResponse.json({
        synced: false,
        skipped: true,
        reason: "already_running",
      });
    }

    const result = run.result;

    if (result.failedCount > 0) {
      await recordRuntimeHealthWarning(
        "automation_textbee_inbound_sync",
        "TextBee Inbox Sync",
        result
      );
    } else {
      await recordRuntimeHealthSuccess(
        "automation_textbee_inbound_sync",
        "TextBee Inbox Sync",
        result
      );
    }

    return NextResponse.json({
      synced: true,
      ...result,
    });
  } catch (error) {
    await recordRuntimeHealthFailure(
      "automation_textbee_inbound_sync",
      "TextBee Inbox Sync",
      error
    );
    return NextResponse.json(
      { error: "Hindi naisagawa ang TextBee inbox sync." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
