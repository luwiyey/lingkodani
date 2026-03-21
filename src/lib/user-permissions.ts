import type { User, UserPermissions, UserRole } from "@/lib/types";

function normalizeTitle(title?: string | null) {
  return title?.trim().toLowerCase() ?? "";
}

function isLegacyManagerTitle(title?: string | null) {
  const normalized = normalizeTitle(title);

  return (
    normalized.includes("administrator") ||
    normalized.includes("admin") ||
    normalized.includes("captain") ||
    normalized.includes("kapitan") ||
    normalized.includes("secretary") ||
    normalized.includes("sekret")
  );
}

export function buildDefaultUserPermissions(role: UserRole, title?: string | null): UserPermissions {
  if (role === "developer") {
    return {
      manageBarangaySettings: true,
      manageAutomation: true,
      manageSystemTeaching: true,
      accessDataCenter: true,
    };
  }

  const manager = isLegacyManagerTitle(title);

  return {
    manageBarangaySettings: manager,
    manageAutomation: manager,
    manageSystemTeaching: manager,
    accessDataCenter: false,
  };
}

export function resolveUserPermissions(user?: Pick<User, "role" | "title" | "permissions"> | null): UserPermissions {
  if (!user) {
    return buildDefaultUserPermissions("barangay");
  }

  return {
    ...buildDefaultUserPermissions(user.role, user.title),
    ...(user.permissions ?? {}),
  };
}

export function withResolvedUserPermissions<T extends Pick<User, "role" | "title" | "permissions">>(
  user: T
): T & { permissions: UserPermissions } {
  return {
    ...user,
    permissions: resolveUserPermissions(user),
  };
}
