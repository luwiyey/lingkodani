import type { User } from "@/lib/types";
import type { UserRepository } from "@/lib/repositories/users/types";
import { getUserRecordId } from "@/lib/user-record";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoUserStore?: User[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoUserStore) {
    demoStore.__lingkodAniDemoUserStore = [];
  }

  return demoStore.__lingkodAniDemoUserStore;
}

export const demoUserRepository: UserRepository = {
  async listUsers() {
    return [...getStore()];
  },

  async createUser(user) {
    getStore().push({
      ...user,
      id: getUserRecordId(user),
    });
    return user;
  },

  async updateUser(userId, user) {
    const store = getStore();
    const index = store.findIndex((item) => getUserRecordId(item) === userId);

    if (index === -1) return null;

    const nextUser = {
      ...user,
      id: getUserRecordId(user),
    };
    store[index] = nextUser;
    return nextUser;
  },

  async deleteUser(userId) {
    demoStore.__lingkodAniDemoUserStore = getStore().filter((item) => getUserRecordId(item) !== userId);
  },
};
