import type { User } from "@/lib/types";
import { resolveUserPermissions } from "@/lib/user-permissions";

export function isDeveloperUser(user?: Pick<User, "role"> | null) {
  return user?.role === "developer";
}

export function canAccessBarangaySettingsWorkspace(
  user?: Pick<User, "role" | "title" | "permissions"> | null
) {
  return isDeveloperUser(user) || user?.role === "barangay";
}

export function isBarangayManager(user?: Pick<User, "role" | "title" | "permissions"> | null) {
  if (isDeveloperUser(user)) {
    return true;
  }

  if (user?.role !== "barangay") {
    return false;
  }

  return resolveUserPermissions(user).manageBarangaySettings === true;
}

export function canManageBarangaySettings(user?: Pick<User, "role" | "title" | "permissions"> | null) {
  return resolveUserPermissions(user).manageBarangaySettings === true;
}

export function canDeleteFarmerRecords(user?: Pick<User, "role" | "title" | "permissions"> | null) {
  return canManageBarangaySettings(user);
}

export function canManageAutomation(user?: Pick<User, "role" | "title" | "permissions"> | null) {
  return resolveUserPermissions(user).manageAutomation === true;
}

export function canManageSystemTeaching(user?: Pick<User, "role" | "title" | "permissions"> | null) {
  return resolveUserPermissions(user).manageSystemTeaching === true;
}

export function canAccessDataCenter(user?: Pick<User, "role" | "title" | "permissions"> | null) {
  return resolveUserPermissions(user).accessDataCenter === true;
}

export function canUseLiveSmsSimulation(user?: Pick<User, "role"> | null) {
  return isDeveloperUser(user);
}

export function getManagedBarangayUsers(users: User[]) {
  return users.filter((user) => user.role === "barangay");
}

export function getPlatformDeveloperUsers(users: User[]) {
  return users.filter((user) => user.role === "developer");
}
