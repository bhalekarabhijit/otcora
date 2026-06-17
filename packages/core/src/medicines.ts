import type { Medicine } from "./types";

const sampleSource = {
  sourceName: "Otcora clinical seed",
  sourceUrl: "manual://otcora-seed",
  sitemapType: "manual" as const,
  parserVersion: "seed-v1",
  confidence: 0.72
};

export const medicines: Medicine[] = [
  {
    id: "paracetamol-500",
    name: "Paracetamol 500 mg",
    genericName: "Paracetamol",
    form: "Tablet",
    prescriptionStatus: "otc",
    indications: ["Fever", "Headache", "Body pain"],
    symptomIds: ["fever", "headache", "pain"],
    warnings: ["Avoid duplicate paracetamol combinations.", "Ask a doctor if you have liver disease."],
    source: sampleSource
  },
  {
    id: "cetirizine-10",
    name: "Cetirizine 10 mg",
    genericName: "Cetirizine",
    form: "Tablet",
    prescriptionStatus: "otc",
    indications: ["Allergy symptoms", "Sneezing", "Runny nose"],
    symptomIds: ["allergy", "cold"],
    warnings: ["May cause sleepiness.", "Avoid alcohol after taking sedating antihistamines."],
    source: sampleSource
  },
  {
    id: "ors-sachet",
    name: "Oral Rehydration Salts",
    genericName: "ORS",
    form: "Sachet",
    prescriptionStatus: "otc",
    indications: ["Fluid loss due to diarrhea"],
    symptomIds: ["diarrhea"],
    warnings: ["Seek care if there is blood in stool, severe dehydration, or persistent fever."],
    source: sampleSource
  },
  {
    id: "antacid-gel",
    name: "Antacid oral gel",
    genericName: "Magaldrate and simethicone",
    form: "Oral suspension",
    prescriptionStatus: "otc",
    indications: ["Acidity", "Heartburn", "Indigestion"],
    symptomIds: ["acidity"],
    warnings: ["Do not use long term without medical advice."],
    source: sampleSource
  },
  {
    id: "dextromethorphan-syrup",
    name: "Dextromethorphan cough syrup",
    genericName: "Dextromethorphan",
    form: "Syrup",
    prescriptionStatus: "otc",
    indications: ["Dry cough"],
    symptomIds: ["cough"],
    warnings: ["Avoid in persistent cough with breathing difficulty.", "Check age-specific dosing before use."],
    source: sampleSource
  },
  {
    id: "azithromycin-500",
    name: "Azithromycin 500 mg",
    genericName: "Azithromycin",
    form: "Tablet",
    prescriptionStatus: "prescription",
    indications: ["Bacterial infections"],
    symptomIds: ["fever", "cough"],
    warnings: ["Prescription-only antibiotic.", "Do not self-medicate with antibiotics."],
    source: sampleSource
  },
  {
    id: "pantoprazole-40",
    name: "Pantoprazole 40 mg",
    genericName: "Pantoprazole",
    form: "Tablet",
    prescriptionStatus: "prescription",
    indications: ["Acid reflux", "Gastritis"],
    symptomIds: ["acidity"],
    warnings: ["Use under medical advice, especially for repeated symptoms."],
    source: sampleSource
  }
];

export function getMedicineById(id: string): Medicine | undefined {
  return medicines.find((medicine) => medicine.id === id);
}

export function searchMedicines(query: string, limit = 10): Medicine[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return medicines.slice(0, limit);
  }

  return medicines
    .filter((medicine) => {
      const haystack = [medicine.name, medicine.genericName, medicine.form, ...medicine.indications]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    })
    .slice(0, limit);
}
