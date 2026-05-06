import { farmers as initialFarmers } from "@/lib/data";
import { demoFarmerRepository } from "@/lib/repositories/farmers/demo-farmer-repository";
import { demoSystemSettingsRepository } from "@/lib/repositories/system-settings/demo-system-settings-repository";
import { clearDemoStoreCaches } from "@/lib/repositories/demo-store";

describe("demo repositories", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearDemoStoreCaches([
      "farmers",
      "systemSettings",
    ]);
  });

  it("seeds farmers from mock data and persists approval updates", async () => {
    const seededFarmers = await demoFarmerRepository.listFarmers();
    const pendingFarmer = seededFarmers.find((farmer) => farmer.status === "pending_approval");

    expect(seededFarmers).toHaveLength(initialFarmers.length);
    expect(pendingFarmer).toBeDefined();

    const updatedFarmer = await demoFarmerRepository.updateFarmer(pendingFarmer!.id, {
      status: "active",
    });

    expect(updatedFarmer?.status).toBe("active");

    const reloadedFarmers = await demoFarmerRepository.listFarmers();
    const persistedFarmer = reloadedFarmers.find((farmer) => farmer.id === pendingFarmer!.id);

    expect(persistedFarmer?.status).toBe("active");

    const storedFarmers = JSON.parse(window.localStorage.getItem("farmers") ?? "[]") as typeof initialFarmers;
    const storedFarmer = storedFarmers.find((farmer) => farmer.id === pendingFarmer!.id);

    expect(storedFarmer?.status).toBe("active");
  });

  it("returns null for invalid farmer approvals instead of silently mutating nothing", async () => {
    const result = await demoFarmerRepository.updateFarmer("FARM-DOES-NOT-EXIST", {
      status: "active",
    });

    expect(result).toBeNull();
  });

  it("persists demo system settings through the shared mock store", async () => {
    const seededSettings = await demoSystemSettingsRepository.getSettings();

    expect(seededSettings.notificationPolicy).toBeDefined();

    const savedSettings = await demoSystemSettingsRepository.saveSettings({
      ...seededSettings,
      autoReplyEnabled: false,
    });

    expect(savedSettings.autoReplyEnabled).toBe(false);

    const reloadedSettings = await demoSystemSettingsRepository.getSettings();
    expect(reloadedSettings.autoReplyEnabled).toBe(false);
  });
});
