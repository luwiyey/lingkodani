import type { SmsMessage, User } from "@/lib/types";

function normalize(value?: string | null) {
  return value?.trim().toLowerCase() ?? "";
}

export function getUserAssignmentId(user?: Pick<User, "id" | "uid" | "email"> | null) {
  return normalize(user?.id ?? user?.uid ?? user?.email);
}

export function isSmsAssignedToUser(
  message: Pick<SmsMessage, "assignedTo" | "assignedToUserId">,
  user?: Pick<User, "id" | "uid" | "email" | "name"> | null
) {
  if (!user) {
    return false;
  }

  const assignedUserId = normalize(message.assignedToUserId);
  const candidateIds = [user.id, user.uid, user.email].map((value) => normalize(value)).filter(Boolean);

  if (assignedUserId && candidateIds.includes(assignedUserId)) {
    return true;
  }

  return normalize(message.assignedTo) === normalize(user.name);
}

export function resolveSmsAssignee(
  users: User[],
  message: Pick<SmsMessage, "assignedTo" | "assignedToUserId">
) {
  return (
    users.find((user) => isSmsAssignedToUser(message, user)) ??
    null
  );
}
