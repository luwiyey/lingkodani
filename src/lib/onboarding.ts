import { registeredUsers as initialUsers } from "@/lib/data";
import type { PreferredWorkspace, User } from "@/lib/types";

export type ApplicationChoice = "demo" | "live";

export type OnboardingProfile = {
  application: ApplicationChoice;
  position: string;
  age?: string;
  yearsInService: string;
  preferredWorkspace: PreferredWorkspace;
  completedAt: string;
};

const ONBOARDING_STORAGE_KEY = "lingkodAniOnboardingProfile";
const DEMO_PREVIEW_STORAGE_KEY = "lingkodAniDemoPreviewUser";

export const DEMO_PREVIEW_EVENT = "lingkod-ani-demo-preview-change";

function canUseBrowserStorage() {
  return typeof window !== "undefined";
}

function parseJson<T>(value: string | null): T | null {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function readOnboardingProfile() {
  if (!canUseBrowserStorage()) {
    return null;
  }

  return parseJson<OnboardingProfile>(window.localStorage.getItem(ONBOARDING_STORAGE_KEY));
}

export function saveOnboardingProfile(profile: OnboardingProfile) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(profile));
}

export function readDemoPreviewUser() {
  if (!canUseBrowserStorage()) {
    return null;
  }

  return parseJson<User>(window.localStorage.getItem(DEMO_PREVIEW_STORAGE_KEY));
}

export function saveDemoPreviewUser(user: User) {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.setItem(DEMO_PREVIEW_STORAGE_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event(DEMO_PREVIEW_EVENT));
}

export function clearDemoPreviewUser() {
  if (!canUseBrowserStorage()) {
    return;
  }

  window.localStorage.removeItem(DEMO_PREVIEW_STORAGE_KEY);
  window.dispatchEvent(new Event(DEMO_PREVIEW_EVENT));
}

export function pickDemoProfile(position: string, preferredWorkspace: PreferredWorkspace) {
  const normalizedPosition = position.trim().toLowerCase();

  if (normalizedPosition.includes("developer")) {
    return initialUsers.find((user) => user.role === "developer") ?? initialUsers[0];
  }

  if (normalizedPosition.includes("secretary") || normalizedPosition.includes("sekret")) {
    return initialUsers.find((user) => user.email === "secretary@lingkodani.gov.ph") ?? initialUsers[0];
  }

  if (normalizedPosition.includes("captain") || normalizedPosition.includes("kapitan")) {
    return initialUsers.find((user) => user.email === "captain@lingkodani.gov.ph") ?? initialUsers[0];
  }

  if (
    normalizedPosition.includes("aew") ||
    normalizedPosition.includes("agricultural") ||
    normalizedPosition.includes("extension")
  ) {
    return initialUsers.find((user) => user.email === "aew@lingkodani.gov.ph") ?? initialUsers[0];
  }

  if (preferredWorkspace === "simple") {
    return initialUsers.find((user) => user.email === "secretary@lingkodani.gov.ph") ?? initialUsers[0];
  }

  return initialUsers.find((user) => user.email === "brgy-admin@lingkodani.gov.ph") ?? initialUsers[0];
}

export function createDemoPreviewUser(profile: OnboardingProfile): User {
  const baseProfile = pickDemoProfile(profile.position, profile.preferredWorkspace);
  const timestamp = new Date().toISOString();

  return {
    ...baseProfile,
    id: `preview-${baseProfile.id ?? baseProfile.email}`,
    uid: undefined,
    title: profile.position.trim() || baseProfile.title,
    preferredWorkspace: baseProfile.role === "developer" ? "detailed" : profile.preferredWorkspace,
    status: "active",
    barangay: "Batakil",
    lastLoginAt: timestamp,
    updatedAt: timestamp,
  };
}
