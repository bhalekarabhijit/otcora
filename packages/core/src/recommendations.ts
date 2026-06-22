import { ingredientRules } from "./ingredient-rules";
import { medicines } from "./medicines";
import { getSymptomsByIds } from "./symptoms";
import type {
  CompositionRecommendationGroup,
  Medicine,
  PrescriptionStatus,
  RecommendationItem,
  RecommendationRequest,
  RecommendationResponse,
  SeekCareItem
} from "./types";

const disclaimer =
  "Otcora provides educational medicine information for India and does not diagnose, prescribe, or replace a doctor or pharmacist.";

const medicinesBySymptom = buildSymptomIndex(medicines);
const productsPerComposition = 4;
const otcGroupLimit = 6;
const prescriptionGroupLimit = 6;

export function recommendMedicines(request: RecommendationRequest): RecommendationResponse {
  const symptomIds = new Set(request.symptomIds);
  const selectedSymptoms = getSymptomsByIds(request.symptomIds);
  const seekCare = buildSeekCare(selectedSymptoms.map((symptom) => symptom.id), request.context?.ageGroup);

  const ranked = candidateMedicinesForSymptoms(symptomIds)
    .map((medicine) => toRecommendationItem(medicine, symptomIds, request))
    .filter((item) => item.matchScore > 0)
    .sort(compareRecommendationItems);

  const avoid = ranked.filter((item) => shouldAvoid(item, request));
  const avoidMedicineIds = new Set(avoid.map((item) => item.medicine.id));
  const usable = ranked.filter((item) => !avoidMedicineIds.has(item.medicine.id));
  const otcGroups = groupRecommendationItems(
    usable.filter((item) => item.medicine.prescriptionStatus === "otc"),
    "otc",
    otcGroupLimit
  );
  const prescriptionGroups = groupRecommendationItems(
    usable.filter((item) => item.medicine.prescriptionStatus === "prescription"),
    "prescription",
    prescriptionGroupLimit
  );

  return {
    otc: otcGroups.flatMap((group) => group.products),
    prescription: prescriptionGroups.flatMap((group) => group.products),
    avoid: avoid.slice(0, 12),
    otcGroups,
    prescriptionGroups,
    seekCare,
    disclaimer
  };
}

function buildSymptomIndex(catalog: Medicine[]): Map<string, Medicine[]> {
  const index = new Map<string, Medicine[]>();
  for (const medicine of catalog) {
    for (const symptomId of medicine.symptomIds) {
      const existing = index.get(symptomId);
      if (existing) {
        existing.push(medicine);
      } else {
        index.set(symptomId, [medicine]);
      }
    }
  }
  return index;
}

function candidateMedicinesForSymptoms(symptomIds: Set<string>): Medicine[] {
  const seen = new Set<string>();
  const candidates: Medicine[] = [];
  for (const symptomId of symptomIds) {
    const matches = medicinesBySymptom.get(symptomId) ?? [];
    for (const medicine of matches) {
      if (seen.has(medicine.id)) {
        continue;
      }
      seen.add(medicine.id);
      candidates.push(medicine);
    }
  }
  return candidates;
}

function groupRecommendationItems(
  items: RecommendationItem[],
  prescriptionStatus: PrescriptionStatus,
  limit: number
): CompositionRecommendationGroup[] {
  const grouped = new Map<string, RecommendationItem[]>();
  for (const item of items) {
    const key = compositionGroupKey(item.medicine);
    const existing = grouped.get(key);
    if (existing) {
      existing.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return [...grouped.entries()]
    .map(([key, groupItems]) => toCompositionGroup(key, groupItems, prescriptionStatus))
    .sort(compareCompositionGroups)
    .slice(0, limit);
}

function toCompositionGroup(
  key: string,
  items: RecommendationItem[],
  prescriptionStatus: PrescriptionStatus
): CompositionRecommendationGroup {
  const rankedProducts = [...items].sort(compareRecommendationItems);
  const representative = rankedProducts[0];
  const products = rankedProducts.slice(0, productsPerComposition);
  const forms = unique(rankedProducts.map((item) => item.medicine.form).filter((form): form is string => Boolean(form))).slice(0, 5);
  const strengths = unique(rankedProducts.map((item) => strengthLabel(item.medicine)).filter((strength): strength is string => Boolean(strength))).slice(0, 5);
  const title = compositionGroupTitle(representative?.medicine, key);
  const subtitle = groupSubtitle(representative?.medicine, title);

  return {
    id: key,
    title,
    ...(subtitle ? { subtitle } : {}),
    prescriptionStatus,
    matchScore: Math.max(...rankedProducts.map((item) => item.matchScore)) + Math.min(rankedProducts.length, 20) / 10,
    totalProducts: rankedProducts.length,
    shownProducts: products.length,
    forms,
    strengths,
    reasons: unique(rankedProducts.flatMap((item) => item.reasons)).slice(0, 3),
    cautions: unique(rankedProducts.flatMap((item) => item.cautions)).slice(0, 4),
    products
  };
}

function compareCompositionGroups(a: CompositionRecommendationGroup, b: CompositionRecommendationGroup): number {
  return b.matchScore - a.matchScore
    || b.totalProducts - a.totalProducts
    || a.title.localeCompare(b.title);
}

function compareRecommendationItems(a: RecommendationItem, b: RecommendationItem): number {
  return b.matchScore - a.matchScore
    || spreadScore(b.medicine) - spreadScore(a.medicine)
    || a.medicine.name.localeCompare(b.medicine.name);
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
      ? matchedSymptoms.length * 100 + medicineQualityScore(medicine, matchedSymptoms, request)
      : 0,
    reasons: matchedSymptoms.map((symptomId) => "May help with " + symptomLabel(symptomId) + " symptoms."),
    cautions: [
      ...medicine.warnings,
      ...(medicine.prescriptionStatus === "prescription" ? ["Requires a valid prescription and doctor guidance."] : []),
      ...(medicine.prescriptionStatus === "unknown" ? ["Prescription status is not confirmed in the catalog."] : []),
      ...(allergyHit ? ["Possible allergy match based on your context."] : [])
    ]
  };
}

function medicineQualityScore(medicine: Medicine, matchedSymptoms: string[], request: RecommendationRequest): number {
  const composition = medicine.composition?.toLowerCase() ?? "";
  const form = medicine.form?.toLowerCase() ?? "";
  const singleIngredient = composition.length > 0 && !composition.includes("+");
  let score = medicine.prescriptionStatus === "otc" ? 20 : 0;

  if (singleIngredient) {
    score += 8;
  }

  if (matchedSymptoms.includes("fever")) {
    if (composition.includes("paracetamol") || composition.includes("acetaminophen")) {
      score += 24;
    }
    if (/paracetamol \((500|650)mg\)/i.test(medicine.composition ?? "")) {
      score += 10;
    }
    if (singleIngredient && /tablet|suspension|syrup|drop/.test(form)) {
      score += 6;
    }
    if (!singleIngredient && medicine.prescriptionStatus === "otc") {
      score -= 8;
    }
  }

  if (matchedSymptoms.includes("dehydration") && (composition.includes("oral rehydration salts") || composition.includes("rehydration salts"))) {
    score += 80;
  }

  if (request.context?.ageGroup === "child" && /syrup|suspension|drop/.test(form)) {
    score += 6;
  }

  if (request.context?.ageGroup !== "child" && form === "tablet") {
    score += 3;
  }

  if (looksMalformed(medicine)) {
    score -= 30;
  }

  return score;
}

function compositionGroupKey(medicine: Medicine): string {
  const knownIngredients = knownIngredientNames(medicine);
  const ingredients = knownIngredients.length > 0
    ? knownIngredients
    : ingredientNames(medicine.composition ?? medicine.genericName ?? medicine.name);
  const meaningful = ingredients.length > 0 ? ingredients : [medicine.genericName ?? medicine.name];
  return meaningful.map(normalizeIngredientName).filter(Boolean).join("+").toLowerCase();
}

function compositionGroupTitle(medicine: Medicine | undefined, key: string): string {
  if (!medicine) {
    return titleCase(key.replace(/\+/g, " + "));
  }
  const knownIngredients = knownIngredientNames(medicine);
  const ingredients = knownIngredients.length > 0
    ? knownIngredients
    : ingredientNames(medicine.composition ?? medicine.genericName ?? medicine.name).map(normalizeIngredientName).filter(Boolean);
  if (ingredients.length > 0) {
    return ingredients.map(titleCase).join(" + ");
  }
  return titleCase(medicine.genericName ?? medicine.name);
}

function groupSubtitle(medicine: Medicine | undefined, title: string): string | undefined {
  const composition = medicine?.composition;
  if (!composition || normalizeIngredientName(composition) === normalizeIngredientName(title)) {
    return undefined;
  }
  return composition;
}

function knownIngredientNames(medicine: Medicine): string[] {
  const composition = (medicine.composition ?? medicine.genericName ?? "").toLowerCase();
  const matches: { name: string; index: number }[] = [];
  for (const rule of ingredientRules) {
    for (const pattern of rule.patterns) {
      const index = composition.indexOf(pattern.toLowerCase());
      if (index >= 0) {
        matches.push({ name: normalizeIngredientName(pattern), index });
        break;
      }
    }
  }

  return unique(matches
    .sort((a, b) => a.index - b.index)
    .map((match) => match.name));
}

function ingredientNames(composition: string): string[] {
  return composition
    .split("+")
    .map((part) => part.replace(/\s*\([^)]*\)/g, "").trim())
    .filter(Boolean);
}

function normalizeIngredientName(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\bAcetaminophen\b/gi, "Paracetamol")
    .trim();
}

function strengthLabel(medicine: Medicine): string | undefined {
  const matches = medicine.composition?.match(/\(([^)]+)\)/g);
  if (!matches || matches.length === 0) {
    return undefined;
  }
  const strengths = matches
    .map((match) => match.replace(/[()]/g, ""))
    .filter((value) => /\d/.test(value) && /(mg|mcg|g|ml|iu|%|na)/i.test(value));
  return strengths.length > 0 ? strengths.join(" + ") : undefined;
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.length <= 3 && word === word.toUpperCase()
      ? word
      : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function looksMalformed(medicine: Medicine): boolean {
  const composition = medicine.composition ?? "";
  const manufacturer = medicine.manufacturer ?? "";
  return /[a-z][A-Z]/.test(composition) || /^(tablet|capsule|syrup|cream|injection)$/i.test(manufacturer);
}

function spreadScore(medicine: Medicine): number {
  const key = [medicine.genericName, medicine.composition, medicine.manufacturer, medicine.name].filter(Boolean).join("|");
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
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
  if (symptomIds.includes("dehydration")) {
    items.push({
      title: "Signs of dehydration",
      description: "Seek care urgently for confusion, sunken eyes, severe weakness, blood in stool, or very little urine.",
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

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
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
    diabetes: "diabetes",
    dehydration: "dehydration"
  };
  return labels[symptomId] ?? symptomId;
}
