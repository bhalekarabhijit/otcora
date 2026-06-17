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
});
