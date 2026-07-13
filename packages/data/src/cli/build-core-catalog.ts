import { access, readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ingredientRules, rulesForComposition } from "@otcora/core";
import { parseCsv, type SeedMedicineRow } from "../csv";
import { compactRuntimeCatalog } from "../runtime-catalog";

interface GeneratedSeedRow {
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

interface NormalizedSeedRow {
  name: string;
  composition: string;
  manufacturer: string;
}

const root = resolve(process.cwd(), "../..");
const inputPath = resolve(root, "data/raw/seed_medicines.csv");
const jsonOutputPath = resolve(root, "data/generated/seed_medicines.json");
const tsOutputPath = resolve(root, "packages/core/src/medicine-catalog.generated.ts");
const ingredientPatterns = ingredientRules
  .flatMap((rule) => rule.patterns)
  .map((pattern) => pattern.toLowerCase())
  .sort((a, b) => b.length - a.length);

async function main() {
  if (!(await fileExists(inputPath))) {
    if (await fileExists(jsonOutputPath)) {
      await writeGeneratedTypeStub();
      console.log("Raw CSV not found; using existing generated JSON at " + jsonOutputPath + ".");
      return;
    }

    throw new Error(
      "Missing data/raw/seed_medicines.csv and data/generated/seed_medicines.json. Add the raw CSV locally or commit the generated JSON before building."
    );
  }

  const rows = parseCsv(await readFile(inputPath, "utf8"));
  console.log("Loaded " + rows.length + " rows from CSV.");

  const matchedRows: { row: SeedMedicineRow; normalized: NormalizedSeedRow; index: number }[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const normalized = normalizeSeedRow(row);
    if (isExcludedCatalogRow(normalized)) continue;
    if (normalized.composition && rulesForComposition(normalized.composition).length > 0) {
      const duplicateKey = normalized.name.toLowerCase() + "|" + normalized.composition.toLowerCase();
      if (seen.has(duplicateKey)) {
        continue;
      }
      seen.add(duplicateKey);
      matchedRows.push({ row, normalized, index: i });
    }
  }

  console.log("Filtered: " + matchedRows.length + " unique matched rows out of " + rows.length + " total rows.");

  const generated: GeneratedSeedRow[] = matchedRows.map(({ row, normalized, index }) => ({
    id: stableId(normalized.name || "medicine-" + (index + 1), normalized.composition, index + 2),
    name: normalized.name,
    composition: normalized.composition,
    ...(normalized.manufacturer ? { manufacturer: normalized.manufacturer } : {}),
    ...(row.mrp ? { mrp: row.mrp.trim() } : {}),
    ...(row.price ? { price: row.price.trim() } : {}),
    ...(row.packaging ? { packaging: cleanText(row.packaging) } : {}),
    ...(row.prescription ? { prescriptionRaw: cleanPrescription(row.prescription) } : {}),
    rowNumber: index + 2
  }));

  await mkdir(resolve(root, "data/generated"), { recursive: true });
  await mkdir(resolve(root, "packages/core/src"), { recursive: true });

  const runtimeCatalog = compactRuntimeCatalog(generated);
  await writeFile(jsonOutputPath, JSON.stringify(runtimeCatalog, null, 2), "utf8");
  console.log("Generated runtime JSON database with " + runtimeCatalog.length + " records at " + jsonOutputPath);

  await writeGeneratedTypeStub();
}

async function writeGeneratedTypeStub(): Promise<void> {
  await mkdir(resolve(root, "packages/core/src"), { recursive: true });
  await writeFile(tsOutputPath, [
    "import type { SeedMedicineRecord } from \"./medicine-catalog\";",
    "",
    "export const seedMedicineRecords: SeedMedicineRecord[] = [];",
    ""
  ].join("\n"), "utf8");
  console.log("Cleaned up generated TS file at " + tsOutputPath);
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function normalizeSeedRow(row: SeedMedicineRow): NormalizedSeedRow {
  const name = cleanText(row.drugName ?? row.name ?? "");
  let composition = cleanComposition(row.composition ?? "");
  let manufacturer = cleanManufacturer(row.manufacturer);

  if (isFormOnly(manufacturer)) {
    manufacturer = "";
  }

  const split = splitManufacturerPrefix(composition);
  if (split) {
    if (!manufacturer) manufacturer = cleanManufacturer(split.manufacturer);
    composition = cleanComposition(split.composition);
  }

  return { name, composition, manufacturer };
}

function isExcludedCatalogRow(row: NormalizedSeedRow): boolean {
  return /\btata\b/i.test(row.name + " " + row.manufacturer);
}

function splitManufacturerPrefix(composition: string): { manufacturer: string; composition: string } | undefined {
  const lower = composition.toLowerCase();
  if (ingredientPatterns.some((pattern) => lower.startsWith(pattern))) {
    return undefined;
  }

  let firstIngredientIndex = Number.POSITIVE_INFINITY;
  for (const pattern of ingredientPatterns) {
    const index = lower.indexOf(pattern);
    if (index > 0 && index < firstIngredientIndex) {
      firstIngredientIndex = index;
    }
  }

  if (!Number.isFinite(firstIngredientIndex) || firstIngredientIndex < 3) {
    return undefined;
  }

  const manufacturer = composition.slice(0, firstIngredientIndex).trim();
  const fixedComposition = composition.slice(firstIngredientIndex).trim();
  if (!manufacturer || !fixedComposition) {
    return undefined;
  }

  return { manufacturer, composition: fixedComposition };
}

function stableId(name: string, composition: string, rowNumber: number): string {
  const base = (name + "-" + composition)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return (base || "medicine") + "-" + rowNumber;
}

function cleanText(value: string | undefined): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function cleanComposition(value: string | undefined): string {
  return cleanText(value)
    .replace(/(^|\+\s*)Acid\s+\(/gi, "$1Mefenamic Acid (")
    .replace(/(^|\+\s*)Maleate\s+\(/gi, "$1Chlorpheniramine Maleate (");
}

function cleanManufacturer(value: string | undefined): string {
  const cleaned = cleanText(value)
    .replace(/^(tablet|capsule|syrup|oral suspension|suspension|injection|drop|drops|gel|cream|ointment|powder|solution|lotion|spray|respules?|inhaler|infusion|tablet pr|tablet sr|tablet er)\s+/i, "")
    .replace(/\s+(paracetamol|chlorpheniramine|dextromethorphan|ambroxol|guaifenesin|menthol|phenylephrine|mefenamic|aspirin|rosuvastatin|clopidogrel)$/i, "")
    .trim();
  return isFormOnly(cleaned) ? "" : cleaned;
}

function isFormOnly(value: string): boolean {
  return /^(tablet|capsule|syrup|oral suspension|suspension|injection|drop|drops|gel|cream|ointment|powder|solution|lotion|spray|respules?|inhaler|infusion)$/i.test(value);
}

function cleanPrescription(value: string | undefined): string {
  const cleaned = cleanText(value);
  if (cleaned === "True") return "Prescription Required";
  if (cleaned === "False") return "Not mentioned";
  return cleaned;
}

await main();
