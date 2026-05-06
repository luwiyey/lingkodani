import type { Farmer } from "@/lib/types";
import type { FarmerRepository } from "@/lib/repositories/farmers/types";
import { farmers as initialFarmers } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<Farmer>({
  storageKey: "farmers",
  initialData: initialFarmers,
});

export const demoFarmerRepository: FarmerRepository = {
  async listFarmers() {
    return store.list();
  },

  async createFarmer(input) {
    return store.prepend(input);
  },

  async updateFarmer(id, updates) {
    return store.updateById(id, updates);
  },

  async deleteFarmer(id) {
    store.deleteById(id);
  },
};
