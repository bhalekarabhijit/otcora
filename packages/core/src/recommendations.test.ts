import { describe, expect, it } from "vitest";
import { recommendMedicines } from "./recommendations";
import { searchSymptoms, symptoms } from "./symptoms";

describe("symptom search", () => {
  it("returns prefix matches as a user types", () => {
    expect(searchSymptoms("c").map((symptom) => symptom.id)).toContain("cough");
    expect(searchSymptoms("cou")[0]?.id).toBe("cough");
    expect(searchSymptoms("bp").map((symptom) => symptom.id)).toContain("high-blood-pressure");
  });
});

describe("recommendMedicines", () => {
  const adultContext = { adultConfirmed: true as const };

  it("uses the imported catalog and separates prescription context", () => {
    const result = recommendMedicines({ symptomIds: ["cough"], context: adultContext });
    expect(result.otcGroups.length).toBeGreaterThan(0);
    expect(result.prescriptionGroups.length).toBeGreaterThan(0);
    expect(result.otc.every((item) => item.medicine.prescriptionStatus === "otc")).toBe(true);
    expect(result.prescription.every((item) => item.medicine.prescriptionStatus === "prescription")).toBe(true);
  });

  it("does not invent prescription context for a general fever", () => {
    const result = recommendMedicines({ symptomIds: ["fever"], context: adultContext });
    expect(result.prescriptionGroups).toHaveLength(0);
  });

  it("keeps cold combinations out of a fever-only result", () => {
    const result = recommendMedicines({ symptomIds: ["fever"], context: adultContext });

    expect(result.otcGroups.map((group) => group.title)).toEqual(["Paracetamol"]);
  });

  it("shows lubricant eye drops and separates prescription allergy drops", () => {
    const result = recommendMedicines({ symptomIds: ["eye-allergy"], context: adultContext });

    expect(result.otcGroups.some((group) => group.title === "Carboxymethylcellulose")).toBe(true);
    expect(result.prescriptionGroups.some((group) => group.title === "Olopatadine")).toBe(true);
    expect(result.seekCare.some((item) => item.title === "Eye warning signs")).toBe(true);
  });

  it("gives every searchable symptom a meaningful outcome", () => {
    for (const symptom of symptoms) {
      const result = recommendMedicines({ symptomIds: [symptom.id], context: adultContext });
      const hasOutcome = result.selfCareBlocked
        || result.otcGroups.length > 0
        || result.prescriptionGroups.length > 0
        || result.seekCare.length > 0;

      expect(hasOutcome, `${symptom.id} silently returned no outcome`).toBe(true);
    }
  });

  it("adds relevant OTC compositions as more symptoms are selected", () => {
    const fever = recommendMedicines({ symptomIds: ["fever"], context: adultContext });
    const combined = recommendMedicines({
      symptomIds: ["fever", "cold", "blocked-nose"],
      context: adultContext
    });

    expect(fever.otcGroups.map((group) => group.title)).toContain("Paracetamol");
    expect(combined.otcGroups.length).toBeGreaterThan(fever.otcGroups.length);
    expect(combined.otcGroups.some((group) => group.title.includes("Phenylephrine"))).toBe(true);
    expect(combined.otcGroups.some((group) => group.title.includes("Oxymetazoline"))).toBe(true);
  });

  it("returns adult nasal decongestant examples for blocked nose", () => {
    const result = recommendMedicines({ symptomIds: ["blocked-nose"], context: adultContext });

    expect(result.otcGroups.length).toBeGreaterThan(0);
    expect(result.otcGroups.some((group) => group.title === "Oxymetazoline")).toBe(true);
    expect(result.otcGroups.some((group) => group.title.includes("Paracetamol"))).toBe(false);
    expect(result.otc.every((item) => !/paediatric|pediatric|kid|baby|infant/i.test(item.medicine.name))).toBe(true);
  });

  it("does not assume a generic rash or viral illness has one specific cause", () => {
    const rash = recommendMedicines({ symptomIds: ["skin-rash"], context: adultContext });
    const viral = recommendMedicines({ symptomIds: ["viral-infection"], context: adultContext });

    expect(rash.otcGroups.some((group) => group.title === "Clotrimazole")).toBe(false);
    expect(viral.prescriptionGroups.some((group) => ["Acyclovir", "Famciclovir", "Valacyclovir"].includes(group.title))).toBe(false);
    expect(rash.seekCare.length).toBeGreaterThan(0);
    expect(viral.seekCare.length).toBeGreaterThan(0);
  });

  it("offers simple OTC symptom relief for heartburn and mild joint pain", () => {
    const heartburn = recommendMedicines({ symptomIds: ["heartburn"], context: adultContext });
    const jointPain = recommendMedicines({ symptomIds: ["joint-pain"], context: adultContext });

    expect(heartburn.otcGroups.length).toBeGreaterThan(0);
    expect(heartburn.otcGroups.some((group) => ["Simethicone", "Dimethicone"].includes(group.title))).toBe(false);
    expect(jointPain.otcGroups[0]?.title).toBe("Paracetamol");
  });

  it("keeps prescription composition labels free of catalog company prefixes", () => {
    const result = recommendMedicines({ symptomIds: ["acidity"], context: adultContext });
    const titles = result.prescriptionGroups.map((group) => group.title);

    expect(titles.length).toBeGreaterThan(0);
    expect(titles.every((title) => !/\b(?:biotech|inc|ltd|llp|pvt|private|limited|lifecare|pharmaceuticals?)\b/i.test(title))).toBe(true);
    expect(titles.every((title) => !/^\d/.test(title))).toBe(true);
  });

  it("moves allergy matches into avoid", () => {
    const result = recommendMedicines({
      symptomIds: ["fever"],
      context: { ...adultContext, allergies: ["paracetamol"] }
    });
    expect(result.avoid.some((item) => item.medicine.composition?.toLowerCase().includes("paracetamol"))).toBe(true);
  });

  it("does not return unrelated OTC medicines for a symptom", () => {
    const result = recommendMedicines({ symptomIds: ["acidity"], context: adultContext });
    expect(result.otc.every((item) => item.medicine.symptomIds.includes("acidity"))).toBe(true);
  });

  it("does not alphabetically flood fever results", () => {
    const result = recommendMedicines({ symptomIds: ["fever"], context: adultContext });
    const firstPage = result.otcGroups[0]?.products ?? [];
    const firstLetters = new Set(firstPage.map((item) => item.medicine.name[0]?.toUpperCase()).filter(Boolean));

    expect(firstPage.length).toBeGreaterThan(3);
    expect(firstLetters.size).toBeGreaterThan(1);
    expect(firstPage.every((item) => item.medicine.composition?.toLowerCase().includes("paracetamol"))).toBe(true);
  });

  it("groups fever recommendations by composition with limited product examples", () => {
    const result = recommendMedicines({ symptomIds: ["fever"], context: adultContext });
    const firstGroup = result.otcGroups[0];

    expect(firstGroup?.title).toBe("Paracetamol");
    expect(firstGroup?.products.length).toBeLessThanOrEqual(4);
    expect(result.otc.length).toBeLessThanOrEqual(result.otcGroups.length * 4);
    expect(firstGroup?.products[0]?.medicine.name.toLowerCase()).toContain("crocin");
    expect(firstGroup?.products.every((item) => !/kid|junior|paediatric|pediatric|baby|infant/i.test(item.medicine.name))).toBe(true);
  });

  it("prioritizes oral rehydration salts for dehydration", () => {
    expect(searchSymptoms("ors")[0]?.id).toBe("dehydration");

    const result = recommendMedicines({ symptomIds: ["dehydration"], context: adultContext });

    expect(result.otcGroups[0]?.title).toBe("Oral Rehydration Salts");
    expect(result.otcGroups[0]?.products[0]?.medicine.id).toBe("oral-rehydration-salts");
    expect(result.seekCare.some((item) => item.title === "Signs of dehydration")).toBe(true);
  });

  it("blocks urgent symptoms instead of returning medicine lists", () => {
    const result = recommendMedicines({ symptomIds: ["chest-pain"], context: adultContext });

    expect(result.selfCareBlocked).toBe(true);
    expect(result.otcGroups).toHaveLength(0);
    expect(result.prescriptionGroups).toHaveLength(0);
    expect(result.seekCare.some((item) => item.severity === "high")).toBe(true);
  });

  it("requires adult eligibility confirmation", () => {
    const result = recommendMedicines({ symptomIds: ["fever"] });

    expect(result.selfCareBlocked).toBe(true);
    expect(result.seekCare[0]?.title).toBe("Adults only");
  });
});
