import type { MarketPriceEntry } from "@/lib/types";
import type { MarketPriceRepository } from "@/lib/repositories/market-prices/types";
import { marketPrices as initialMarketPrices } from "@/lib/data";
import { createDemoCollectionStore } from "@/lib/repositories/demo-store";

const store = createDemoCollectionStore<MarketPriceEntry>({
  storageKey: "marketPrices",
  initialData: initialMarketPrices,
});

export const demoMarketPriceRepository: MarketPriceRepository = {
  async listMarketPrices() {
    return store.list();
  },

  async createMarketPriceEntry(entry) {
    return store.prepend(entry);
  },

  async updateMarketPriceEntry(id, updates) {
    return store.updateById(id, updates);
  },

  async deleteMarketPriceEntry(id) {
    store.deleteById(id);
  },
};
