import type { FieldVisitTask } from "@/lib/types";
import type { FieldVisitRepository } from "@/lib/repositories/field-visits/types";
import { fieldVisitTasks as initialFieldVisitTasks } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<FieldVisitTask>({
  storageKey: "fieldVisitTasks",
  initialData: initialFieldVisitTasks,
});

export const demoFieldVisitRepository: FieldVisitRepository = {
  async listFieldVisitTasks() {
    return store.list();
  },

  async createFieldVisitTask(task) {
    return store.prepend(task);
  },

  async updateFieldVisitTask(id, updates) {
    return store.updateById(id, updates);
  },
};
