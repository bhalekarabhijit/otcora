import type { Symptom } from "./types";

export const symptoms: Symptom[] = [
  {
    id: "cough",
    label: "Cough",
    aliases: ["khansi", "dry cough", "wet cough", "productive cough"],
    redFlagTerms: ["blood", "breathless", "chest pain"]
  },
  {
    id: "cold",
    label: "Cold and blocked nose",
    aliases: ["runny nose", "sneezing", "nasal congestion", "stuffy nose"]
  },
  {
    id: "fever",
    label: "Fever",
    aliases: ["temperature", "high temperature", "body heat"],
    redFlagTerms: ["very high fever", "stiff neck", "confusion"]
  },
  {
    id: "headache",
    label: "Headache",
    aliases: ["head pain", "migraine", "forehead pain"],
    redFlagTerms: ["worst headache", "vision loss", "weakness"]
  },
  {
    id: "acidity",
    label: "Acidity and heartburn",
    aliases: ["gas", "acid reflux", "burning stomach", "indigestion"]
  },
  {
    id: "allergy",
    label: "Allergy symptoms",
    aliases: ["itching", "rash", "hives", "sneezing allergy"],
    redFlagTerms: ["swollen lips", "difficulty breathing"]
  },
  {
    id: "diarrhea",
    label: "Diarrhea",
    aliases: ["loose motion", "loose stools", "upset stomach"],
    redFlagTerms: ["dehydration", "blood in stool"]
  },
  {
    id: "pain",
    label: "Body pain",
    aliases: ["muscle pain", "body ache", "joint pain", "back pain"]
  }
];

export function searchSymptoms(query: string, limit = 8): Symptom[] {
  const normalized = normalize(query);
  if (!normalized) {
    return symptoms.slice(0, limit);
  }

  return symptoms
    .map((symptom) => {
      const terms = [symptom.label, ...symptom.aliases].map(normalize);
      const exactPrefix = terms.some((term) => term.startsWith(normalized));
      const contains = terms.some((term) => term.includes(normalized));
      const score = exactPrefix ? 3 : contains ? 2 : fuzzyMatch(terms, normalized) ? 1 : 0;
      return { symptom, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.symptom.label.localeCompare(b.symptom.label))
    .slice(0, limit)
    .map((item) => item.symptom);
}

export function getSymptomsByIds(ids: string[]): Symptom[] {
  const wanted = new Set(ids);
  return symptoms.filter((symptom) => wanted.has(symptom.id));
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function fuzzyMatch(terms: string[], query: string): boolean {
  if (query.length < 3) {
    return false;
  }
  return terms.some((term) => {
    let cursor = 0;
    for (const char of term) {
      if (char === query[cursor]) {
        cursor += 1;
      }
      if (cursor === query.length) {
        return true;
      }
    }
    return false;
  });
}
