import type { User } from "@/lib/types";

export interface UserRepository {
  listUsers(): Promise<User[]>;
  createUser(user: User): Promise<User>;
  updateUser(userId: string, user: User): Promise<User | null>;
  deleteUser(userId: string): Promise<void>;
}
