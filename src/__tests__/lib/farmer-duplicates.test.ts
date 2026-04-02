import { findPossibleFarmerDuplicates } from "@/lib/farmer-duplicates";
import type { Farmer } from "@/lib/types";

const baseFarmer: Farmer = {
  id: "FARM-1",
  name: "Juan Dela Cruz",
  age: 45,
  gender: "Lalaki",
  phone: "+639171230001",
  barangay: "Batakil",
  sitio: "Zone 1",
  farmSize: 1,
  crops: ["Palay"],
  registrationDate: "2026-03-01T00:00:00.000Z",
  lastSmsActivity: "2026-03-21T00:00:00.000Z",
  status: "active",
};

describe("farmer-duplicates", () => {
  it("flags highly similar farmer records as possible duplicates", () => {
    const duplicates = findPossibleFarmerDuplicates(baseFarmer, [
      {
        ...baseFarmer,
        id: "FARM-2",
        phone: "09171230001",
        status: "pending_approval",
      },
      {
        ...baseFarmer,
        id: "FARM-3",
        name: "Pedro Santos",
        phone: "+639171230099",
        sitio: "Zone 4",
      },
    ]);

    expect(duplicates).toHaveLength(1);
    expect(duplicates[0].farmerId).toBe("FARM-2");
    expect(duplicates[0].reasons).toContain("parehong numero");
    expect(duplicates[0].reasons).toContain("parehong pangalan");
  });
});
