import type { User } from "@/lib/types";

export const INVITE_SETUP_WINDOW_HOURS = 72;

export type InviteLifecycleStatus =
  | "ready_to_send"
  | "active"
  | "expired"
  | "revoked"
  | "accepted";

export type InviteLifecycleSummary = {
  status: InviteLifecycleStatus;
  label: string;
  description: string;
  expiresAt?: string;
  sentAt?: string;
  revokedAt?: string;
  acceptedAt?: string;
  resendCount: number;
  needsAttention: boolean;
};

function addHours(timestamp: string, hours: number) {
  const base = new Date(timestamp);

  if (Number.isNaN(base.getTime())) {
    return "";
  }

  return new Date(base.getTime() + hours * 60 * 60 * 1000).toISOString();
}

export function resolveInviteExpiry(user?: Pick<User, "inviteExpiresAt" | "inviteSetupLinkGeneratedAt" | "inviteSentAt"> | null) {
  if (!user) {
    return undefined;
  }

  if (user.inviteExpiresAt) {
    return user.inviteExpiresAt;
  }

  const reference = user.inviteSetupLinkGeneratedAt ?? user.inviteSentAt;
  return reference ? addHours(reference, INVITE_SETUP_WINDOW_HOURS) : undefined;
}

export function buildInviteLifecycleFields(existing: Partial<User> | undefined, timestamp: string) {
  const resendCount = (existing?.inviteResendCount ?? 0) + (existing?.inviteSentAt ? 1 : 0);

  return {
    inviteSentAt: timestamp,
    inviteSetupLinkGeneratedAt: timestamp,
    inviteExpiresAt: addHours(timestamp, INVITE_SETUP_WINDOW_HOURS),
    inviteRevokedAt: undefined,
    inviteRevokedBy: undefined,
    inviteRevocationReason: undefined,
    inviteLastResentAt: existing?.inviteSentAt ? timestamp : existing?.inviteLastResentAt,
    inviteResendCount: resendCount,
  };
}

export function getInviteLifecycleSummary(user?: Partial<User> | null, now = new Date()): InviteLifecycleSummary {
  const resendCount = user?.inviteResendCount ?? 0;
  const expiresAt = resolveInviteExpiry(user);

  if (!user?.inviteSentAt) {
    return {
      status: "ready_to_send",
      label: "Wala pang setup invite",
      description: "Hindi pa nakakagawa ng secure setup link para sa account na ito.",
      resendCount,
      needsAttention: true,
    };
  }

  if (user.inviteAcceptedAt || user.status === "active") {
    return {
      status: "accepted",
      label: "Na-accept na",
      description: "Nagamit na ang invite at nakapasok na ang user sa onboarding flow.",
      expiresAt,
      sentAt: user.inviteSentAt,
      acceptedAt: user.inviteAcceptedAt,
      resendCount,
      needsAttention: false,
    };
  }

  if (user.inviteRevokedAt) {
    return {
      status: "revoked",
      label: "Ni-revoke",
      description: user.inviteRevocationReason?.trim()
        ? `Naka-hold ang onboarding: ${user.inviteRevocationReason}`
        : "Naka-hold ang onboarding hanggang magpadala muli ng bagong secure invite.",
      expiresAt,
      sentAt: user.inviteSentAt,
      revokedAt: user.inviteRevokedAt,
      resendCount,
      needsAttention: true,
    };
  }

  if (expiresAt) {
    const parsedExpiry = new Date(expiresAt);
    if (!Number.isNaN(parsedExpiry.getTime()) && parsedExpiry.getTime() < now.getTime()) {
      return {
        status: "expired",
        label: "Expired",
        description: "Luma na ang huling setup link. Magpadala ng panibagong invite bago muli silang mag-setup.",
        expiresAt,
        sentAt: user.inviteSentAt,
        resendCount,
        needsAttention: true,
      };
    }
  }

  return {
    status: "active",
    label: "Aktibong invite",
    description: "May kasalukuyang setup link pa para sa pending_setup na account na ito.",
    expiresAt,
    sentAt: user.inviteSentAt,
    resendCount,
    needsAttention: false,
  };
}
