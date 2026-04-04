import type { User, UserOnboardingState, UserOnboardingStepId } from "@/lib/types";

export const USER_ONBOARDING_VERSION = 1;

export type UserOnboardingStep = {
  id: UserOnboardingStepId;
  label: string;
  description: string;
  completed: boolean;
  completedAt?: string;
};

const STEP_ORDER: UserOnboardingStepId[] = [
  "profile_details",
  "contact_number",
  "workspace",
  "privacy",
  "security",
];

function hasProfileDetails(user: Pick<User, "name" | "title" | "barangay">) {
  return Boolean(user.name?.trim() && user.title?.trim() && user.barangay?.trim());
}

function hasWorkspacePreference(user: Pick<User, "preferredWorkspace" | "role">) {
  if (user.role === "developer") {
    return true;
  }

  return user.preferredWorkspace === "simple" || user.preferredWorkspace === "detailed";
}

export function getCompletedOnboardingStepIds(user: User): UserOnboardingStepId[] {
  const completed = new Set<UserOnboardingStepId>();

  if (hasProfileDetails(user)) {
    completed.add("profile_details");
  }

  if (user.phone?.trim() && user.phoneVerifiedAt) {
    completed.add("contact_number");
  }

  if (hasWorkspacePreference(user)) {
    completed.add("workspace");
  }

  if (user.privacyAcknowledgedAt) {
    completed.add("privacy");
  }

  if (user.securityReviewVerifiedAt) {
    completed.add("security");
  }

  return STEP_ORDER.filter((stepId) => completed.has(stepId));
}

export function getUserOnboardingSteps(user: User): UserOnboardingStep[] {
  const completedStepIds = new Set(getCompletedOnboardingStepIds(user));

  return [
    {
      id: "profile_details",
      label: "Kumpletuhin ang profile details",
      description: "Siguraduhing tama ang pangalan, tungkulin, at barangay assignment.",
      completed: completedStepIds.has("profile_details"),
      completedAt: user.onboarding?.completedStepIds?.includes("profile_details")
        ? user.onboarding.lastUpdatedAt
        : undefined,
    },
    {
      id: "contact_number",
      label: "Kumpirmahin ang mobile number",
      description: "Ito ang gagamitin para sa official reminders at contact recovery.",
      completed: completedStepIds.has("contact_number"),
      completedAt: user.phoneVerifiedAt,
    },
    {
      id: "workspace",
      label: "Piliin ang dashboard workspace",
      description: "Simple o Detalyado ang bubukas tuwing magla-login ka.",
      completed: completedStepIds.has("workspace"),
      completedAt: user.onboarding?.completedStepIds?.includes("workspace")
        ? user.onboarding.lastUpdatedAt
        : undefined,
    },
    {
      id: "privacy",
      label: "Basahin ang privacy at data-handling notes",
      description: "Kumpirmahing nauunawaan mo ang paghawak ng data ng magsasaka.",
      completed: completedStepIds.has("privacy"),
      completedAt: user.privacyAcknowledgedAt,
    },
    {
      id: "security",
      label: "Kumpirmahin ang seguridad ng account",
      description: "Mag-verify gamit ang password para ma-lock ang sensitive access setup.",
      completed: completedStepIds.has("security"),
      completedAt: user.securityReviewVerifiedAt,
    },
  ];
}

export function isUserOnboardingComplete(user: User) {
  return getCompletedOnboardingStepIds(user).length === STEP_ORDER.length;
}

export function shouldForceUserOnboarding(user?: Pick<User, "status" | "role" | "preferredWorkspace" | "name" | "title" | "barangay" | "phone" | "phoneVerifiedAt" | "privacyAcknowledgedAt" | "securityReviewVerifiedAt"> & Partial<User> | null) {
  if (!user) {
    return false;
  }

  if (user.status !== "pending_setup") {
    return false;
  }

  return !isUserOnboardingComplete(user as User);
}

export function syncUserOnboardingState(user: User, actorName: string, timestamp = new Date().toISOString()): User {
  const completedStepIds = getCompletedOnboardingStepIds(user);
  const completedAt = completedStepIds.length === STEP_ORDER.length
    ? user.onboarding?.completedAt ?? timestamp
    : undefined;

  const onboarding: UserOnboardingState = {
    version: USER_ONBOARDING_VERSION,
    completedStepIds,
    startedAt: user.onboarding?.startedAt ?? user.createdAt ?? timestamp,
    completedAt,
    lastUpdatedAt: timestamp,
    lastUpdatedBy: actorName,
  };

  return {
    ...user,
    onboarding,
    status: completedAt && user.status === "pending_setup" ? "active" : user.status,
  };
}
