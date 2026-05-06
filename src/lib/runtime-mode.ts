import { isDemoMode, isLiveMode } from "@/lib/config/app-mode";
import { readDemoPreviewUser } from "@/lib/onboarding";
import type { User } from "@/lib/types";

type RuntimeModeContext = {
  currentUser?: { uid?: string | null } | null;
  currentUserProfile?: Pick<User, "email" | "uid"> | null;
};

export const DEMO_PREVIEW_EMAIL_DOMAIN = "@demo.lingkodani.local";

export function isDemoPreviewProfile(profile?: Pick<User, "email" | "uid"> | null) {
  return Boolean(
    profile &&
      !profile.uid &&
      typeof profile.email === "string" &&
      profile.email.endsWith(DEMO_PREVIEW_EMAIL_DOMAIN)
  );
}

export function hasActiveDemoPreview() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(readDemoPreviewUser());
}

export function isDemoRuntimeActive(context: RuntimeModeContext = {}) {
  if (isDemoMode) {
    return true;
  }

  if (!isLiveMode) {
    return false;
  }

  if (context.currentUser?.uid) {
    return false;
  }

  if (isDemoPreviewProfile(context.currentUserProfile)) {
    return true;
  }

  return hasActiveDemoPreview();
}

export function isLiveRuntimeActive(context: RuntimeModeContext = {}) {
  return isLiveMode && !isDemoRuntimeActive(context);
}
