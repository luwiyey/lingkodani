import type { FieldVisitTask } from "@/lib/types";
import type { FieldVisitRepository } from "@/lib/repositories/field-visits/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoFieldVisitStore?: FieldVisitTask[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoFieldVisitStore) {
    demoStore.__lingkodAniDemoFieldVisitStore = [];
  }

  return demoStore.__lingkodAniDemoFieldVisitStore;
}

export const demoFieldVisitRepository: FieldVisitRepository = {
  async listFieldVisitTasks() {
    return [...getStore()];
  },

  async createFieldVisitTask(task) {
    getStore().unshift(task);
    return task;
  },

  async updateFieldVisitTask(id, updates) {
    const store = getStore();
    const index = store.findIndex((item) => item.id === id);

    if (index === -1) {
      return null;
    }

    store[index] = {
      ...store[index],
      ...updates,
    };

    return store[index];
  },
};
