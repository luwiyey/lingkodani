import {
  canAccessBarangaySettingsWorkspace,
  canAccessDataCenter,
  canDeleteFarmerRecords,
  canManageBarangaySettings,
  canManageAutomation,
  canUseLiveSmsSimulation,
  getManagedBarangayUsers,
  getPlatformDeveloperUsers,
} from "@/lib/access-control";
import type { User } from "@/lib/types";

const barangayAdmin: User = {
  id: "u-1",
  email: "admin@lingkodani.gov.ph",
  name: "Barangay Admin",
  role: "barangay",
  title: "Barangay Administrator",
};

const aewUser: User = {
  id: "u-2",
  email: "aew@lingkodani.gov.ph",
  name: "AEW",
  role: "barangay",
  title: "Agricultural Extension Worker",
};

const developerUser: User = {
  id: "u-3",
  email: "dev@lingkodani.gov.ph",
  name: "Developer",
  role: "developer",
  title: "Platform Developer",
};

describe("access-control", () => {
  it("allows barangay managers to access settings but not the data center", () => {
    expect(canManageBarangaySettings(barangayAdmin)).toBe(true);
    expect(canAccessDataCenter(barangayAdmin)).toBe(false);
  });

  it("keeps AEW users out of manager-only settings", () => {
    expect(canManageBarangaySettings(aewUser)).toBe(false);
    expect(canDeleteFarmerRecords(aewUser)).toBe(false);
  });

  it("lets barangay managers and developers delete farmer records", () => {
    expect(canDeleteFarmerRecords(barangayAdmin)).toBe(true);
    expect(canDeleteFarmerRecords(developerUser)).toBe(true);
  });

  it("still lets barangay staff open the Barangay Settings workspace", () => {
    expect(canAccessBarangaySettingsWorkspace(aewUser)).toBe(true);
    expect(canAccessBarangaySettingsWorkspace(barangayAdmin)).toBe(true);
  });

  it("respects explicit permission flags when present", () => {
    expect(
      canManageAutomation({
        ...aewUser,
        permissions: {
          manageAutomation: true,
        },
      })
    ).toBe(true);
  });

  it("treats the data center as developer-only and keeps live SMS testing developer-only", () => {
    expect(canAccessDataCenter(developerUser)).toBe(true);
    expect(canUseLiveSmsSimulation(developerUser)).toBe(true);
    expect(canUseLiveSmsSimulation(barangayAdmin)).toBe(false);
  });

  it("splits barangay users from platform developers cleanly", () => {
    const users = [barangayAdmin, aewUser, developerUser];

    expect(getManagedBarangayUsers(users)).toEqual([barangayAdmin, aewUser]);
    expect(getPlatformDeveloperUsers(users)).toEqual([developerUser]);
  });
});
