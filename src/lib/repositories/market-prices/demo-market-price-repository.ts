import type { MarketPriceEntry } from "@/lib/types";
import type { MarketPriceRepository } from "@/lib/repositories/market-prices/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoMarketPriceStore?: MarketPriceEntry[];
};

function getStore() {
  if (!demoStore.__lingkodAniDemoMarketPriceStore) {
    demoStore.__lingkodAniDemoMarketPriceStore = [];
  }

  return demoStore.__lingkodAniDemoMarketPriceStore;
}

export const demoMarketPriceRepository: MarketPriceRepository = {
  async listMarketPrices() {
    return [...getStore()];
  },

  async createMarketPriceEntry(entry) {
    getStore().unshift(entry);
    return entry;
  },

  async updateMarketPriceEntry(id, updates) {
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

  async deleteMarketPriceEntry(id) {
    demoStore.__lingkodAniDemoMarketPriceStore = getStore().filter((item) => item.id !== id);
  },
};
