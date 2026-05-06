import type { Resource } from "@/lib/types";
import type { ResourceRepository } from "@/lib/repositories/resources/types";
import { resources as initialResources } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<Resource>({
  storageKey: "resources",
  initialData: initialResources,
});

export const demoResourceRepository: ResourceRepository = {
  async listResources() {
    return store.list();
  },

  async createResource(resource) {
    return store.prepend(resource);
  },

  async updateResource(id, updates) {
    return store.updateById(id, updates);
  },

  async deleteResource(id) {
    store.deleteById(id);
  },
};
