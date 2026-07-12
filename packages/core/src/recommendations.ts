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
  "Otcora provides adult self-care education for India. Brand names are examples, not endorsements. Confirm suitability with a pharmacist and never start a prescription medicine from this information.";

const productsPerComposition = 4;
const otcGroupLimit = 6;
const prescriptionGroupLimit = 6;
const indexedProductsPerComposition = 8;

const commonBrandPriorities: Array<[string, number]> = [
  ["crocin advance 500", 120],
  ["crocin 650", 115],
  ["p 500 tablet", 110],
  ["paracip 500", 105],
  ["calpol 500", 100],
  ["ambrodil", 95],
  ["mucolite", 92],
  ["ambrolite", 90],
  ["ulgel", 95],
  ["rantac mps", 90],
  ["candid", 95],
  ["abzorb", 92],
  ["clocip", 90],
  ["canesten", 88],
  ["nuforce", 86],
  ["surfaz", 84],
  ["metagas", 88],
  ["duphalac", 95],
  ["livoluk", 90],
  ["evict", 86]
];

const prescriptionContextPatterns: Record<string, string[]> = {
  cough: ["acetylcysteine", "montelukast", "salbutamol", "levosalbutamol", "budesonide", "formoterol", "arformoterol", "ipratropium", "acebrophylline", "theophylline"],
  "chest-congestion": ["acetylcysteine", "bromhexine", "ambroxol"],
  acidity: ["pantoprazole", "omeprazole", "esomeprazole", "rabeprazole", "dexrabeprazole", "famotidine"],
  heartburn: ["pantoprazole", "omeprazole", "esomeprazole", "rabeprazole", "dexrabeprazole", "famotidine"],
  indigestion: ["pantoprazole", "omeprazole", "esomeprazole", "rabeprazole", "dexrabeprazole", "domperidone"],
  nausea: ["ondansetron", "domperidone", "metoclopramide"],
  vomiting: ["ondansetron", "domperidone", "metoclopramide"],
  "motion-sickness": ["meclizine", "doxylamine"],
  vertigo: ["meclizine"],
  "fungal-infection": ["fluconazole", "itraconazole", "terbinafine", "ketoconazole"],
  acne: ["adapalene", "tretinoin", "isotretinoin", "clindamycin"],
  "body-pain": ["aceclofenac", "diclofenac", "naproxen", "etoricoxib", "nimesulide"],
  "joint-pain": ["aceclofenac", "diclofenac", "naproxen", "etoricoxib"],
  "back-pain": ["aceclofenac", "diclofenac", "naproxen", "etoricoxib"],
  toothache: ["ibuprofen", "diclofenac", "naproxen"],
  "menstrual-cramps": ["ibuprofen", "naproxen", "drotaverine", "dicyclomine"],
  "eye-allergy": ["olopatadine"]
};

const careOnlySymptoms: Record<string, SeekCareItem> = {
  "chest-pain": {
    title: "Chest pain needs urgent assessment",
    description: "Do not use a medicine list to self-treat chest pain. Seek urgent medical care, especially with sweating, breathlessness, fainting, or pain spreading to the arm, back, neck, or jaw.",
    severity: "high"
  },
  breathlessness: {
    title: "Breathing difficulty can be urgent",
    description: "Seek urgent medical care for new or worsening breathlessness, blue lips, chest tightness, confusion, or difficulty speaking full sentences.",
    severity: "high"
  },
  wheezing: {
    title: "Wheezing needs clinical assessment",
    description: "New, severe, or worsening wheezing should be assessed by a clinician. Seek urgent care if breathing is difficult or lips appear blue.",
    severity: "high"
  },
  seizure: {
    title: "Seizures are not suitable for self-care",
    description: "A first seizure, a seizure lasting five minutes, repeated seizures, injury, pregnancy, or breathing difficulty needs emergency care.",
    severity: "high"
  },
  "high-blood-sugar": {
    title: "Very high blood sugar needs medical care",
    description: "Seek urgent care with vomiting, deep breathing, confusion, severe weakness, or dehydration. Diabetes medicines should not be selected from a symptom list.",
    severity: "high"
  },
  "bacterial-infection": {
    title: "Possible infection needs diagnosis",
    description: "Antibiotics are not self-care medicines. A clinician should confirm whether an infection is bacterial and select treatment if needed.",
    severity: "medium"
  },
  uti: {
    title: "Urinary infection symptoms need assessment",
    description: "Speak with a clinician, especially with fever, back pain, vomiting, pregnancy, blood in urine, or symptoms in a man.",
    severity: "medium"
  },
  "eye-infection": {
    title: "Eye infections need assessment",
    description: "Eye pain, vision change, light sensitivity, injury, contact-lens use, or discharge needs prompt professional care.",
    severity: "medium"
  },
  diabetes: {
    title: "Diabetes medicines require monitoring",
    description: "Do not start or change diabetes medicine from an information tool. Use a clinician-approved treatment plan.",
    severity: "medium"
  },
  "high-blood-pressure": {
    title: "Blood-pressure treatment needs measurements",
    description: "Do not start or change blood-pressure medicine from symptoms alone. Seek urgent care for a very high reading with chest pain, breathlessness, weakness, confusion, or severe headache.",
    severity: "medium"
  },
  depression: {
    title: "Mental-health symptoms deserve human support",
    description: "Talk with a qualified clinician. If there is immediate danger or thoughts of self-harm, contact emergency services or a trusted person now.",
    severity: "medium"
  },
  "mental-health": {
    title: "Mental-health medicines need clinical care",
    description: "These medicines require diagnosis and monitoring. If there is immediate danger or thoughts of self-harm, contact emergency services or a trusted person now.",
    severity: "medium"
  },
  asthma: {
    title: "Asthma symptoms need an action plan",
    description: "Do not choose or change inhalers from a symptom list. Use a clinician-approved asthma plan and seek urgent care for severe or worsening breathing difficulty.",
    severity: "medium"
  },
  anxiety: {
    title: "Anxiety medicines need clinical assessment",
    description: "A clinician can check for medical causes and discuss therapy or medicine safely. Seek urgent help if there is immediate danger or self-harm risk.",
    severity: "medium"
  },
  panic: {
    title: "New panic-like symptoms need assessment",
    description: "Chest pain, fainting, or breathing difficulty can have other causes. A clinician should assess new or severe episodes before medicine is considered.",
    severity: "medium"
  },
  insomnia: {
    title: "Sleep medicines are not self-care suggestions",
    description: "Persistent insomnia needs assessment of its cause. Do not start sedatives or prescription sleep medicines from an information list.",
    severity: "medium"
  },
  thyroid: {
    title: "Thyroid treatment requires blood tests",
    description: "Thyroid medicines require diagnosis, laboratory monitoring, and clinician-guided dose adjustment.",
    severity: "medium"
  }
};

const selfCareWarnings: Record<string, SeekCareItem> = {
  headache: {
    title: "Headache warning signs",
    description: "Seek urgent care for a sudden worst-ever headache, weakness, confusion, fainting, vision loss, stiff neck, head injury, or headache during pregnancy.",
    severity: "high"
  },
  allergy: {
    title: "Severe allergy warning",
    description: "Swelling of the lips or tongue, breathing difficulty, faintness, or a rapidly spreading reaction needs emergency care.",
    severity: "high"
  },
  vomiting: {
    title: "Vomiting warning signs",
    description: "Seek care for blood or green vomit, severe abdominal pain, confusion, very little urine, or inability to keep fluids down.",
    severity: "high"
  },
  diarrhea: {
    title: "Diarrhea warning signs",
    description: "Blood or black stool, high fever, severe pain, confusion, or signs of dehydration need medical care.",
    severity: "high"
  },
  "stomach-pain": {
    title: "Abdominal pain warning signs",
    description: "Severe, one-sided, worsening, or persistent pain, a rigid abdomen, fainting, blood, repeated vomiting, or pregnancy needs urgent assessment.",
    severity: "high"
  },
  "eye-redness": {
    title: "Eye warning signs",
    description: "Eye pain, vision change, light sensitivity, injury, chemical exposure, or redness with contact-lens use needs prompt eye care.",
    severity: "high"
  }
};

const medicinesBySymptom = buildSymptomIndex(medicines);

export function recommendMedicines(request: RecommendationRequest): RecommendationResponse {
  const symptomIds = new Set(request.symptomIds);
  const selectedSymptoms = getSymptomsByIds(request.symptomIds);
  const selectedSymptomIds = selectedSymptoms.map((symptom) => symptom.id);
  const seekCare = buildSeekCare(selectedSymptomIds);
  const adultNotConfirmed = request.context?.adultConfirmed !== true;
  const selfCareBlocked = adultNotConfirmed || selectedSymptomIds.some((symptomId) => symptomId in careOnlySymptoms);

  if (adultNotConfirmed) {
    seekCare.unshift({
      title: "Adults only",
      description: "Otcora currently supports adults aged 18 to 64 who are not pregnant or breastfeeding. Ask a doctor or pharmacist for everyone else.",
      severity: "medium"
    });
  }

  if (selfCareBlocked) {
    return {
      otc: [],
      prescription: [],
      avoid: [],
      otcGroups: [],
      prescriptionGroups: [],
      seekCare,
      selfCareBlocked: true,
      disclaimer
    };
  }

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
  const otcCompositionIds = new Set(otcGroups.map((group) => group.id));
  const prescriptionGroups = groupRecommendationItems(
    usable.filter((item) => item.medicine.prescriptionStatus === "prescription"
      && isAllowedPrescriptionContext(item.medicine, selectedSymptomIds)),
    "prescription",
    prescriptionGroupLimit + otcCompositionIds.size
  ).filter((group) => !otcCompositionIds.has(group.id)).slice(0, prescriptionGroupLimit);

  return {
    otc: otcGroups.flatMap((group) => group.products),
    prescription: prescriptionGroups.flatMap((group) => group.products),
    avoid: avoid.slice(0, 12),
    otcGroups,
    prescriptionGroups,
    seekCare,
    selfCareBlocked: false,
    disclaimer
  };
}

function isAllowedPrescriptionContext(medicine: Medicine, symptomIds: string[]): boolean {
  const composition = medicine.composition?.toLowerCase() ?? "";
  if (!composition || composition.includes("+")) return false;
  const ingredient = composition.replace(/\s*\([^)]*\)/g, "").trim();
  return symptomIds.some((symptomId) =>
    (prescriptionContextPatterns[symptomId] ?? []).includes(ingredient)
  );
}

function buildSymptomIndex(catalog: Medicine[]): Map<string, Medicine[]> {
  const grouped = new Map<string, Map<string, Medicine[]>>();
  for (const medicine of catalog) {
    for (const symptomId of medicine.symptomIds) {
      const symptomGroups = grouped.get(symptomId) ?? new Map<string, Medicine[]>();
      const groupKey = medicine.prescriptionStatus + ":" + compositionGroupKey(medicine);
      const products = symptomGroups.get(groupKey) ?? [];
      retainBestCatalogExample(products, medicine);
      symptomGroups.set(groupKey, products);
      grouped.set(symptomId, symptomGroups);
    }
  }

  const index = new Map<string, Medicine[]>();
  for (const [symptomId, symptomGroups] of grouped) {
    index.set(symptomId, [...symptomGroups.values()].flatMap((products) =>
      products.sort(compareCatalogExamples)
    ));
  }
  return index;
}

function retainBestCatalogExample(products: Medicine[], candidate: Medicine): void {
  if (products.length < indexedProductsPerComposition) {
    products.push(candidate);
    return;
  }

  let worstIndex = 0;
  for (let index = 1; index < products.length; index += 1) {
    if (compareCatalogExamples(products[index]!, products[worstIndex]!) > 0) worstIndex = index;
  }

  if (compareCatalogExamples(candidate, products[worstIndex]!) < 0) products[worstIndex] = candidate;
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
    .filter(isDisplayableCompositionGroup)
    .sort(compareCompositionGroups)
    .slice(0, limit);
}

function isDisplayableCompositionGroup(group: CompositionRecommendationGroup): boolean {
  return group.title.length > 1
    && group.title.length <= 100
    && !/\b(?:pvt|ltd|llp|private|limited)\b/i.test(group.title)
    && !/[{}<>]/.test(group.title);
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
    || a.title.localeCompare(b.title);
}

function compareRecommendationItems(a: RecommendationItem, b: RecommendationItem): number {
  return b.matchScore - a.matchScore
    || brandExampleScore(b.medicine) - brandExampleScore(a.medicine)
    || spreadScore(b.medicine) - spreadScore(a.medicine)
    || a.medicine.name.localeCompare(b.medicine.name);
}

function compareCatalogExamples(a: Medicine, b: Medicine): number {
  return brandExampleScore(b) - brandExampleScore(a)
    || spreadScore(b) - spreadScore(a)
    || a.name.localeCompare(b.name);
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
      ? matchedSymptoms.length * 100 + medicineQualityScore(medicine, matchedSymptoms)
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

function medicineQualityScore(medicine: Medicine, matchedSymptoms: string[]): number {
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

  if (form === "tablet") {
    score += 3;
  }

  if (looksMalformed(medicine)) {
    score -= 30;
  }

  return score;
}

function compositionGroupKey(medicine: Medicine): string {
  const ingredients = ingredientNames(medicine.composition ?? medicine.genericName ?? medicine.name);
  const meaningful = ingredients.length > 0 ? ingredients : [medicine.genericName ?? medicine.name];
  return meaningful.map(normalizeIngredientName).filter(Boolean).join("+").toLowerCase();
}

function compositionGroupTitle(medicine: Medicine | undefined, key: string): string {
  if (!medicine) {
    return titleCase(key.replace(/\+/g, " + "));
  }
  const ingredients = ingredientNames(medicine.composition ?? medicine.genericName ?? medicine.name)
    .map(normalizeIngredientName)
    .filter(Boolean);
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

function brandExampleScore(medicine: Medicine): number {
  const name = medicine.name.toLowerCase();
  const composition = medicine.composition?.toLowerCase() ?? "";
  let score = 0;

  for (const [brand, priority] of commonBrandPriorities) {
    if (name.includes(brand)) {
      score = Math.max(score, priority);
    }
  }

  if (medicine.manufacturer) score += 4;
  if (medicine.form === "Tablet" || medicine.form === "Capsule") score += 3;
  if (/paracetamol \((500|650)mg\)/i.test(composition) && !composition.includes("+")) score += 12;
  if (/kid|junior|paediatric|pediatric|baby|infant|oral drops?|suspension/i.test(name)) score -= 100;
  if (looksMalformed(medicine)) score -= 50;

  return score;
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

function buildSeekCare(symptomIds: string[]): SeekCareItem[] {
  const items: SeekCareItem[] = [];
  for (const symptomId of symptomIds) {
    const careItem = careOnlySymptoms[symptomId];
    if (careItem) items.push(careItem);
    const warning = selfCareWarnings[symptomId];
    if (warning) items.push(warning);
  }
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

  return uniqueByTitle(items);
}

function uniqueByTitle(items: SeekCareItem[]): SeekCareItem[] {
  return [...new Map(items.map((item) => [item.title, item])).values()];
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
