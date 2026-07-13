import { getSymptomsByIds } from "./symptoms";
import type {
  CompositionRecommendationGroup,
  RecommendationLane,
  Symptom,
  TreatmentPlan,
  TreatmentPlanStep
} from "./types";

interface TreatmentPlanLanes {
  otc: CompositionRecommendationGroup[];
  pharmacist: CompositionRecommendationGroup[];
  prescription: CompositionRecommendationGroup[];
}

const feverFollowUps = [
  "body-pain",
  "blocked-nose",
  "dry-cough",
  "chest-congestion",
  "sore-throat",
  "dehydration"
];

export function buildTreatmentPlans(symptomIds: string[], lanes: TreatmentPlanLanes): TreatmentPlan[] {
  const selected = new Set(symptomIds);
  const steps: TreatmentPlanStep[] = [];
  if (selected.has("fever")) {
    addStep(steps, lanes, {
      id: "fever-relief",
      purpose: "Fever discomfort",
      instruction: "Choose one suitable fever-relief option. Do not duplicate paracetamol across products.",
      kind: "choose-one",
      lane: "otc",
      titles: ["Paracetamol"]
    });
    addStep(steps, lanes, {
      id: "fever-prescription-alternative",
      purpose: "Alternative fever relief",
      instruction: "This is a doctor-only alternative, not an additional medicine to take with the OTC step.",
      kind: "choose-one",
      lane: "prescription",
      titles: ["Ibuprofen"]
    });
  }

  if (["blocked-nose", "sinus-congestion", "cold"].some((id) => selected.has(id))) {
    addStep(steps, lanes, {
      id: "nasal-congestion",
      purpose: "Blocked nose",
      instruction: "Choose one nasal decongestant, not both.",
      kind: "choose-one",
      lane: "otc",
      titles: ["Xylometazoline", "Oxymetazoline"]
    });
  }

  if (["cough", "chest-congestion"].some((id) => selected.has(id))) {
    addStep(steps, lanes, {
      id: "wet-cough",
      purpose: "Wet cough or chest congestion",
      instruction: "Choose one suitable expectorant or mucolytic option.",
      kind: "choose-one",
      lane: "otc",
      titles: ["Ambroxol", "Guaifenesin"]
    });
  }

  if (selected.has("dry-cough")) {
    addStep(steps, lanes, {
      id: "dry-cough-context",
      purpose: "Dry cough context",
      instruction: "A clinician must confirm the cough type and choose at most one suitable prescription option.",
      kind: "choose-one",
      lane: "prescription",
      titles: ["Dextromethorphan", "Noscapine", "Pholcodine"]
    });
  }

  if (["dehydration", "diarrhea", "loose-motion", "vomiting"].some((id) => selected.has(id))) {
    addStep(steps, lanes, {
      id: "fluid-replacement",
      purpose: "Fluid replacement",
      instruction: "Use oral rehydration as a separate supportive component.",
      kind: "add-on",
      lane: "otc",
      titles: ["Oral Rehydration Salts"]
    });
  }

  addUncoveredSymptomSteps(steps, symptomIds, lanes);

  addCombinationSteps(steps, lanes.pharmacist, "pharmacist");
  addCombinationSteps(steps, lanes.prescription, "prescription");

  return steps.length > 0 ? [{
    id: "matched-symptom-plan",
    title: "Matched treatment plan",
    summary: "Each step targets a selected symptom. Choose between alternatives in the same step; do not take every option shown.",
    steps
  }] : [];
}

function addUncoveredSymptomSteps(
  steps: TreatmentPlanStep[],
  symptomIds: string[],
  lanes: TreatmentPlanLanes
): void {
  const symptoms = getSymptomsByIds(symptomIds);
  const usedCompositionIds = new Set(steps.flatMap((step) => step.alternatives.map((item) => item.compositionId)));
  const laneOrder: Array<{ lane: RecommendationLane; groups: CompositionRecommendationGroup[] }> = [
    { lane: "otc", groups: lanes.otc },
    { lane: "pharmacist", groups: lanes.pharmacist },
    { lane: "prescription", groups: lanes.prescription }
  ];

  for (const symptom of symptoms) {
    const alreadyCovered = laneOrder.some(({ groups }) => groups.some((group) =>
      usedCompositionIds.has(group.id) && groupMatchesSymptom(group, symptom.id)
    ));
    if (alreadyCovered) continue;

    for (const { lane, groups } of laneOrder) {
      const alternatives = groups
        .filter((group) => !group.title.includes("+")
          && !usedCompositionIds.has(group.id)
          && groupMatchesSymptom(group, symptom.id))
        .slice(0, 4);
      if (alternatives.length === 0) continue;

      alternatives.forEach((group) => usedCompositionIds.add(group.id));
      steps.push({
        id: `symptom-${symptom.id}-${lane}`,
        purpose: symptom.label,
        instruction: lane === "otc"
          ? "Choose one suitable composition for this symptom; alternatives are not intended to be taken together."
          : lane === "pharmacist"
            ? "Ask a pharmacist to choose one suitable option and check ingredient overlap."
            : "These are doctor-only alternatives. A clinician must confirm the cause and choose the treatment.",
        kind: "choose-one",
        alternatives: alternatives.map((group) => ({ compositionId: group.id, title: group.title, lane }))
      });
      break;
    }
  }
}

function groupMatchesSymptom(group: CompositionRecommendationGroup, symptomId: string): boolean {
  return group.products.some((item) => item.medicine.symptomIds.includes(symptomId));
}

export function recommendationFollowUpSymptoms(symptomIds: string[]): Symptom[] {
  const selected = new Set(symptomIds);
  const candidates = symptomIds.includes("fever") ? [...feverFollowUps] : [];
  if (symptomIds.includes("cough")
    && !symptomIds.includes("dry-cough")
    && !symptomIds.includes("chest-congestion")) {
    candidates.push("dry-cough", "chest-congestion");
  }
  return getSymptomsByIds([...new Set(candidates)].filter((id) => !selected.has(id)));
}

function addCombinationSteps(
  steps: TreatmentPlanStep[],
  groups: CompositionRecommendationGroup[],
  lane: RecommendationLane
): void {
  const combinations = groups.filter((group) => group.title.includes("+"));
  if (combinations.length === 0) return;
  steps.push({
    id: `${lane}-combination-context`,
    purpose: lane === "pharmacist" ? "Combination to check with a pharmacist" : "Combination requiring a prescription",
    instruction: "This combination replaces overlapping single-ingredient steps; it is not an add-on to them.",
    kind: "replacement-combination",
    alternatives: combinations.slice(0, 4).map((group) => ({ compositionId: group.id, title: group.title, lane }))
  });
}

function addStep(
  steps: TreatmentPlanStep[],
  lanes: TreatmentPlanLanes,
  rule: {
    id: string;
    purpose: string;
    instruction: string;
    kind: TreatmentPlanStep["kind"];
    lane: RecommendationLane;
    titles: string[];
  }
): void {
  const groups = lanes[rule.lane].filter((group) => rule.titles.includes(group.title));
  if (groups.length === 0) return;
  steps.push({
    id: rule.id,
    purpose: rule.purpose,
    instruction: rule.instruction,
    kind: rule.kind,
    alternatives: groups.map((group) => ({ compositionId: group.id, title: group.title, lane: rule.lane }))
  });
}
