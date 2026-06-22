import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { parseCsv } from "../csv";

const root = resolve(process.cwd(), "../..");
const inputPath = resolve(root, "data/raw/seed_medicines.csv");
const outputPath = resolve(root, "data/generated/seed-medicines.json");

async function main() {
  const rows = parseCsv(await readFile(inputPath, "utf8"));
  await mkdir(resolve(root, "data/generated"), { recursive: true });
  await writeFile(outputPath, JSON.stringify({ importedAt: new Date().toISOString(), rows }, null, 2));
  console.log(`Imported ${rows.length} seed rows to ${outputPath}`);
}

await main();
