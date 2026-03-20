"use client";

import { Badge } from "@/components/ui/badge";
import {
  getEffectiveSmsCaseOutcome,
  getSmsCaseOutcomeMeta,
} from "@/lib/sms-case-outcomes";
import type { SmsMessage } from "@/lib/types";

export function CaseOutcomeBadge({
  message,
}: {
  message: Pick<SmsMessage, "caseOutcomeStatus" | "caseStatus" | "closedAt">;
}) {
  const effectiveOutcome = getEffectiveSmsCaseOutcome(message);
  const meta = getSmsCaseOutcomeMeta(effectiveOutcome);

  if (!meta) {
    return null;
  }

  return (
    <Badge variant="outline" className={meta.badgeClassName}>
      Outcome: {meta.label}
    </Badge>
  );
}
