import { describe, expect, it } from "vitest";
import { recommendMedicines } from "@otcora/core";
import { toPublicRecommendationResponse } from "./public-medicine";

describe("public recommendation serialization", () => {
  it("keeps prescription composition context but removes prescription products", () => {
    const internal = recommendMedicines({
      symptomIds: ["chest-congestion"],
      context: { adultConfirmed: true }
    });
    const response = toPublicRecommendationResponse(internal);

    expect(response.prescription).toHaveLength(0);
    expect(response.prescriptionGroups.length).toBeGreaterThan(0);
    expect(response.prescriptionGroups.every((group) => group.products.length === 0)).toBe(true);
    expect(response.prescriptionGroups.every((group) => group.forms.length === 0 && group.strengths.length === 0)).toBe(true);
  });

  it("keeps OTC examples available without source metadata", () => {
    const internal = recommendMedicines({
      symptomIds: ["fever"],
      context: { adultConfirmed: true }
    });
    const response = toPublicRecommendationResponse(internal);

    expect(response.otc.length).toBeGreaterThan(0);
    expect(response.otc.every((item) => !("source" in item.medicine))).toBe(true);
  });

  it("redacts pharmacist-check products while preserving composition context", () => {
    const internal = recommendMedicines({
      symptomIds: ["fever", "cold", "blocked-nose"],
      context: { adultConfirmed: true }
    });
    const response = toPublicRecommendationResponse(internal);

    expect(response.pharmacistGroups.length).toBeGreaterThan(0);
    expect(response.pharmacistGroups.every((group) => group.products.length === 0)).toBe(true);
    expect(response.pharmacistGroups.every((group) => group.totalProducts === 0)).toBe(true);
    expect(response.treatmentPlans.some((plan) => plan.steps.some((step) => step.kind === "replacement-combination"))).toBe(true);
  });
});
