import { rulesForComposition } from "./ingredient-rules";
import type { Medicine, PrescriptionStatus } from "./types";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

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

let cachedSeedRecords: SeedMedicineRecord[] | null = null;

function findDataFilePath(): string {
  const cwd = process.cwd();

  // Option 1: started from monorepo root
  const rootPath = join(cwd, "data/generated/seed_medicines.json");
  if (existsSync(rootPath)) return rootPath;

  // Option 2: started from apps/web or packages/core or packages/data
  const subrepoPath = join(cwd, "../../data/generated/seed_medicines.json");
  if (existsSync(subrepoPath)) return subrepoPath;

  // Option 3: fallback using import.meta.url
  try {
    const fileDir = new URL(".", import.meta.url).pathname;
    const resolvedPath = join(fileDir, "../../../data/generated/seed_medicines.json");
    if (existsSync(resolvedPath)) return resolvedPath;
  } catch (e) {
    // Ignore URL errors
  }

  throw new Error("Could not locate data/generated/seed_medicines.json. Run npm run data:prepare from the repo root.");
}

export function getSeedMedicineRecords(): SeedMedicineRecord[] {
  if (cachedSeedRecords) {
    return cachedSeedRecords;
  }

  const filePath = findDataFilePath();
  const raw = readFileSync(filePath, "utf8");
  cachedSeedRecords = JSON.parse(raw) as SeedMedicineRecord[];
  return cachedSeedRecords;
}

export function buildMedicineCatalog(records?: SeedMedicineRecord[]): Medicine[] {
  const actualRecords = records || getSeedMedicineRecords();
  const csvMedicines = actualRecords.map(seedToMedicine).filter((medicine): medicine is Medicine => Boolean(medicine));

  if (csvMedicines.length > 0) {
    return mergeCuratedMedicines(csvMedicines);
  }

  if (process.env.OTCORA_ALLOW_FALLBACK_CATALOG === "true") {
    return fallbackMedicines;
  }

  throw new Error(
    "No usable Otcora medicine records were loaded. Run npm run data:prepare from the repo root and ensure data/raw/seed_medicines.csv exists."
  );
}

function mergeCuratedMedicines(csvMedicines: Medicine[]): Medicine[] {
  const existingIds = new Set(csvMedicines.map((medicine) => medicine.id));
  return [
    ...curatedMedicines.filter((medicine) => !existingIds.has(medicine.id)),
    ...csvMedicines
  ];
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

  const prescriptionStatus = classifyPrescriptionStatus(record.prescriptionRaw, rules.every((rule) => rule.otcEligible));

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
      ...(prescriptionStatus === "unknown" ? ["Prescription status was not confirmed in the catalog. Ask a pharmacist before use."] : [])
    ]),
    source: {
      sourceName: "Imported medicine catalog",
      sourceUrl: `catalog://medicine-row-${record.rowNumber}`,
      sitemapType: "manual",
      parserVersion: "csv-import-v1",
      confidence: 0.78
    }
  };
}

function classifyPrescriptionStatus(value: string | undefined, selfCareEligible: boolean): PrescriptionStatus {
  const normalized = value?.toLowerCase() ?? "";
  if (normalized.includes("prescription required") || normalized === "prescription") {
    return "prescription";
  }
  if (selfCareEligible && (normalized.includes("not mentioned") || normalized === "")) {
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

const curatedSource = {
  sourceName: "Otcora clinical seed",
  sourceUrl: "manual://otcora-curated",
  sitemapType: "manual" as const,
  parserVersion: "curated-v1",
  confidence: 0.82
};

const curatedMedicines: Medicine[] = [
  {
    id: "oral-rehydration-salts",
    name: "Oral Rehydration Salts",
    composition: "Oral Rehydration Salts",
    genericName: "Oral Rehydration Salts",
    form: "Solution/Sachet",
    prescriptionStatus: "otc",
    indications: ["Dehydration prevention", "Fluid and electrolyte replacement"],
    symptomIds: ["dehydration", "diarrhea", "loose-motion", "vomiting"],
    warnings: ["Seek care urgently for confusion, very little urine, severe weakness, blood in stool, or dehydration in infants."],
    source: curatedSource
  }
];

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
