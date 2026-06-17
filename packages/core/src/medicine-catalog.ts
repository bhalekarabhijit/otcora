import { rulesForComposition } from "./ingredient-rules";
import { seedMedicineRecords } from "./medicine-catalog.generated";
import type { Medicine, PrescriptionStatus } from "./types";

export interface SeedMedicineRecord {
  id: string;
  name: string;
  composition: string;
  manufacturer?: string;
  mrp?: string;
  price?: string;
  packaging?: string;
  prescriptionRaw?: string;
  rowNumber: number;
}

export function buildMedicineCatalog(records: SeedMedicineRecord[] = seedMedicineRecords): Medicine[] {
  const csvMedicines = records.map(seedToMedicine).filter((medicine): medicine is Medicine => Boolean(medicine));
  return csvMedicines.length > 0 ? csvMedicines : fallbackMedicines;
}

function seedToMedicine(record: SeedMedicineRecord): Medicine | undefined {
  if (!record.name || !record.composition) {
    return undefined;
  }

  const rules = rulesForComposition(record.composition);
  const symptomIds = unique(rules.flatMap((rule) => rule.symptomIds));
  if (symptomIds.length === 0) {
    return undefined;
  }

  const prescriptionStatus = classifyPrescriptionStatus(record.prescriptionRaw, rules.some((rule) => rule.otcEligible));

  const form = inferForm(record.packaging, record.name);

  return {
    id: record.id,
    name: record.name,
    composition: record.composition,
    genericName: primaryIngredient(record.composition),
    ...(record.manufacturer ? { manufacturer: record.manufacturer } : {}),
    ...(record.mrp ? { mrp: record.mrp } : {}),
    ...(record.price ? { price: record.price } : {}),
    ...(record.packaging ? { packaging: record.packaging } : {}),
    ...(form ? { form } : {}),
    prescriptionStatus,
    indications: unique(rules.flatMap((rule) => rule.indications)),
    symptomIds,
    warnings: unique([
      ...rules.flatMap((rule) => rule.warnings),
      ...(prescriptionStatus === "prescription" ? ["Prescription required. Use only with a clinician's advice."] : []),
      ...(prescriptionStatus === "unknown" ? ["Prescription status was not confirmed in the source CSV. Ask a pharmacist before use."] : [])
    ]),
    source: {
      sourceName: "Imported 1mg CSV seed",
      sourceUrl: `csv://final.csv#row-${record.rowNumber}`,
      sitemapType: "manual",
      parserVersion: "csv-import-v1",
      confidence: 0.78
    }
  };
}

function classifyPrescriptionStatus(value: string | undefined, otcEligible: boolean): PrescriptionStatus {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("prescription required") || normalized === "prescription") {
    return "prescription";
  }
  if (otcEligible && (normalized.includes("not mentioned") || normalized === "")) {
    return "otc";
  }
  return "unknown";
}

function primaryIngredient(composition: string): string {
  return composition.split("+")[0]?.replace(/\s*\(.*/, "").trim() || composition;
}

function inferForm(packaging: string | undefined, name: string): string | undefined {
  const text = `${packaging ?? ""} ${name}`.toLowerCase();
  if (text.includes("tablet")) return "Tablet";
  if (text.includes("capsule")) return "Capsule";
  if (text.includes("syrup")) return "Syrup";
  if (text.includes("injection")) return "Injection";
  if (text.includes("drop")) return "Drops";
  if (text.includes("gel")) return "Gel";
  if (text.includes("cream")) return "Cream";
  if (text.includes("powder")) return "Powder";
  if (text.includes("suspension")) return "Suspension";
  return undefined;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))];
}

const fallbackSource = {
  sourceName: "Otcora clinical seed",
  sourceUrl: "manual://otcora-seed",
  sitemapType: "manual" as const,
  parserVersion: "seed-v1",
  confidence: 0.72
};

const fallbackMedicines: Medicine[] = [
  {
    id: "paracetamol-500",
    name: "Paracetamol 500 mg",
    composition: "Paracetamol (500mg)",
    genericName: "Paracetamol",
    form: "Tablet",
    prescriptionStatus: "otc",
    indications: ["Fever", "Headache", "Mild body pain"],
    symptomIds: ["fever", "headache", "body-pain"],
    warnings: ["Avoid duplicate paracetamol combinations.", "Ask a doctor if you have liver disease."],
    source: fallbackSource
  },
  {
    id: "cetirizine-10",
    name: "Cetirizine 10 mg",
    composition: "Cetirizine (10mg)",
    genericName: "Cetirizine",
    form: "Tablet",
    prescriptionStatus: "otc",
    indications: ["Allergy symptoms", "Sneezing or runny nose"],
    symptomIds: ["allergy", "cold", "sneezing"],
    warnings: ["May cause sleepiness.", "Avoid alcohol after taking sedating antihistamines."],
    source: fallbackSource
  }
];
