import { defaultSystemSettings, mergeSystemSettings } from "@/lib/system-settings";
import type { SystemSettings } from "@/lib/types";
import type { SystemSettingsRepository } from "@/lib/repositories/system-settings/types";

const demoStore = globalThis as typeof globalThis & {
  __lingkodAniDemoSystemSettings?: SystemSettings;
};

function getStore() {
  if (!demoStore.__lingkodAniDemoSystemSettings) {
    demoStore.__lingkodAniDemoSystemSettings = mergeSystemSettings(defaultSystemSettings);
  }

  return demoStore.__lingkodAniDemoSystemSettings;
}

export const demoSystemSettingsRepository: SystemSettingsRepository = {
  async getSettings() {
    return mergeSystemSettings(getStore());
  },

  async saveSettings(settings) {
    demoStore.__lingkodAniDemoSystemSettings = mergeSystemSettings(settings);
    return mergeSystemSettings(demoStore.__lingkodAniDemoSystemSettings);
  },
};
