import type {
  SmsResolutionConfirmationStatus,
  SmsCaseOutcomeStatus,
  SmsCaseStatus,
  SmsMessage,
} from "@/lib/types";

export const SMS_CASE_OUTCOME_META: Record<
  SmsCaseOutcomeStatus,
  {
    label: string;
    helper: string;
    badgeClassName: string;
  }
> = {
  monitoring: {
    label: "Mino-monitor",
    helper: "Patuloy pang tinitingnan ang lagay ng concern.",
    badgeClassName:
      "border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200",
  },
  improving: {
    label: "May pagbuti",
    helper: "Mukhang umuubra ang payo o tulong, pero hindi pa tapos ang monitoring.",
    badgeClassName:
      "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  },
  needs_follow_up: {
    label: "Kailangan ng follow-up",
    helper: "May susunod pang check-in o aksyon na kailangan.",
    badgeClassName:
      "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  },
  referred: {
    label: "Na-refer",
    helper: "Na-escalate o naipasa sa ibang tao o tanggapan.",
    badgeClassName:
      "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  },
  resolved: {
    label: "Nalutas",
    helper: "Naresolba na at maaari nang isara ang case.",
    badgeClassName:
      "border-primary/25 bg-primary/10 text-primary",
  },
};

export function getCaseStatusForOutcome(
  outcome: SmsCaseOutcomeStatus
): SmsCaseStatus {
  if (outcome === "resolved") {
    return "monitoring";
  }

  if (outcome === "referred") {
    return "escalated";
  }

  return "monitoring";
}

export function getEffectiveSmsCaseOutcome(
  message: Pick<
    SmsMessage,
    "caseOutcomeStatus" | "caseStatus" | "closedAt"
  >
): SmsCaseOutcomeStatus | null {
  if (message.caseOutcomeStatus) {
    return message.caseOutcomeStatus;
  }

  if (message.caseStatus === "closed" || message.closedAt) {
    return "resolved";
  }

  if (message.caseStatus === "escalated") {
    return "referred";
  }

  if (message.caseStatus === "monitoring") {
    return "monitoring";
  }

  return null;
}

export function isAwaitingFarmerConfirmation(
  message: Pick<SmsMessage, "caseOutcomeStatus" | "resolutionConfirmationStatus" | "closedAt">
) {
  return (
    message.caseOutcomeStatus === "resolved" &&
    message.resolutionConfirmationStatus === "awaiting_farmer" &&
    !message.closedAt
  );
}

export function isFarmerConfirmedResolution(
  message: Pick<SmsMessage, "resolutionConfirmationStatus" | "closedAt">
) {
  return (
    message.resolutionConfirmationStatus === "confirmed_by_farmer" ||
    Boolean(message.closedAt)
  );
}

export function getResolutionConfirmationMeta(
  status: SmsResolutionConfirmationStatus | null | undefined
) {
  if (status === "awaiting_farmer") {
    return {
      label: "Hintay kumpirmasyon",
      helper: "Nakapagbigay na ng paunang resolution pero hinihintay pa ang kumpirmasyon ng magsasaka.",
      badgeClassName:
        "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    };
  }

  if (status === "confirmed_by_farmer") {
    return {
      label: "Kinumpirma ng farmer",
      helper: "Kinumpirma na ng magsasaka na maayos na ang concern.",
      badgeClassName:
        "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    };
  }

  if (status === "reopened") {
    return {
      label: "Ibinalik sa follow-up",
      helper: "Hindi pa pala sapat ang naunang resolution at kailangan pang balikan.",
      badgeClassName:
        "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
    };
  }

  return null;
}

export function getSmsCaseOutcomeMeta(
  status: SmsCaseOutcomeStatus | null | undefined
) {
  return status ? SMS_CASE_OUTCOME_META[status] : null;
}
