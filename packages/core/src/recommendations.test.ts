import { describe, expect, it } from "vitest";
import { recommendMedicines } from "./recommendations";
import { searchSymptoms } from "./symptoms";

describe("symptom search", () => {
  it("returns prefix matches as a user types", () => {
    expect(searchSymptoms("c").map((symptom) => symptom.id)).toContain("cough");
    expect(searchSymptoms("cou")[0]?.id).toBe("cough");
  });
});

describe("recommendMedicines", () => {
  it("separates OTC and prescription results", () => {
    const result = recommendMedicines({ symptomIds: ["cough"] });
    expect(result.otc.some((item) => item.medicine.id === "dextromethorphan-syrup")).toBe(true);
    expect(result.prescription.some((item) => item.medicine.id === "azithromycin-500")).toBe(true);
  });

  it("moves allergy matches into avoid", () => {
    const result = recommendMedicines({
      symptomIds: ["fever"],
      context: { allergies: ["paracetamol"] }
    });
    expect(result.avoid.some((item) => item.medicine.id === "paracetamol-500")).toBe(true);
  });
});
