import type { Medicine, RecommendationItem, RecommendationResponse } from "@otcora/core";

export type PublicMedicine = Omit<Medicine, "source" | "price" | "mrp">;
export type PublicRecommendationItem = Omit<RecommendationItem, "medicine"> & { medicine: PublicMedicine };

export function isPublicOtcMedicine(medicine: Medicine): boolean {
  return medicine.prescriptionStatus === "otc";
}

export function toPublicMedicine(medicine: Medicine): PublicMedicine {
  const { source: _source, price: _price, mrp: _mrp, ...publicMedicine } = medicine;
  return publicMedicine;
}

function toPublicRecommendationItem(item: RecommendationItem): PublicRecommendationItem {
  return {
    ...item,
    medicine: toPublicMedicine(item.medicine)
  };
}

function toPublicContextGroup(
  group: RecommendationResponse["prescriptionGroups"][number],
  caution: string
) {
  return {
    ...group,
    subtitle: undefined,
    forms: [],
    strengths: [],
    totalProducts: 0,
    shownProducts: 0,
    reasons: [],
    cautions: [caution],
    products: []
  };
}

export function toPublicRecommendationResponse(response: RecommendationResponse) {
  return {
    ...response,
    otc: response.otc.map(toPublicRecommendationItem),
    prescription: [],
    avoid: response.avoid.filter((item) => isPublicOtcMedicine(item.medicine)).map(toPublicRecommendationItem),
    otcGroups: response.otcGroups.map((group) => ({
      ...group,
      products: group.products.map(toPublicRecommendationItem)
    })),
    pharmacistGroups: response.pharmacistGroups.map((group) => toPublicContextGroup(
      group,
      "Prescription status or individual suitability is not confirmed. Ask a pharmacist before purchase or use."
    )),
    prescriptionGroups: response.prescriptionGroups.map((group) => toPublicContextGroup(
      group,
      "Requires clinical assessment and a valid prescription. Do not self-start this composition."
    ))
  };
}
