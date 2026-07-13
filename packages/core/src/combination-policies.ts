import type { RecommendationLane } from "./types";

export interface CombinationPolicy {
  id: string;
  ingredients: string[];
  lane: RecommendationLane;
  requiredSymptomClusters: string[][];
  purpose: string;
  replacesOverlappingSingles: boolean;
}

const feverOrPain = ["fever", "headache", "migraine", "body-pain", "joint-pain", "back-pain", "toothache", "menstrual-cramps", "arthritis-pain", "sore-throat", "flu"];
const nasalCongestion = ["blocked-nose", "sinus-congestion", "cold", "flu"];
const allergyOrRunnyNose = ["allergy", "sneezing", "cold"];

const exactPolicies: CombinationPolicy[] = [
  {
    id: "paracetamol-caffeine-headache",
    ingredients: ["caffeine", "paracetamol"],
    lane: "otc",
    requiredSymptomClusters: [["headache", "migraine"]],
    purpose: "Headache or migraine discomfort",
    replacesOverlappingSingles: true
  },
  {
    id: "paracetamol-phenylephrine-pharmacist",
    ingredients: ["paracetamol", "phenylephrine"],
    lane: "pharmacist",
    requiredSymptomClusters: [feverOrPain, nasalCongestion],
    purpose: "Fever or pain with nasal congestion",
    replacesOverlappingSingles: true
  },
  {
    id: "paracetamol-caffeine-phenylephrine-pharmacist",
    ingredients: ["caffeine", "paracetamol", "phenylephrine"],
    lane: "pharmacist",
    requiredSymptomClusters: [feverOrPain, nasalCongestion],
    purpose: "Fever or pain with nasal congestion",
    replacesOverlappingSingles: true
  },
  {
    id: "cold-fdc-prescription",
    ingredients: ["chlorpheniramine", "paracetamol", "phenylephrine"],
    lane: "prescription",
    requiredSymptomClusters: [feverOrPain, nasalCongestion, allergyOrRunnyNose],
    purpose: "Cold symptoms with fever or pain, congestion, and runny nose",
    replacesOverlappingSingles: true
  },
  {
    id: "cold-fdc-caffeine-prescription",
    ingredients: ["caffeine", "chlorpheniramine", "paracetamol", "phenylephrine"],
    lane: "prescription",
    requiredSymptomClusters: [feverOrPain, nasalCongestion, allergyOrRunnyNose],
    purpose: "Cold symptoms with fever or pain, congestion, and runny nose",
    replacesOverlappingSingles: true
  }
];

const antacidIngredients = new Set([
  "alginic acid",
  "aluminium hydroxide",
  "dimethicone",
  "magaldrate",
  "magnesium hydroxide",
  "simethicone",
  "sodium bicarbonate"
]);

export function matchCombinationPolicy(
  composition: string,
  symptomIds: Iterable<string>,
  lane: RecommendationLane
): CombinationPolicy | undefined {
  const ingredients = normalizedIngredients(composition);
  if (ingredients.length < 2) return undefined;
  const selected = new Set(symptomIds);

  if (lane === "otc"
    && ingredients.every((ingredient) => antacidIngredients.has(ingredient))
    && [...selected].some((symptomId) => ["acidity", "heartburn", "gas", "indigestion"].includes(symptomId))) {
    return {
      id: "antacid-combination",
      ingredients,
      lane,
      requiredSymptomClusters: [["acidity", "heartburn", "gas", "indigestion"]],
      purpose: "Acidity, heartburn, gas, or indigestion",
      replacesOverlappingSingles: true
    };
  }

  return exactPolicies.find((policy) => policy.lane === lane
    && sameIngredients(ingredients, policy.ingredients)
    && policy.requiredSymptomClusters.every((cluster) => cluster.some((symptomId) => selected.has(symptomId))));
}

export function normalizedIngredients(composition: string): string[] {
  return composition
    .split("+")
    .map((part) => part.replace(/\s*\([^)]*\)/g, "").trim().toLowerCase())
    .map(normalizeIngredient)
    .filter(Boolean)
    .sort();
}

function normalizeIngredient(value: string): string {
  return value
    .replace(/\b(?:hydrochloride|hcl|hydrobromide|maleate|anhydrous)\b/g, "")
    .replace(/\bacetaminophen\b/g, "paracetamol")
    .replace(/\s+/g, " ")
    .trim();
}

function sameIngredients(actual: string[], expected: string[]): boolean {
  const normalizedExpected = expected.map(normalizeIngredient).sort();
  return actual.length === normalizedExpected.length
    && actual.every((ingredient, index) => ingredient === normalizedExpected[index]);
}
