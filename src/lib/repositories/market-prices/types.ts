import type { MarketPriceEntry } from "@/lib/types";

export interface MarketPriceRepository {
  listMarketPrices(): Promise<MarketPriceEntry[]>;
  createMarketPriceEntry(entry: MarketPriceEntry): Promise<MarketPriceEntry>;
  updateMarketPriceEntry(id: string, updates: Partial<MarketPriceEntry>): Promise<MarketPriceEntry | null>;
  deleteMarketPriceEntry(id: string): Promise<void>;
}
