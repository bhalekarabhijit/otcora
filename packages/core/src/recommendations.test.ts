import { describe, expect, it } from "vitest";
import { recommendMedicines } from "./recommendations";
import { searchSymptoms } from "./symptoms";

describe("symptom search", () => {
  it("returns prefix matches as a user types", () => {
    expect(searchSymptoms("c").map((symptom) => symptom.id)).toContain("cough");
    expect(searchSymptoms("cou")[0]?.id).toBe("cough");
    expect(searchSymptoms("bp").map((symptom) => symptom.id)).toContain("high-blood-pressure");
  });
});

describe("recommendMedicines", () => {
  it("uses the imported catalog and separates prescription results", () => {
    const result = recommendMedicines({ symptomIds: ["bacterial-infection"] });
    expect(result.prescription.length).toBeGreaterThan(0);
    expect(result.prescription.some((item) => item.medicine.composition?.toLowerCase().includes("azithromycin"))).toBe(true);
  });

  it("moves allergy matches into avoid", () => {
    const result = recommendMedicines({
      symptomIds: ["fever"],
      context: { allergies: ["paracetamol"] }
    });
    expect(result.avoid.some((item) => item.medicine.composition?.toLowerCase().includes("paracetamol"))).toBe(true);
  });

  it("does not return unrelated OTC medicines for a symptom", () => {
    const result = recommendMedicines({ symptomIds: ["acidity"] });
    expect(result.otc.every((item) => item.medicine.symptomIds.includes("acidity"))).toBe(true);
  });

  it("does not alphabetically flood fever results", () => {
    const result = recommendMedicines({ symptomIds: ["fever"] });
    const firstPage = result.otcGroups[0]?.products ?? [];
    const firstLetters = new Set(firstPage.map((item) => item.medicine.name[0]?.toUpperCase()).filter(Boolean));

    expect(firstPage.length).toBeGreaterThan(3);
    expect(firstLetters.size).toBeGreaterThan(1);
    expect(firstPage.every((item) => item.medicine.composition?.toLowerCase().includes("paracetamol"))).toBe(true);
  });

  it("groups fever recommendations by composition with limited product examples", () => {
    const result = recommendMedicines({ symptomIds: ["fever"] });
    const firstGroup = result.otcGroups[0];

    expect(firstGroup?.title).toBe("Paracetamol");
    expect(firstGroup?.totalProducts).toBeGreaterThan(100);
    expect(firstGroup?.products.length).toBeLessThanOrEqual(4);
    expect(result.otc.length).toBeLessThanOrEqual(result.otcGroups.length * 4);
  });
});
