import {
  buildFarmerEvidenceLogbookData,
  describeFarmerEvidenceAttachment,
  getFarmerEvidenceAttachment,
  getFarmerEvidenceTypeLabel,
} from "@/lib/farmer-evidence";
import type { FarmerEvidenceAttachment, LogbookEntry } from "@/lib/types";

const attachment: FarmerEvidenceAttachment = {
  id: "ATT-1",
  farmerId: "FARM-1",
  type: "field_photo",
  title: "Pinsala sa palayan",
  fileName: "palay-damage.jpg",
  mimeType: "image/jpeg",
  url: "https://example.com/palay-damage.jpg",
  uploadedAt: "2026-03-20T09:00:00.000Z",
  uploadedBy: "AEW Jose Rizal",
  notes: "May pagbaha sa gilid ng pilapil.",
  sizeBytes: 2048,
};

describe("farmer-evidence", () => {
  it("extracts attachment metadata from a logbook entry", () => {
    const entry: LogbookEntry = {
      id: "LOG-1",
      farmerId: "FARM-1",
      timestamp: "2026-03-20T09:00:00.000Z",
      type: "Tala sa Bukid",
      title: "Larawan na-upload",
      description: "test",
      data: buildFarmerEvidenceLogbookData(attachment),
    };

    expect(getFarmerEvidenceAttachment(entry)).toEqual(attachment);
  });

  it("returns readable labels and descriptions", () => {
    expect(getFarmerEvidenceTypeLabel("audio")).toBe("Audio");
    expect(describeFarmerEvidenceAttachment(attachment)).toContain("palay-damage.jpg");
    expect(describeFarmerEvidenceAttachment(attachment)).toContain("pagbaha");
  });
});
