import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { AbdmDrugRow, AbdmPage } from "../abdm-export";
import { runCatalogClosure } from "../abdm-closure-runner";
import { readSecretLine } from "../secure-input";

const root = fileURLToPath(new URL("../../../../", import.meta.url));

function argument(name: string, fallback: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function readAccessToken() {
  const token = await readSecretLine(process.stdin, process.stdout, "ABDM access token: ");
  if (token) return token;
  throw new Error("No ABDM access token was received.");
}

function richness(row: AbdmDrugRow) {
  return Object.values(row).filter((value) => value !== undefined && value !== null && value !== "").length;
}

function mergeInto(brands: Map<string, AbdmDrugRow>, row: AbdmDrugRow) {
  if (!row.brandIdentifier) return;
  const current = brands.get(row.brandIdentifier);
  if (!current) {
    brands.set(row.brandIdentifier, row);
    return;
  }
  const richer = richness(row) >= richness(current) ? row : current;
  const other = richer === row ? current : row;
  brands.set(row.brandIdentifier, { ...other, ...richer });
}

async function loadJsonLines(path: string, brands: Map<string, AbdmDrugRow>) {
  const contents = await readFile(path, "utf8");
  for (const line of contents.split(/\r?\n/)) {
    if (line.trim()) mergeInto(brands, JSON.parse(line) as AbdmDrugRow);
  }
}

async function loadLegacyPages(directory: string, brands: Map<string, AbdmDrugRow>) {
  let supplierDirectories;
  try {
    supplierDirectories = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return 0;
    throw error;
  }

  let pageCount = 0;
  for (const supplierDirectory of supplierDirectories) {
    if (!supplierDirectory.isDirectory()) continue;
    const supplierPath = resolve(directory, supplierDirectory.name);
    const pages = await readdir(supplierPath, { withFileTypes: true });
    for (const page of pages) {
      if (!page.isFile() || !page.name.endsWith(".json")) continue;
      try {
        const payload = JSON.parse(await readFile(resolve(supplierPath, page.name), "utf8")) as AbdmPage;
        for (const row of payload.drugDetails ?? []) mergeInto(brands, row);
        pageCount += 1;
      } catch (error) {
        console.warn(`Skipping unreadable legacy page ${supplierDirectory.name}/${page.name}: ${error instanceof Error ? error.message : "unknown error"}`);
      }
    }
  }
  return pageCount;
}

const supplierIdsPath = resolve(argument(
  "supplier-ids",
  "/private/tmp/otcora-abdm-full-export/supplier-ids-current.json"
));
const seedBrandsPath = resolve(argument(
  "seed-brands",
  "/private/tmp/otcora-abdm-full-export/seed-brands-current.jsonl"
));
const legacyRawDirectory = resolve(argument(
  "legacy-raw",
  resolve(root, "data/raw/abdm-registry/raw/suppliers")
));
const outputDir = resolve(argument("output", resolve(root, "data/raw/abdm-registry/v2")));
const pageSize = Number.parseInt(argument("page-size", "500"), 10);
const concurrency = Number.parseInt(argument("concurrency", "4"), 10);

const supplierIds = JSON.parse(await readFile(supplierIdsPath, "utf8")) as string[];
const brands = new Map<string, AbdmDrugRow>();
await loadJsonLines(seedBrandsPath, brands);
console.log(`Loaded ${brands.size.toLocaleString("en-IN")} verified seed brands.`);
const legacyPages = await loadLegacyPages(legacyRawDirectory, brands);
console.log(`Merged ${legacyPages.toLocaleString("en-IN")} legacy pages into ${brands.size.toLocaleString("en-IN")} unique seed brands.`);
console.log(`Prepared ${supplierIds.length.toLocaleString("en-IN")} initial supplier anchors; v2 output: ${outputDir}`);

const accessToken = await readAccessToken();
let progressEvents = 0;
const manifest = await runCatalogClosure({
  accessToken,
  baseUrl: "https://drugregistry.abdm.gov.in/api/drug-registry/v1",
  supplierIds,
  seedRows: [...brands.values()],
  outputDir,
  pageSize,
  concurrency,
  onProgress: (progress) => {
    progressEvents += 1;
    if (progressEvents % 50 === 0 || !progress.activeAnchor) {
      console.log(
        `Round ${progress.rounds}: ${progress.completedAnchors.toLocaleString("en-IN")}/${progress.knownAnchors.toLocaleString("en-IN")} anchors complete, ${progress.failedAnchors} failed.`
      );
    }
  }
});

console.log(JSON.stringify(manifest, null, 2));
if (!manifest.complete) process.exitCode = 2;
