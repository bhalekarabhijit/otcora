import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchJsonWithRetry } from "./abdm-export";
import { assertSafeRegistryId } from "./abdm-identifiers";

interface RetryOptions {
  maxAttempts?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  baseDelayMs?: number;
}

export interface SubstanceDetailPayload {
  substanceIdentifier?: string;
  substanceName?: string;
  [key: string]: unknown;
}

interface SubstanceCheckpoint {
  id: string;
  complete: boolean;
  error?: string;
}

export interface SubstanceDetailManifest {
  source: "ABDM Drug Registry";
  exportedAt: string;
  totalSubstances: number;
  completedSubstances: number;
  failedSubstanceIds: string[];
  complete: boolean;
}

interface RunSubstanceDetailExportOptions {
  accessToken: string;
  baseUrl: string;
  substanceIds: string[];
  outputDir: string;
  concurrency: number;
  fetchImpl?: typeof fetch;
  retry?: RetryOptions;
  onProgress?: (progress: { processed: number; total: number; substanceId: string; complete: boolean }) => void;
}

async function writeJsonAtomic(path: string, value: unknown) {
  const temporaryPath = `${path}.partial`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

async function loadCheckpoints(directory: string) {
  const checkpoints = new Map<string, SubstanceCheckpoint>();
  let entries: string[] = [];
  try {
    entries = await readdir(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return checkpoints;
    throw error;
  }
  await Promise.all(entries.filter((entry) => entry.endsWith(".json")).map(async (entry) => {
    try {
      const checkpoint = JSON.parse(await readFile(join(directory, entry), "utf8")) as SubstanceCheckpoint;
      assertSafeRegistryId(checkpoint.id, "substance");
      checkpoints.set(checkpoint.id, checkpoint);
    } catch {
      // Invalid checkpoints are refetched from the supplied inventory.
    }
  }));
  return checkpoints;
}

async function runWorkers<T>(items: T[], concurrency: number, worker: (item: T) => Promise<void>) {
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor];
      cursor += 1;
      if (item !== undefined) await worker(item);
    }
  }));
}

export function validateSubstanceDetail(id: string, payload: SubstanceDetailPayload) {
  assertSafeRegistryId(id, "substance");
  if (payload.substanceIdentifier !== id) {
    throw new Error(`ABDM substance ${id} returned identifier ${payload.substanceIdentifier ?? "missing"}.`);
  }
}

export async function runSubstanceDetailExport(
  options: RunSubstanceDetailExportOptions
): Promise<SubstanceDetailManifest> {
  const rawDirectory = join(options.outputDir, "raw", "substances");
  const checkpointDirectory = join(options.outputDir, "checkpoints", "substances");
  await Promise.all([mkdir(rawDirectory, { recursive: true }), mkdir(checkpointDirectory, { recursive: true })]);
  const substanceIds = [...new Set(
    options.substanceIds.filter(Boolean).map((id) => assertSafeRegistryId(id, "substance"))
  )].sort();
  const checkpoints = await loadCheckpoints(checkpointDirectory);
  for (const checkpoint of checkpoints.values()) {
    if (!checkpoint.complete) continue;
    try {
      const payload = JSON.parse(await readFile(join(rawDirectory, `${checkpoint.id}.json`), "utf8")) as SubstanceDetailPayload;
      validateSubstanceDetail(checkpoint.id, payload);
    } catch (error) {
      checkpoint.complete = false;
      checkpoint.error = error instanceof Error ? error.message : "Stored substance validation failed.";
      await writeJsonAtomic(join(checkpointDirectory, `${checkpoint.id}.json`), checkpoint);
    }
  }
  const isComplete = (id: string) => checkpoints.get(id)?.complete === true;
  const pending = substanceIds.filter((id) => !isComplete(id));
  let processed = substanceIds.length - pending.length;

  await runWorkers(pending, options.concurrency, async (substanceId) => {
    let checkpoint: SubstanceCheckpoint;
    try {
      const url = `${options.baseUrl.replace(/\/$/, "")}/substances/${encodeURIComponent(substanceId)}`;
      const payload = await fetchJsonWithRetry<SubstanceDetailPayload>(url, {
        accessToken: options.accessToken,
        ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
        ...(options.retry?.maxAttempts !== undefined ? { maxAttempts: options.retry.maxAttempts } : {}),
        ...(options.retry?.sleep ? { sleep: options.retry.sleep } : {}),
        ...(options.retry?.baseDelayMs !== undefined ? { baseDelayMs: options.retry.baseDelayMs } : {})
      });
      validateSubstanceDetail(substanceId, payload);
      await writeJsonAtomic(join(rawDirectory, `${substanceId}.json`), payload);
      checkpoint = { id: substanceId, complete: true };
    } catch (error) {
      checkpoint = {
        id: substanceId,
        complete: false,
        error: error instanceof Error ? error.message : "Unknown ABDM substance export error."
      };
    }
    checkpoints.set(substanceId, checkpoint);
    await writeJsonAtomic(join(checkpointDirectory, `${substanceId}.json`), checkpoint);
    processed += 1;
    options.onProgress?.({ processed, total: substanceIds.length, substanceId, complete: checkpoint.complete });
  });

  const failedSubstanceIds = substanceIds.filter((id) => !isComplete(id));
  const manifest: SubstanceDetailManifest = {
    source: "ABDM Drug Registry",
    exportedAt: new Date().toISOString(),
    totalSubstances: substanceIds.length,
    completedSubstances: substanceIds.length - failedSubstanceIds.length,
    failedSubstanceIds,
    complete: failedSubstanceIds.length === 0
  };
  await writeJsonAtomic(join(options.outputDir, "substance-detail-manifest.json"), manifest);
  return manifest;
}
