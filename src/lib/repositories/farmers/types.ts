import type { Farmer } from "@/lib/types";

export interface FarmerRepository {
  listFarmers(): Promise<Farmer[]>;
  createFarmer(input: Farmer): Promise<Farmer>;
  updateFarmer(id: string, updates: Partial<Farmer>): Promise<Farmer | null>;
  deleteFarmer(id: string): Promise<void>;
}
