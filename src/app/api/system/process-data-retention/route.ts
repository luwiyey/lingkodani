import { NextResponse } from "next/server";

import { isLiveMode } from "@/lib/config/app-mode";
import { withAutomationLock } from "@/lib/server/automation-lock";
import { authenticateAutomationRequest } from "@/lib/server/automation-request";
import {
  recordRuntimeHealthFailure,
  recordRuntimeHealthSuccess,
  recordRuntimeHealthWarning,
} from "@/lib/system-health";
import { processLiveDataRetentionSweep } from "@/lib/services/server-data-retention-service";

async function handle(request: Request) {
  if (!isLiveMode) {
    return NextResponse.json(
      { error: "Ang data-retention processor ay para lamang sa live mode." },
      { status: 400 }
    );
  }

  const auth = await authenticateAutomationRequest(request);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const run = await withAutomationLock(
      "process-data-retention",
      10 * 60 * 1000,
      () => processLiveDataRetentionSweep(auth.actorName)
    );

    if (!run.acquired) {
      await recordRuntimeHealthSuccess("data_retention", "Data Retention Sweep", {
        skipped: true,
        reason: "already_running",
      });
      return NextResponse.json({
        checkedAuditLogs: 0,
        checkedFarmers: 0,
        redactedAuditLogs: 0,
        redactedArchivedFarmers: 0,
        skipped: true,
        reason: "already_running",
      });
    }

    const result = run.result;

    if (result.skipped) {
      await recordRuntimeHealthSuccess("data_retention", "Data Retention Sweep", {
        checkedAuditLogs: result.checkedAuditLogs,
        checkedFarmers: result.checkedFarmers,
        redactedAuditLogs: 0,
        redactedArchivedFarmers: 0,
        reason: result.reason,
      });
    } else if (result.redactedAuditLogs > 0 || result.redactedArchivedFarmers > 0) {
      await recordRuntimeHealthWarning("data_retention", "Data Retention Sweep", {
        checkedAuditLogs: result.checkedAuditLogs,
        checkedFarmers: result.checkedFarmers,
        redactedAuditLogs: result.redactedAuditLogs,
        redactedArchivedFarmers: result.redactedArchivedFarmers,
      });
    } else {
      await recordRuntimeHealthSuccess("data_retention", "Data Retention Sweep", result);
    }

    return NextResponse.json(result);
  } catch (error) {
    await recordRuntimeHealthFailure("data_retention", "Data Retention Sweep", error);
    return NextResponse.json(
      { error: "Hindi naproseso ang data retention sweep." },
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
