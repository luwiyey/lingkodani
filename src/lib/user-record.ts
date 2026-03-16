import type { User } from "@/lib/types";

export function getUserRecordId(user: Pick<User, "id" | "uid" | "email">) {
  return user.id ?? user.uid ?? user.email;
}
