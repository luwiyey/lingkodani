import type { AlertHistoryEntry } from "@/lib/types";

export interface AlertHistoryRepository {
  listAlertHistory(): Promise<AlertHistoryEntry[]>;
  createAlertHistoryEntry(entry: AlertHistoryEntry): Promise<AlertHistoryEntry>;
}
