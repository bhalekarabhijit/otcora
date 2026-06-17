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
    label: "Cold and runny nose",
    aliases: ["runny nose", "sneezing", "common cold", "nasal congestion"]
  },
  {
    id: "dry-cough",
    label: "Dry cough",
    aliases: ["tickly cough", "non productive cough", "dry throat cough"]
  },
  {
    id: "chest-congestion",
    label: "Chest congestion",
    aliases: ["phlegm", "wet cough", "mucus", "productive cough"]
  },
  {
    id: "blocked-nose",
    label: "Blocked nose",
    aliases: ["stuffy nose", "nasal blockage", "nasal congestion"]
  },
  {
    id: "sinus-congestion",
    label: "Sinus congestion",
    aliases: ["sinus pressure", "blocked sinus", "sinus headache"]
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
    id: "migraine",
    label: "Migraine",
    aliases: ["one sided headache", "severe headache", "headache with nausea"]
  },
  {
    id: "acidity",
    label: "Acidity and heartburn",
    aliases: ["gas", "acid reflux", "burning stomach", "indigestion"]
  },
  {
    id: "heartburn",
    label: "Heartburn",
    aliases: ["burning chest", "acid reflux", "reflux"]
  },
  {
    id: "gas",
    label: "Gas and bloating",
    aliases: ["bloating", "flatulence", "stomach gas"]
  },
  {
    id: "indigestion",
    label: "Indigestion",
    aliases: ["dyspepsia", "heavy stomach", "stomach discomfort"]
  },
  {
    id: "allergy",
    label: "Allergy symptoms",
    aliases: ["itching", "rash", "hives", "sneezing allergy"],
    redFlagTerms: ["swollen lips", "difficulty breathing"]
  },
  {
    id: "sneezing",
    label: "Sneezing",
    aliases: ["frequent sneezing", "allergic sneezing"]
  },
  {
    id: "itching",
    label: "Itching",
    aliases: ["skin itching", "pruritus", "itchy skin"]
  },
  {
    id: "skin-rash",
    label: "Skin rash",
    aliases: ["rash", "red patches", "hives", "skin allergy"]
  },
  {
    id: "eczema",
    label: "Eczema",
    aliases: ["dry itchy skin", "dermatitis"]
  },
  {
    id: "fungal-infection",
    label: "Fungal infection",
    aliases: ["ringworm", "athlete foot", "jock itch", "skin fungus"]
  },
  {
    id: "acne",
    label: "Acne",
    aliases: ["pimples", "breakouts", "spots"]
  },
  {
    id: "diarrhea",
    label: "Diarrhea",
    aliases: ["loose motion", "loose stools", "upset stomach"],
    redFlagTerms: ["dehydration", "blood in stool"]
  },
  {
    id: "loose-motion",
    label: "Loose motion",
    aliases: ["loose stools", "watery stools", "upset stomach"]
  },
  {
    id: "constipation",
    label: "Constipation",
    aliases: ["hard stool", "difficulty passing stool", "no motion"]
  },
  {
    id: "nausea",
    label: "Nausea",
    aliases: ["feeling like vomiting", "queasy", "morning sickness"]
  },
  {
    id: "vomiting",
    label: "Vomiting",
    aliases: ["throwing up", "puking", "emesis"]
  },
  {
    id: "motion-sickness",
    label: "Motion sickness",
    aliases: ["travel sickness", "car sickness", "nausea while travelling"]
  },
  {
    id: "body-pain",
    label: "Body pain",
    aliases: ["muscle pain", "body ache", "joint pain", "back pain"]
  },
  {
    id: "joint-pain",
    label: "Joint pain",
    aliases: ["knee pain", "shoulder pain", "arthritis pain"]
  },
  {
    id: "back-pain",
    label: "Back pain",
    aliases: ["lower back pain", "backache"]
  },
  {
    id: "toothache",
    label: "Toothache",
    aliases: ["tooth pain", "dental pain"]
  },
  {
    id: "menstrual-cramps",
    label: "Menstrual cramps",
    aliases: ["period pain", "period cramps", "dysmenorrhea"]
  },
  {
    id: "arthritis-pain",
    label: "Arthritis pain",
    aliases: ["joint inflammation", "swollen joints"]
  },
  {
    id: "abdominal-cramps",
    label: "Abdominal cramps",
    aliases: ["stomach cramps", "belly cramps"]
  },
  {
    id: "stomach-pain",
    label: "Stomach pain",
    aliases: ["abdominal pain", "belly pain"]
  },
  {
    id: "sore-throat",
    label: "Sore throat",
    aliases: ["throat pain", "throat irritation", "pain while swallowing"]
  },
  {
    id: "bacterial-infection",
    label: "Bacterial infection",
    aliases: ["infection", "antibiotic", "pus", "infected wound"]
  },
  {
    id: "viral-infection",
    label: "Viral infection",
    aliases: ["viral fever", "flu like illness"]
  },
  {
    id: "cold-sores",
    label: "Cold sores",
    aliases: ["herpes sores", "lip blisters"]
  },
  {
    id: "skin-infection",
    label: "Skin infection",
    aliases: ["infected skin", "boil", "wound infection"]
  },
  {
    id: "uti",
    label: "Urinary tract infection",
    aliases: ["urine infection", "uti symptoms"]
  },
  {
    id: "burning-urination",
    label: "Burning urination",
    aliases: ["burning pee", "pain while urinating", "urine burning"]
  },
  {
    id: "urinary-symptoms",
    label: "Urinary symptoms",
    aliases: ["frequent urination", "urine problem", "urinary discomfort"]
  },
  {
    id: "prostate-symptoms",
    label: "Prostate symptoms",
    aliases: ["weak urine stream", "night urination", "bph"]
  },
  {
    id: "wheezing",
    label: "Wheezing",
    aliases: ["whistling breath", "wheeze"]
  },
  {
    id: "asthma",
    label: "Asthma symptoms",
    aliases: ["asthma", "inhaler", "wheezing cough"]
  },
  {
    id: "breathlessness",
    label: "Breathlessness",
    aliases: ["shortness of breath", "difficulty breathing", "dyspnea"],
    redFlagTerms: ["blue lips", "chest pain", "severe breathlessness"]
  },
  {
    id: "high-blood-pressure",
    label: "High blood pressure",
    aliases: ["hypertension", "bp high", "blood pressure"]
  },
  {
    id: "chest-pain",
    label: "Chest pain",
    aliases: ["chest tightness", "heart pain", "angina"],
    redFlagTerms: ["radiating pain", "sweating", "breathlessness"]
  },
  {
    id: "heart-health",
    label: "Heart health medicines",
    aliases: ["cardiac", "heart medicine", "heart condition"]
  },
  {
    id: "blood-clot-prevention",
    label: "Blood clot prevention",
    aliases: ["blood thinner", "antiplatelet", "clot prevention"]
  },
  {
    id: "high-cholesterol",
    label: "High cholesterol",
    aliases: ["lipids", "cholesterol", "triglycerides"]
  },
  {
    id: "diabetes",
    label: "Diabetes",
    aliases: ["sugar", "blood sugar", "diabetic medicine"]
  },
  {
    id: "high-blood-sugar",
    label: "High blood sugar",
    aliases: ["hyperglycemia", "sugar high"]
  },
  {
    id: "thyroid",
    label: "Thyroid symptoms",
    aliases: ["thyroid medicine", "hypothyroid", "hyperthyroid"]
  },
  {
    id: "anxiety",
    label: "Anxiety",
    aliases: ["nervousness", "worry", "stress"]
  },
  {
    id: "panic",
    label: "Panic symptoms",
    aliases: ["panic attack", "sudden fear", "palpitations anxiety"]
  },
  {
    id: "insomnia",
    label: "Insomnia",
    aliases: ["sleep problem", "cannot sleep", "sleeplessness"]
  },
  {
    id: "depression",
    label: "Depression",
    aliases: ["low mood", "sadness", "mood symptoms"]
  },
  {
    id: "mental-health",
    label: "Mental health medicines",
    aliases: ["psychiatric", "mood medicine", "antidepressant"]
  },
  {
    id: "nerve-pain",
    label: "Nerve pain",
    aliases: ["neuropathic pain", "burning nerve pain", "tingling pain"]
  },
  {
    id: "seizure",
    label: "Seizure disorder",
    aliases: ["fits", "epilepsy", "convulsion"]
  },
  {
    id: "vertigo",
    label: "Vertigo",
    aliases: ["dizziness", "spinning sensation", "balance problem"]
  },
  {
    id: "anemia",
    label: "Anemia",
    aliases: ["low hemoglobin", "iron deficiency", "low hb"]
  },
  {
    id: "fatigue",
    label: "Fatigue",
    aliases: ["tiredness", "weakness", "low energy"]
  },
  {
    id: "vitamin-deficiency",
    label: "Vitamin deficiency",
    aliases: ["b12 deficiency", "vitamin d deficiency", "supplements"]
  },
  {
    id: "bone-health",
    label: "Bone health",
    aliases: ["calcium", "weak bones", "vitamin d"]
  },
  {
    id: "eye-redness",
    label: "Eye redness",
    aliases: ["red eye", "irritated eye"]
  },
  {
    id: "eye-allergy",
    label: "Eye allergy",
    aliases: ["itchy eyes", "watery eyes", "allergic conjunctivitis"]
  },
  {
    id: "eye-infection",
    label: "Eye infection",
    aliases: ["conjunctivitis", "eye discharge", "sticky eye"]
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
