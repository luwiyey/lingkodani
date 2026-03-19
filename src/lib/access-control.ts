import type { User } from "@/lib/types";

function normalizeTitle(user?: Pick<User, "title" | "role"> | null) {
  return user?.title?.trim().toLowerCase() ?? "";
}

export function isDeveloperUser(user?: Pick<User, "role"> | null) {
  return user?.role === "developer";
}

export function isBarangayManager(user?: Pick<User, "role" | "title"> | null) {
  if (isDeveloperUser(user)) {
    return true;
  }

  if (user?.role !== "barangay") {
    return false;
  }

  const title = normalizeTitle(user);
  return (
    title.includes("administrator") ||
    title.includes("admin") ||
    title.includes("captain") ||
    title.includes("kapitan") ||
    title.includes("secretary") ||
    title.includes("sekret")
  );
}

export function canManageBarangaySettings(user?: Pick<User, "role" | "title"> | null) {
  return isBarangayManager(user);
}

export function canAccessDataCenter(user?: Pick<User, "role"> | null) {
  return isDeveloperUser(user);
}

export function canUseLiveSmsSimulation(user?: Pick<User, "role"> | null) {
  return false;
}

export function getManagedBarangayUsers(users: User[]) {
  return users.filter((user) => user.role === "barangay");
}

export function getPlatformDeveloperUsers(users: User[]) {
  return users.filter((user) => user.role === "developer");
}
