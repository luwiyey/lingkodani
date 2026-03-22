import { NextResponse } from "next/server";

import { isLiveMode } from "@/lib/config/app-mode";
import { withAutomationLock } from "@/lib/server/automation-lock";
import { authenticateAutomationRequest } from "@/lib/server/automation-request";
import { recordRuntimeHealthFailure, recordRuntimeHealthSuccess, recordRuntimeHealthWarning } from "@/lib/system-health";
import { processLiveOverdueSmsMessages } from "@/lib/services/server-overdue-sms-service";

async function handle(request: Request) {
  if (!isLiveMode) {
    return NextResponse.json(
      { error: "Ang overdue SMS processor ay para lamang sa live mode." },
      { status: 400 }
    );
  }

  const auth = await authenticateAutomationRequest(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const run = await withAutomationLock(
      "process-overdue-sms",
      10 * 60 * 1000,
      () => processLiveOverdueSmsMessages(auth.actorName)
    );

    if (!run.acquired) {
      await recordRuntimeHealthSuccess("automation_overdue", "Overdue SMS Batch", {
        skipped: true,
        reason: "already_running",
      });
      return NextResponse.json({
        checked: 0,
        processedCount: 0,
        processed: [],
        skipped: true,
        reason: "already_running",
      });
    }

    const result = run.result;
    if (result.failedCount > 0) {
      await recordRuntimeHealthWarning("automation_overdue", "Overdue SMS Batch", {
        checked: result.checked,
        processedCount: result.processedCount,
        failedCount: result.failedCount,
      });
    } else {
      await recordRuntimeHealthSuccess("automation_overdue", "Overdue SMS Batch", {
        checked: result.checked,
        processedCount: result.processedCount,
        failedCount: result.failedCount,
      });
    }
    return NextResponse.json(result);
  } catch (error) {
    await recordRuntimeHealthFailure("automation_overdue", "Overdue SMS Batch", error);
    return NextResponse.json(
      { error: "Hindi naproseso ang overdue SMS batch." },
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
