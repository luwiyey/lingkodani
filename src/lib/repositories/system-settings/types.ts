import type { SystemSettings } from "@/lib/types";

export interface SystemSettingsRepository {
  getSettings(): Promise<SystemSettings>;
  saveSettings(settings: SystemSettings): Promise<SystemSettings>;
}
