import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCsv } from "../csv";

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

const root = resolve(process.cwd(), "../..");
const inputPath = resolve(root, "data/raw/seed_1mg_medicines.csv");
const outputPath = resolve(root, "packages/core/src/medicine-catalog.generated.ts");

async function main() {
  const rows = parseCsv(await readFile(inputPath, "utf8"));
  const generated: GeneratedSeedRow[] = rows.map((row, index) => ({
    id: stableId(row.drugName ?? `medicine-${index + 1}`, row.composition ?? "", index + 2),
    name: row.drugName ?? "",
    composition: row.composition ?? "",
    ...(row.manufacturer ? { manufacturer: row.manufacturer } : {}),
    ...(row.mrp ? { mrp: row.mrp.trim() } : {}),
    ...(row.price ? { price: row.price.trim() } : {}),
    ...(row.packaging ? { packaging: row.packaging } : {}),
    ...(row.prescription ? { prescriptionRaw: row.prescription } : {}),
    rowNumber: index + 2
  }));

  await mkdir(resolve(root, "packages/core/src"), { recursive: true });
  await writeFile(outputPath, [
    "import type { SeedMedicineRecord } from \"./medicine-catalog\";",
    "",
    `export const seedMedicineRecords: SeedMedicineRecord[] = ${JSON.stringify(generated, null, 2)};`,
    ""
  ].join("\n"));
  console.log(`Generated ${generated.length} seed medicine records at ${outputPath}`);
}

function stableId(name: string, composition: string, rowNumber: number): string {
  const base = `${name}-${composition}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return `${base || "medicine"}-${rowNumber}`;
}

await main();
