import type { FarmerAssistanceRecord } from "@/lib/types";

export interface AssistanceRepository {
  listAssistanceRecords(): Promise<FarmerAssistanceRecord[]>;
  createAssistanceRecord(record: FarmerAssistanceRecord): Promise<FarmerAssistanceRecord>;
  updateAssistanceRecord(id: string, updates: Partial<FarmerAssistanceRecord>): Promise<FarmerAssistanceRecord | null>;
}
