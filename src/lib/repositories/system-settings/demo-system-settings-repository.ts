import { defaultSystemSettings, mergeSystemSettings } from "@/lib/system-settings";
import type { SystemSettings } from "@/lib/types";
import type { SystemSettingsRepository } from "@/lib/repositories/system-settings/types";
import { createDemoSingletonStore } from "@/lib/repositories/demo-store";

const store = createDemoSingletonStore<SystemSettings>({
  storageKey: "systemSettings",
  initialData: mergeSystemSettings(defaultSystemSettings),
});

export const demoSystemSettingsRepository: SystemSettingsRepository = {
  async getSettings() {
    return mergeSystemSettings(store.get());
  },

  async saveSettings(settings) {
    return mergeSystemSettings(store.set(mergeSystemSettings(settings)));
  },
};
