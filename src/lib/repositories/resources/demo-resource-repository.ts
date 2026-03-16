import type { Resource } from "@/lib/types";
import type { ResourceRepository } from "@/lib/repositories/resources/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoResourceStore?: Resource[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoResourceStore) {
    demoStore.__lingkodAniDemoResourceStore = [];
  }

  return demoStore.__lingkodAniDemoResourceStore;
}

export const demoResourceRepository: ResourceRepository = {
  async listResources() {
    return [...getStore()];
  },

  async createResource(resource) {
    getStore().unshift(resource);
    return resource;
  },

  async updateResource(id, updates) {
    const store = getStore();
    const index = store.findIndex((item) => item.id === id);

    if (index === -1) return null;

    store[index] = {
      ...store[index],
      ...updates,
    };

    return store[index];
  },

  async deleteResource(id) {
    demoStore.__lingkodAniDemoResourceStore = getStore().filter((item) => item.id !== id);
  },
};
