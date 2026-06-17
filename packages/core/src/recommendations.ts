import { medicines } from "./medicines";
import { getSymptomsByIds } from "./symptoms";
import type {
  Medicine,
  RecommendationItem,
  RecommendationRequest,
  RecommendationResponse,
  SeekCareItem
} from "./types";

const disclaimer =
  "Otcora provides educational medicine information for India and does not diagnose, prescribe, or replace a doctor or pharmacist.";

export function recommendMedicines(request: RecommendationRequest): RecommendationResponse {
  const symptomIds = new Set(request.symptomIds);
  const selectedSymptoms = getSymptomsByIds(request.symptomIds);
  const seekCare = buildSeekCare(selectedSymptoms.map((symptom) => symptom.id), request.context?.ageGroup);

  const ranked = medicines
    .map((medicine) => toRecommendationItem(medicine, symptomIds, request))
    .filter((item) => item.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore || a.medicine.name.localeCompare(b.medicine.name));

  const avoid = ranked.filter((item) => shouldAvoid(item, request));

  return {
    otc: ranked.filter((item) => item.medicine.prescriptionStatus === "otc" && !avoid.includes(item)).slice(0, 24),
    prescription: ranked.filter((item) => item.medicine.prescriptionStatus === "prescription" && !avoid.includes(item)).slice(0, 36),
    avoid: avoid.slice(0, 12),
    seekCare,
    disclaimer
  };
}

function toRecommendationItem(
  medicine: Medicine,
  symptomIds: Set<string>,
  request: RecommendationRequest
): RecommendationItem {
  const matchedSymptoms = medicine.symptomIds.filter((symptomId) => symptomIds.has(symptomId));
  const allergyHit = request.context?.allergies?.some((allergy) =>
    [medicine.name, medicine.genericName].filter(Boolean).join(" ").toLowerCase().includes(allergy.toLowerCase())
  );

  return {
    medicine,
    matchScore: matchedSymptoms.length > 0
      ? matchedSymptoms.length * 10 + (medicine.prescriptionStatus === "otc" ? 2 : 0)
      : 0,
    reasons: matchedSymptoms.map((symptomId) => `May help with ${symptomLabel(symptomId)} symptoms.`),
    cautions: [
      ...medicine.warnings,
      ...(medicine.prescriptionStatus === "prescription" ? ["Requires a valid prescription and doctor guidance."] : []),
      ...(medicine.prescriptionStatus === "unknown" ? ["Prescription status is not confirmed in the source data."] : []),
      ...(allergyHit ? ["Possible allergy match based on your context."] : [])
    ]
  };
}

function shouldAvoid(item: RecommendationItem, request: RecommendationRequest): boolean {
  if (item.matchScore <= 0) {
    return true;
  }
  if (!request.context) {
    return false;
  }
  const medicineText = [item.medicine.name, item.medicine.genericName, item.medicine.composition]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return Boolean(request.context.allergies?.some((allergy) => medicineText.includes(allergy.toLowerCase())));
}

function buildSeekCare(symptomIds: string[], ageGroup?: string): SeekCareItem[] {
  const items: SeekCareItem[] = [];
  if (symptomIds.includes("fever")) {
    items.push({
      title: "Persistent or very high fever",
      description: "Seek medical care for fever lasting more than 3 days, confusion, stiff neck, dehydration, or very high temperature.",
      severity: "high"
    });
  }
  if (symptomIds.includes("cough")) {
    items.push({
      title: "Breathing difficulty or chest pain",
      description: "A cough with breathlessness, chest pain, blood, or symptoms lasting more than 2 weeks needs medical review.",
      severity: "high"
    });
  }
  if (ageGroup === "child") {
    items.push({
      title: "Children need dose checks",
      description: "Confirm age and weight based dosing with a doctor or pharmacist before giving medicine to a child.",
      severity: "medium"
    });
  }
  return items;
}

function symptomLabel(symptomId: string): string {
  const labels: Record<string, string> = {
    cough: "cough",
    cold: "cold",
    fever: "fever",
    headache: "headache",
    acidity: "acidity",
    allergy: "allergy",
    diarrhea: "diarrhea",
    "body-pain": "body pain",
    "joint-pain": "joint pain",
    "back-pain": "back pain",
    "dry-cough": "dry cough",
    "chest-congestion": "chest congestion",
    "bacterial-infection": "bacterial infection",
    "high-blood-pressure": "high blood pressure",
    diabetes: "diabetes"
  };
  return labels[symptomId] ?? symptomId;
}
