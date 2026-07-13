import { describe, expect, it } from "vitest";
import { buildMedicineCatalog, type SeedMedicineRecord } from "./medicine-catalog";

function seed(overrides: Partial<SeedMedicineRecord> & Pick<SeedMedicineRecord, "id" | "name" | "composition">): SeedMedicineRecord {
  return {
    rowNumber: 1,
    ...overrides
  };
}

describe("adult cough catalog classification", () => {
  it("classifies only the supported dextromethorphan 10mg lozenge shape as OTC", () => {
    const catalog = buildMedicineCatalog([
      seed({
        id: "adult-lozenge",
        name: "Adult Dry Cough Lozenges",
        composition: "Dextromethorphan Hydrobromide (10mg)",
        packaging: "strip of 10 lozenges",
        prescriptionRaw: "Not Mentioned"
      }),
      seed({
        id: "syrup",
        name: "Dry Cough Syrup",
        composition: "Dextromethorphan Hydrobromide (15mg/5ml)",
        packaging: "bottle of 100 ml",
        prescriptionRaw: "Not Mentioned"
      })
    ]);

    expect(catalog.find((medicine) => medicine.id === "adult-lozenge")).toMatchObject({
      form: "Lozenge",
      prescriptionStatus: "otc"
    });
    expect(catalog.find((medicine) => medicine.id === "syrup")?.prescriptionStatus).toBe("unknown");
  });

  it("does not import pholcodine into the recommendation catalog", () => {
    const catalog = buildMedicineCatalog([
      seed({
        id: "supported-record",
        name: "Adult Dry Cough Lozenges",
        composition: "Dextromethorphan Hydrobromide (10mg)",
        packaging: "strip of 10 lozenges",
        prescriptionRaw: "Not Mentioned"
      }),
      seed({
        id: "pholcodine",
        name: "Combination Cough Syrup",
        composition: "Pholcodine (1.5mg/5ml) + Phenylephrine (5mg/5ml)",
        packaging: "bottle of 100 ml",
        prescriptionRaw: "Prescription Required"
      })
    ]);

    expect(catalog.some((medicine) => medicine.id === "pholcodine")).toBe(false);
  });
});
