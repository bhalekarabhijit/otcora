import type { Medicine, RecommendationItem, RecommendationResponse } from "@otcora/core";

export type PublicMedicine = Omit<Medicine, "source">;
export type PublicRecommendationItem = Omit<RecommendationItem, "medicine"> & { medicine: PublicMedicine };

export function toPublicMedicine(medicine: Medicine): PublicMedicine {
  const { source: _source, ...publicMedicine } = medicine;
  return publicMedicine;
}

function toPublicRecommendationItem(item: RecommendationItem): PublicRecommendationItem {
  return {
    ...item,
    medicine: toPublicMedicine(item.medicine)
  };
}

export function toPublicRecommendationResponse(response: RecommendationResponse) {
  return {
    ...response,
    otc: response.otc.map(toPublicRecommendationItem),
    prescription: response.prescription.map(toPublicRecommendationItem),
    avoid: response.avoid.map(toPublicRecommendationItem),
    otcGroups: response.otcGroups.map((group) => ({
      ...group,
      products: group.products.map(toPublicRecommendationItem)
    })),
    prescriptionGroups: response.prescriptionGroups.map((group) => ({
      ...group,
      products: group.products.map(toPublicRecommendationItem)
    }))
  };
}
