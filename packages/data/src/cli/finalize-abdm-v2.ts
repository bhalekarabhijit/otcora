import { createReadStream, createWriteStream } from "node:fs";
import { once } from "node:events";
import { readFile, readdir, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import type { BrandDetailPayload } from "../abdm-brand-runner";
import type { AbdmDrugRow } from "../abdm-export";
import { mergeBrandRow, normalizeBrandDetail } from "../abdm-finalize";

const root = fileURLToPath(new URL("../../../../", import.meta.url));

function argument(name: string, fallback: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function writeJsonAtomic(path: string, value: unknown) {
  const temporaryPath = `${path}.partial`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

async function writeJsonLinesAtomic(path: string, rows: AbdmDrugRow[]) {
  const temporaryPath = `${path}.partial`;
  const stream = createWriteStream(temporaryPath);
  for (const row of rows) {
    if (!stream.write(`${JSON.stringify(row)}\n`)) await once(stream, "drain");
  }
  stream.end();
  await once(stream, "finish");
  await rename(temporaryPath, path);
}

async function loadBrands(path: string) {
  const brands = new Map<string, AbdmDrugRow>();
  const lines = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of lines) {
    if (line) mergeBrandRow(brands, JSON.parse(line) as AbdmDrugRow);
  }
  return brands;
}

function uniqueStrings(values: unknown[]) {
  return [...new Set(values.filter((value): value is string => typeof value === "string" && value.length > 0))].sort();
}

function countPrefixes(rows: AbdmDrugRow[]) {
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const prefix = row.brandName?.trim().charAt(0).toUpperCase();
    if (prefix) counts[prefix] = (counts[prefix] ?? 0) + 1;
  }
  return counts;
}

const outputDir = resolve(argument("output", resolve(root, "data/raw/abdm-registry/v2")));
const brandsPath = resolve(outputDir, "brands.jsonl");
const brandRawDirectory = resolve(outputDir, "raw/brands");
const genericRawDirectory = resolve(outputDir, "raw/generics");
const substanceRawDirectory = resolve(outputDir, "raw/substances");
const [brands, supplierManifest, genericManifest, brandManifest, substanceManifest, referencedBrandIds] = await Promise.all([
  loadBrands(brandsPath),
  readFile(resolve(outputDir, "manifest.json"), "utf8").then((value) => JSON.parse(value) as Record<string, unknown>),
  readFile(resolve(outputDir, "generic-manifest.json"), "utf8").then((value) => JSON.parse(value) as Record<string, unknown>),
  readFile(resolve(outputDir, "brand-detail-manifest.json"), "utf8").then((value) => JSON.parse(value) as Record<string, unknown>),
  readFile(resolve(outputDir, "substance-detail-manifest.json"), "utf8").then((value) => JSON.parse(value) as Record<string, unknown>),
  readFile(resolve(outputDir, "generic-brand-ids.json"), "utf8").then((value) => JSON.parse(value) as string[])
]);

const brandFiles = (await readdir(brandRawDirectory)).filter((file) => file.endsWith(".json")).sort();
for (const file of brandFiles) {
  const payload = JSON.parse(await readFile(resolve(brandRawDirectory, file), "utf8")) as BrandDetailPayload;
  mergeBrandRow(brands, normalizeBrandDetail(payload));
}

const rows = [...brands.values()].sort((a, b) => String(a.brandIdentifier).localeCompare(String(b.brandIdentifier)));
const prefixCounts = countPrefixes(rows);
const minimumPrefixCounts = { A: 13_406, C: 12_463 };
const coverageReached = Object.entries(minimumPrefixCounts).every(
  ([prefix, minimum]) => (prefixCounts[prefix] ?? 0) >= minimum
);
const unresolvedReferencedBrandIds = referencedBrandIds.filter((id) => !brands.has(id));
const [genericRawFiles, substanceRawFiles] = await Promise.all([
  readdir(genericRawDirectory).then((files) => files.filter((file) => file.endsWith(".json")).length),
  readdir(substanceRawDirectory).then((files) => files.filter((file) => file.endsWith(".json")).length)
]);
const rawFilesComplete = genericRawFiles === genericManifest.totalGenerics
  && brandFiles.length === brandManifest.totalBrands
  && substanceRawFiles === substanceManifest.totalSubstances;
const complete = supplierManifest.closureReached === true
  && genericManifest.complete === true
  && brandManifest.complete === true
  && substanceManifest.complete === true
  && unresolvedReferencedBrandIds.length === 0
  && rawFilesComplete
  && coverageReached;

const previousSupplierIds = JSON.parse(await readFile(resolve(outputDir, "supplier-ids.json"), "utf8")) as string[];
const genericIds = uniqueStrings(rows.map((row) => row.genericIdentifier));
const substanceIds = uniqueStrings(rows.flatMap((row) => Array.isArray(row.substanceIdentifier)
  ? row.substanceIdentifier
  : [row.substanceIdentifier]));
const supplierIds = uniqueStrings([...previousSupplierIds, ...rows.map((row) => row.supplierIdentifier)]);
const manifest = {
  ...supplierManifest,
  finalizedAt: new Date().toISOString(),
  prefixCounts,
  minimumPrefixCounts,
  coverageReached,
  uniqueBrands: rows.length,
  uniqueGenerics: genericIds.length,
  uniqueSubstances: substanceIds.length,
  uniqueSuppliers: supplierIds.length,
  genericFamilies: genericManifest.totalGenerics,
  completedGenericFamilies: genericManifest.completedGenerics,
  residualBrandDetails: brandManifest.totalBrands,
  completedResidualBrandDetails: brandManifest.completedBrands,
  substanceDetails: substanceManifest.totalSubstances,
  completedSubstanceDetails: substanceManifest.completedSubstances,
  genericRawFiles,
  brandRawFiles: brandFiles.length,
  substanceRawFiles,
  unresolvedReferencedBrandIds,
  complete
};

await writeJsonLinesAtomic(brandsPath, rows);
await Promise.all([
  writeJsonAtomic(resolve(outputDir, "generic-ids.json"), genericIds),
  writeJsonAtomic(resolve(outputDir, "substance-ids.json"), substanceIds),
  writeJsonAtomic(resolve(outputDir, "supplier-ids.json"), supplierIds)
]);
await writeJsonAtomic(resolve(outputDir, "manifest.json"), manifest);
console.log(JSON.stringify(manifest, null, 2));
if (!complete) process.exitCode = 2;
