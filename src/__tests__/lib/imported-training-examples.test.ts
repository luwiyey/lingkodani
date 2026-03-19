import { buildImportedSmsTrainingExamples } from "@/lib/imported-training-examples";

describe("buildImportedSmsTrainingExamples", () => {
  it("fills safe defaults for missing metadata from imported documents", () => {
    const [example] = buildImportedSmsTrainingExamples(
      [
        {
          farmerName: "",
          phone: "",
          message: "May uod po sa palay namin.",
          analysisSource: "rules",
          originalIntent: "PEST_DISEASE",
          originalUrgency: "medium",
          originalSafetyFlag: "Medium",
          originalAdvice: "",
          originalConfidence: Number.NaN,
          reviewAction: "approved_as_is",
          finalStatus: "approved",
          finalIntent: "PEST_DISEASE",
          finalUrgency: "medium",
          finalSafetyFlag: "Medium",
          finalAdvice: "",
          reviewedBy: "",
          reviewedAt: "",
        },
      ],
      "training-sheet.pdf"
    );

    expect(example.farmerName).toBe("Imported Example 1");
    expect(example.phone).toBe("Imported-1");
    expect(example.originalAnalysis.aiAdvice).toBe("Imported training example.");
    expect(example.originalAnalysis.aiConfidence).toBe(0.55);
    expect(example.finalReview.reviewedBy).toBe("Imported from training-sheet.pdf");
  });

  it("preserves visible data and normalizes phone numbers when available", () => {
    const [example] = buildImportedSmsTrainingExamples(
      [
        {
          farmerName: "Juan Dela Cruz",
          phone: "09171234567",
          message: "Baha na po sa taniman.",
          analysisSource: "ai",
          originalIntent: "EMERGENCY",
          originalUrgency: "high",
          originalSafetyFlag: "High",
          originalTone: "Kritikal",
          originalAdvice: "Mag-evacuate agad.",
          originalConfidence: 0.91,
          reviewAction: "approved_edited",
          finalStatus: "replied",
          finalIntent: "EMERGENCY",
          finalUrgency: "high",
          finalSafetyFlag: "High",
          finalTone: "Kritikal",
          finalAdvice: "Mag-evacuate agad at i-report sa barangay.",
          reviewedBy: "AEW Maria",
          reviewedAt: "2026-03-19T10:00:00.000Z",
        },
      ],
      "review.jpg"
    );

    expect(example.farmerName).toBe("Juan Dela Cruz");
    expect(example.phone).toBe("639171234567");
    expect(example.originalAnalysis.aiConfidence).toBe(0.91);
    expect(example.finalReview.wasAdviceEdited).toBe(true);
    expect(example.finalReview.reviewedBy).toBe("AEW Maria");
  });
});
