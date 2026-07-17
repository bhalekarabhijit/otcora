import { createReadStream } from "node:fs";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { runBrandDetailExport } from "../abdm-brand-runner";
import { readSecretLine } from "../secure-input";

const root = fileURLToPath(new URL("../../../../", import.meta.url));

function argument(name: string, fallback: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

async function loadKnownBrandIds(path: string) {
  const ids = new Set<string>();
  const lines = createInterface({ input: createReadStream(path), crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line) continue;
    const row = JSON.parse(line) as { brandIdentifier?: string };
    if (row.brandIdentifier) ids.add(row.brandIdentifier);
  }
  return ids;
}

const outputDir = resolve(argument("output", resolve(root, "data/raw/abdm-registry/v2")));
const brandsPath = resolve(argument("brands", resolve(outputDir, "brands.jsonl")));
const referencedIdsPath = resolve(argument("referenced-brand-ids", resolve(outputDir, "generic-brand-ids.json")));
const pageSize = Number.parseInt(argument("page-size", "10000"), 10);
const concurrency = Number.parseInt(argument("concurrency", "4"), 10);
const [knownBrandIds, referencedBrandIds] = await Promise.all([
  loadKnownBrandIds(brandsPath),
  readFile(referencedIdsPath, "utf8").then((contents) => JSON.parse(contents) as string[])
]);
const missingBrandIds = referencedBrandIds.filter((id) => !knownBrandIds.has(id));
const accessToken = await readSecretLine(process.stdin, process.stdout, "ABDM access token: ");
if (!accessToken) throw new Error("No ABDM access token was received.");

console.log(`Starting ${missingBrandIds.length.toLocaleString("en-IN")} resumable residual brand exports.`);
const manifest = await runBrandDetailExport({
  accessToken,
  baseUrl: "https://drugregistry.abdm.gov.in/api/drug-registry/v1",
  brandIds: missingBrandIds,
  outputDir,
  pageSize,
  concurrency,
  onProgress: ({ processed, total, brandId, complete }) => {
    if (processed % 50 === 0 || !complete) {
      console.log(`${processed.toLocaleString("en-IN")}/${total.toLocaleString("en-IN")} brand ${brandId}: ${complete ? "complete" : "failed"}`);
    }
  }
});
console.log(JSON.stringify(manifest, null, 2));
if (!manifest.complete) process.exitCode = 2;
