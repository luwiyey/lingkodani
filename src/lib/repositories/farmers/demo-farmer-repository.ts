import type { Farmer } from "@/lib/types";
import type { FarmerRepository } from "@/lib/repositories/farmers/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoFarmerStore?: Farmer[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoFarmerStore) {
    demoStore.__lingkodAniDemoFarmerStore = [];
  }

  return demoStore.__lingkodAniDemoFarmerStore;
}

export const demoFarmerRepository: FarmerRepository = {
  async listFarmers() {
    return [...getStore()];
  },

  async createFarmer(input) {
    getStore().unshift(input);
    return input;
  },

  async updateFarmer(id, updates) {
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

  async deleteFarmer(id) {
    demoStore.__lingkodAniDemoFarmerStore = getStore().filter((item) => item.id !== id);
  },
};
