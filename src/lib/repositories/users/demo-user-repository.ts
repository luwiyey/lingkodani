import type { User } from "@/lib/types";
import type { UserRepository } from "@/lib/repositories/users/types";
import { getUserRecordId } from "@/lib/user-record";
import { registeredUsers as initialUsers } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<User>({
  storageKey: "users",
  initialData: initialUsers,
  getId: (user) => getUserRecordId(user),
});

export const demoUserRepository: UserRepository = {
  async listUsers() {
    return store.list();
  },

  async createUser(user) {
    const nextUser = {
      ...user,
      id: getUserRecordId(user),
    };

    return store.append(nextUser);
  },

  async updateUser(userId, user) {
    const nextUser = {
      ...user,
      id: getUserRecordId(user),
    };

    return store.updateById(userId, nextUser);
  },

  async deleteUser(userId) {
    store.deleteById(userId);
  },
};
