"use client";

import { Badge } from "@/components/ui/badge";
import {
  getEffectiveSmsCaseOutcome,
  getResolutionConfirmationMeta,
  getSmsCaseOutcomeMeta,
} from "@/lib/sms-case-outcomes";
import type { SmsMessage } from "@/lib/types";

export function CaseOutcomeBadge({
  message,
}: {
  message: Pick<SmsMessage, "caseOutcomeStatus" | "caseStatus" | "closedAt" | "resolutionConfirmationStatus">;
}) {
  const effectiveOutcome = getEffectiveSmsCaseOutcome(message);
  const meta = getSmsCaseOutcomeMeta(effectiveOutcome);
  const confirmationMeta = getResolutionConfirmationMeta(
    message.resolutionConfirmationStatus
  );

  if (!meta && !confirmationMeta) {
    return null;
  }

  return (
    <>
      {meta ? (
        <Badge variant="outline" className={meta.badgeClassName}>
          Outcome: {meta.label}
        </Badge>
      ) : null}
      {confirmationMeta ? (
        <Badge variant="outline" className={confirmationMeta.badgeClassName}>
          {confirmationMeta.label}
        </Badge>
      ) : null}
    </>
  );
}
