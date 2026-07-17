import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runSubstanceDetailExport } from "../abdm-substance-runner";
import { readSecretLine } from "../secure-input";

const root = fileURLToPath(new URL("../../../../", import.meta.url));

function argument(name: string, fallback: string) {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length) ?? fallback;
}

const outputDir = resolve(argument("output", resolve(root, "data/raw/abdm-registry/v2")));
const substanceIdsPath = resolve(argument("substance-ids", resolve(outputDir, "substance-ids.json")));
const concurrency = Number.parseInt(argument("concurrency", "4"), 10);
const substanceIds = JSON.parse(await readFile(substanceIdsPath, "utf8")) as string[];
const accessToken = await readSecretLine(process.stdin, process.stdout, "ABDM access token: ");
if (!accessToken) throw new Error("No ABDM access token was received.");

console.log(`Starting ${substanceIds.length.toLocaleString("en-IN")} resumable substance-detail exports.`);
const manifest = await runSubstanceDetailExport({
  accessToken,
  baseUrl: "https://drugregistry.abdm.gov.in/api/drug-registry/v1",
  substanceIds,
  outputDir,
  concurrency,
  onProgress: ({ processed, total, substanceId, complete }) => {
    if (processed % 50 === 0 || !complete) {
      console.log(`${processed.toLocaleString("en-IN")}/${total.toLocaleString("en-IN")} substance ${substanceId}: ${complete ? "complete" : "failed"}`);
    }
  }
});
console.log(JSON.stringify(manifest, null, 2));
if (!manifest.complete) process.exitCode = 2;
