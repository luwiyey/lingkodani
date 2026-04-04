import type { LogbookEntry } from "@/lib/types";

export interface LogbookRepository {
  listEntries(): Promise<LogbookEntry[]>;
  createEntry(entry: LogbookEntry): Promise<LogbookEntry>;
  updateEntry(id: string, updates: Partial<LogbookEntry>): Promise<LogbookEntry | null>;
}
