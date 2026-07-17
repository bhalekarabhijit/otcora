import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runGenericFamilyExport } from "../abdm-generic-runner";
import { readSecretLine } from "../secure-input";

const root = fileURLToPath(new URL("../../../../", import.meta.url));

function argument(name: string, fallback: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

const outputDir = resolve(argument("output", resolve(root, "data/raw/abdm-registry/v2")));
const genericIdsPath = resolve(argument("generic-ids", resolve(outputDir, "generic-ids.json")));
const pageSize = Number.parseInt(argument("page-size", "10000"), 10);
const concurrency = Number.parseInt(argument("concurrency", "4"), 10);
const genericIds = JSON.parse(await readFile(genericIdsPath, "utf8")) as string[];
const accessToken = await readSecretLine(process.stdin, process.stdout, "ABDM access token: ");
if (!accessToken) throw new Error("No ABDM access token was received.");

console.log(`Starting ${genericIds.length.toLocaleString("en-IN")} resumable generic-family exports.`);
const manifest = await runGenericFamilyExport({
  accessToken,
  baseUrl: "https://drugregistry.abdm.gov.in/api/drug-registry/v1",
  genericIds,
  outputDir,
  pageSize,
  concurrency,
  onProgress: ({ processed, total, genericId, complete }) => {
    if (processed % 50 === 0 || !complete) {
      console.log(`${processed.toLocaleString("en-IN")}/${total.toLocaleString("en-IN")} generic ${genericId}: ${complete ? "complete" : "failed"}`);
    }
  }
});
console.log(JSON.stringify(manifest, null, 2));
if (!manifest.complete) process.exitCode = 2;
