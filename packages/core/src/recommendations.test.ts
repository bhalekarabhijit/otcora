import { describe, expect, it } from "vitest";
import { recommendMedicines } from "./recommendations";
import { searchSymptoms, symptoms } from "./symptoms";

describe("symptom search", () => {
  it("returns prefix matches as a user types", () => {
    expect(searchSymptoms("c").map((symptom) => symptom.id)).toContain("cough");
    expect(searchSymptoms("cou")[0]?.id).toBe("cough");
    expect(searchSymptoms("bp").map((symptom) => symptom.id)).toContain("high-blood-pressure");
  });

  it("prefers a specific cough subtype when the user names it", () => {
    expect(searchSymptoms("dry cough")[0]?.id).toBe("dry-cough");
    expect(searchSymptoms("wet cough")[0]?.id).toBe("chest-congestion");
    expect(searchSymptoms("productive cough")[0]?.id).toBe("chest-congestion");
  });
});

describe("recommendMedicines", () => {
  const adultContext = { adultConfirmed: true as const };

  it("uses the imported catalog and separates prescription context", () => {
    const result = recommendMedicines({ symptomIds: ["chest-congestion"], context: adultContext });
    expect(result.otcGroups.length).toBeGreaterThan(0);
    expect(result.prescriptionGroups.length).toBeGreaterThan(0);
    expect(result.otc.every((item) => item.medicine.prescriptionStatus === "otc")).toBe(true);
    expect(result.prescription.every((item) => item.medicine.prescriptionStatus === "prescription")).toBe(true);
  });

  it("asks for cough type before showing cough medicines", () => {
    const result = recommendMedicines({ symptomIds: ["cough"], context: adultContext });

    expect(result.otcGroups).toHaveLength(0);
    expect(result.prescriptionGroups).toHaveLength(0);
    expect(result.clarification).toMatchObject({
      id: "cough-type",
      question: "Is the cough dry, or are you bringing up phlegm?"
    });
    expect(result.clarification?.options.map((option) => option.symptom.id)).toEqual([
      "dry-cough",
      "chest-congestion"
    ]);
    expect(result.clarification?.selfCare.length).toBeGreaterThan(0);
    expect(result.followUpSymptoms).toHaveLength(0);
    expect(result.seekCare.some((item) => item.title === "Breathing difficulty or chest pain")).toBe(true);
  });

  it("does not ask for cough type after a subtype is selected", () => {
    const dry = recommendMedicines({ symptomIds: ["dry-cough"], context: adultContext });
    const wet = recommendMedicines({ symptomIds: ["chest-congestion"], context: adultContext });

    expect(dry.clarification).toBeUndefined();
    expect(wet.clarification).toBeUndefined();
  });

  it("limits adult dry-cough OTC results to dextromethorphan lozenges and excludes pholcodine", () => {
    const result = recommendMedicines({ symptomIds: ["dry-cough"], context: adultContext });
    const dextromethorphan = result.otcGroups.find((group) => group.title === "Dextromethorphan");
    const allTitles = [
      ...result.otcGroups,
      ...result.pharmacistGroups,
      ...result.prescriptionGroups
    ].map((group) => group.title);

    expect(dextromethorphan?.products.length).toBeGreaterThan(0);
    expect(dextromethorphan?.products.every((item) =>
      item.medicine.form === "Lozenge"
      && /dextromethorphan hydrobromide \(10mg\)/i.test(item.medicine.composition ?? "")
    )).toBe(true);
    expect(allTitles).not.toContain("Pholcodine");
  });

  it("limits general fever prescription context to ibuprofen", () => {
    const result = recommendMedicines({ symptomIds: ["fever"], context: adultContext });
    expect(result.prescriptionGroups.map((group) => group.title)).toEqual(["Ibuprofen"]);
  });

  it("keeps cold combinations out of a fever-only result", () => {
    const result = recommendMedicines({ symptomIds: ["fever"], context: adultContext });

    expect(result.otcGroups.map((group) => group.title)).toEqual(["Paracetamol"]);
  });

  it("keeps an oral NSAID in prescription context with dengue-risk guidance", () => {
    const result = recommendMedicines({ symptomIds: ["fever"], context: adultContext });

    expect(result.prescriptionGroups.some((group) => group.title === "Ibuprofen")).toBe(true);
    const ibuprofen = result.prescriptionGroups.find((group) => group.title === "Ibuprofen");
    expect(ibuprofen?.cautions.join(" ").toLowerCase()).toContain("dengue");
  });

  it("asks about associated symptoms when fever is selected alone", () => {
    const result = recommendMedicines({ symptomIds: ["fever"], context: adultContext });

    expect(result.treatmentPlans[0]?.steps.some((step) => step.purpose === "Fever discomfort")).toBe(true);
    expect(result.followUpSymptoms.map((symptom) => symptom.id)).toEqual(expect.arrayContaining([
      "body-pain",
      "blocked-nose",
      "dry-cough",
      "chest-congestion",
      "sore-throat",
      "dehydration"
    ]));
  });

  it("shows lubricant eye drops and separates prescription allergy drops", () => {
    const result = recommendMedicines({ symptomIds: ["eye-allergy"], context: adultContext });

    expect(result.otcGroups.some((group) => group.title === "Carboxymethylcellulose")).toBe(true);
    expect(result.prescriptionGroups.some((group) => group.title === "Olopatadine")).toBe(true);
    expect(result.seekCare.some((item) => item.title === "Eye warning signs")).toBe(true);
    expect(result.treatmentPlans.flatMap((plan) => plan.steps)
      .some((step) => step.alternatives.some((item) => item.title === "Carboxymethylcellulose"))).toBe(true);
  });

  it("gives every searchable symptom a meaningful outcome", () => {
    for (const symptom of symptoms) {
      const result = recommendMedicines({ symptomIds: [symptom.id], context: adultContext });
      const hasOutcome = result.selfCareBlocked
        || Boolean(result.clarification)
        || result.otcGroups.length > 0
        || result.prescriptionGroups.length > 0
        || result.seekCare.length > 0;

      expect(hasOutcome, `${symptom.id} silently returned no outcome`).toBe(true);
    }
  });

  it("builds a plan whenever a non-blocked result contains medicine context", () => {
    for (const symptom of symptoms) {
      const result = recommendMedicines({ symptomIds: [symptom.id], context: adultContext });
      const hasMedicineContext = result.otcGroups.length > 0
        || result.pharmacistGroups.length > 0
        || result.prescriptionGroups.length > 0;

      if (!result.selfCareBlocked && hasMedicineContext) {
        expect(result.treatmentPlans.length, `${symptom.id} has groups but no treatment plan`).toBeGreaterThan(0);
        expect(result.treatmentPlans.flatMap((plan) => plan.steps).length).toBeGreaterThan(0);
      }
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
    expect(combined.otcGroups.some((group) => group.title.includes("Phenylephrine"))).toBe(false);
    expect(combined.pharmacistGroups.some((group) => group.title === "Paracetamol + Caffeine + Phenylephrine")).toBe(true);
    expect(combined.otcGroups.some((group) => group.title.includes("Oxymetazoline"))).toBe(true);
  });

  it("builds separate purpose steps for fever with nasal congestion", () => {
    const result = recommendMedicines({
      symptomIds: ["fever", "cold", "blocked-nose"],
      context: adultContext
    });
    const steps = result.treatmentPlans.flatMap((plan) => plan.steps);
    const feverStep = steps.find((step) => step.purpose === "Fever discomfort");
    const noseStep = steps.find((step) => step.purpose === "Blocked nose");
    const combinationStep = steps.find((step) => step.kind === "replacement-combination");

    expect(feverStep?.alternatives.map((item) => item.title)).toContain("Paracetamol");
    expect(noseStep?.alternatives.map((item) => item.title)).toEqual(expect.arrayContaining(["Xylometazoline", "Oxymetazoline"]));
    expect(combinationStep?.alternatives.map((item) => item.title)).toContain("Paracetamol + Caffeine + Phenylephrine");
    expect(combinationStep?.instruction.toLowerCase()).toContain("replaces");
  });

  it("adds ORS as a separate plan step for fever with dehydration", () => {
    const result = recommendMedicines({
      symptomIds: ["fever", "dehydration"],
      context: adultContext
    });
    const steps = result.treatmentPlans.flatMap((plan) => plan.steps);

    expect(steps.some((step) => step.purpose === "Fever discomfort"
      && step.alternatives.some((item) => item.title === "Paracetamol"))).toBe(true);
    expect(steps.some((step) => step.purpose === "Fluid replacement"
      && step.alternatives.some((item) => item.title === "Oral Rehydration Salts"))).toBe(true);
    expect(result.prescriptionGroups.some((group) => group.title === "Ibuprofen")).toBe(false);
  });

  it("separates fever relief from wet-cough treatment", () => {
    const result = recommendMedicines({
      symptomIds: ["fever", "chest-congestion"],
      context: adultContext
    });
    const steps = result.treatmentPlans.flatMap((plan) => plan.steps);

    expect(steps.some((step) => step.purpose === "Fever discomfort")).toBe(true);
    expect(steps.some((step) => step.purpose === "Wet cough or chest congestion"
      && step.alternatives.some((item) => ["Ambroxol", "Guaifenesin"].includes(item.title)))).toBe(true);
  });

  it("keeps dry-cough choices in one step and the ibuprofen alternative doctor-only", () => {
    const result = recommendMedicines({
      symptomIds: ["fever", "dry-cough"],
      context: adultContext
    });
    const steps = result.treatmentPlans.flatMap((plan) => plan.steps);
    const dryCough = steps.find((step) => step.purpose === "Dry cough relief");
    const feverAlternative = steps.find((step) => step.purpose === "Alternative fever relief");

    expect(dryCough?.alternatives).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: "Dextromethorphan", lane: "otc" }),
      expect.objectContaining({ title: "Noscapine", lane: "prescription" })
    ]));
    expect(dryCough?.alternatives.some((item) => item.title === "Pholcodine")).toBe(false);
    expect(feverAlternative?.alternatives.map((item) => item.title)).toEqual(["Ibuprofen"]);
  });

  it("does not leak infection medicines into an undifferentiated fever plan", () => {
    const result = recommendMedicines({ symptomIds: ["fever"], context: adultContext });
    const titles = [
      ...result.otcGroups,
      ...result.pharmacistGroups,
      ...result.prescriptionGroups
    ].map((group) => group.title.toLowerCase());

    expect(titles.some((title) => /azithromycin|amoxicillin|acyclovir|oseltamivir/.test(title))).toBe(false);
  });

  it("never repeats a composition across plan alternatives", () => {
    const result = recommendMedicines({
      symptomIds: ["fever", "cold", "blocked-nose"],
      context: adultContext
    });
    const ids = result.treatmentPlans.flatMap((plan) => plan.steps)
      .flatMap((step) => step.alternatives.map((item) => `${step.kind}:${item.compositionId}`));

    expect(new Set(ids).size).toBe(ids.length);
  });

  it("deduplicates combinations whose source ingredient order differs", () => {
    const result = recommendMedicines({
      symptomIds: ["fever", "cold", "blocked-nose"],
      context: adultContext
    });
    const normalized = result.prescriptionGroups.map((group) => group.title
      .split("+")
      .map((ingredient) => ingredient.trim().toLowerCase())
      .sort()
      .join("+"));

    expect(new Set(normalized).size).toBe(normalized.length);
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
