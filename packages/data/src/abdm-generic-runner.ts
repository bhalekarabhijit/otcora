import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchJsonWithRetry } from "./abdm-export";
import { assertSafeRegistryId } from "./abdm-identifiers";

interface RetryOptions {
  maxAttempts?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  baseDelayMs?: number;
}

interface GenericFamilyPayload {
  generic?: { identifier?: string; name?: string };
  totalCount?: number;
  alternateDrugs?: Array<{ brandIdentifier?: string; brandName?: string }>;
  [key: string]: unknown;
}

interface GenericCheckpoint {
  id: string;
  pageSize: number;
  advertisedBrands: number;
  returnedBrands: number;
  complete: boolean;
  error?: string;
}

export interface GenericFamilyManifest {
  source: "ABDM Drug Registry";
  exportedAt: string;
  pageSize: number;
  totalGenerics: number;
  completedGenerics: number;
  failedGenericIds: string[];
  referencedBrands: number;
  complete: boolean;
}

interface RunGenericFamilyExportOptions {
  accessToken: string;
  baseUrl: string;
  genericIds: string[];
  outputDir: string;
  pageSize: number;
  concurrency: number;
  fetchImpl?: typeof fetch;
  retry?: RetryOptions;
  onProgress?: (progress: { processed: number; total: number; genericId: string; complete: boolean }) => void;
}

async function writeJsonAtomic(path: string, value: unknown) {
  const temporaryPath = `${path}.partial`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

async function loadCheckpoints(directory: string) {
  const checkpoints = new Map<string, GenericCheckpoint>();
  let entries: string[] = [];
  try {
    entries = await readdir(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return checkpoints;
    throw error;
  }
  await Promise.all(entries.filter((entry) => entry.endsWith(".json")).map(async (entry) => {
    try {
      const checkpoint = JSON.parse(await readFile(join(directory, entry), "utf8")) as GenericCheckpoint;
      assertSafeRegistryId(checkpoint.id, "generic");
      if (!Number.isInteger(checkpoint.pageSize) || checkpoint.pageSize < 1) throw new Error("Invalid page size.");
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

export function validateGenericFamily(id: string, payload: GenericFamilyPayload, pageSize: number) {
  assertSafeRegistryId(id, "generic");
  if (payload.generic?.identifier !== id) {
    throw new Error(`ABDM generic ${id} returned identifier ${payload.generic?.identifier ?? "missing"}.`);
  }
  const total = payload.totalCount;
  const alternatives = payload.alternateDrugs;
  if (typeof total !== "number" || !Number.isInteger(total) || total < 0) {
    throw new Error(`ABDM generic ${id} has no valid totalCount.`);
  }
  if (!Array.isArray(alternatives)) throw new Error(`ABDM generic ${id} has no alternateDrugs array.`);
  if (total > pageSize) throw new Error(`ABDM generic ${id} advertises ${total} brands beyond limit ${pageSize}.`);
  const brandIds = new Set<string>();
  for (const alternative of alternatives) {
    if (!alternative.brandIdentifier) throw new Error(`ABDM generic ${id} has an alternative without brandIdentifier.`);
    brandIds.add(assertSafeRegistryId(alternative.brandIdentifier, "brand"));
  }
  if (brandIds.size < total) {
    throw new Error(`ABDM generic ${id} returned ${brandIds.size} unique brands for ${total} advertised brands.`);
  }
  return { total, alternatives, brandIds };
}

export async function runGenericFamilyExport(
  options: RunGenericFamilyExportOptions
): Promise<GenericFamilyManifest> {
  const rawDirectory = join(options.outputDir, "raw", "generics");
  const checkpointDirectory = join(options.outputDir, "checkpoints", "generics");
  await Promise.all([mkdir(rawDirectory, { recursive: true }), mkdir(checkpointDirectory, { recursive: true })]);
  const genericIds = [...new Set(options.genericIds.filter(Boolean).map((id) => assertSafeRegistryId(id, "generic")))].sort();
  const checkpoints = await loadCheckpoints(checkpointDirectory);
  for (const checkpoint of checkpoints.values()) {
    if (!checkpoint.complete || checkpoint.pageSize !== options.pageSize) continue;
    try {
      const payload = JSON.parse(await readFile(join(rawDirectory, `${checkpoint.id}.json`), "utf8")) as GenericFamilyPayload;
      validateGenericFamily(checkpoint.id, payload, options.pageSize);
    } catch (error) {
      checkpoint.complete = false;
      checkpoint.error = error instanceof Error ? error.message : "Stored generic validation failed.";
      await writeJsonAtomic(join(checkpointDirectory, `${checkpoint.id}.json`), checkpoint);
    }
  }
  const isComplete = (id: string) => {
    const checkpoint = checkpoints.get(id);
    return checkpoint?.complete === true && checkpoint.pageSize === options.pageSize;
  };
  const pending = genericIds.filter((id) => !isComplete(id));
  let processed = genericIds.length - pending.length;

  await runWorkers(pending, options.concurrency, async (genericId) => {
    let checkpoint: GenericCheckpoint;
    try {
      const url = new URL(`${options.baseUrl.replace(/\/$/, "")}/generics/${encodeURIComponent(genericId)}`);
      url.searchParams.set("page", "0");
      url.searchParams.set("limit", String(options.pageSize));
      const payload = await fetchJsonWithRetry<GenericFamilyPayload>(url.toString(), {
        accessToken: options.accessToken,
        ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
        ...(options.retry?.maxAttempts !== undefined ? { maxAttempts: options.retry.maxAttempts } : {}),
        ...(options.retry?.sleep ? { sleep: options.retry.sleep } : {}),
        ...(options.retry?.baseDelayMs !== undefined ? { baseDelayMs: options.retry.baseDelayMs } : {})
      });
      const { total, alternatives } = validateGenericFamily(genericId, payload, options.pageSize);
      await writeJsonAtomic(join(rawDirectory, `${genericId}.json`), payload);
      checkpoint = {
        id: genericId,
        pageSize: options.pageSize,
        advertisedBrands: total,
        returnedBrands: alternatives.length,
        complete: true
      };
    } catch (error) {
      checkpoint = {
        id: genericId,
        pageSize: options.pageSize,
        advertisedBrands: 0,
        returnedBrands: 0,
        complete: false,
        error: error instanceof Error ? error.message : "Unknown ABDM generic export error."
      };
    }
    checkpoints.set(genericId, checkpoint);
    await writeJsonAtomic(join(checkpointDirectory, `${genericId}.json`), checkpoint);
    processed += 1;
    options.onProgress?.({ processed, total: genericIds.length, genericId, complete: checkpoint.complete });
  });

  const failedGenericIds = genericIds.filter((id) => !isComplete(id));
  const brandIds = new Set<string>();
  for (const genericId of genericIds) {
    if (!isComplete(genericId)) continue;
    const payload = JSON.parse(await readFile(join(rawDirectory, `${genericId}.json`), "utf8")) as GenericFamilyPayload;
    const validated = validateGenericFamily(genericId, payload, options.pageSize);
    for (const brandId of validated.brandIds) brandIds.add(brandId);
  }
  const manifest: GenericFamilyManifest = {
    source: "ABDM Drug Registry",
    exportedAt: new Date().toISOString(),
    pageSize: options.pageSize,
    totalGenerics: genericIds.length,
    completedGenerics: genericIds.length - failedGenericIds.length,
    failedGenericIds,
    referencedBrands: brandIds.size,
    complete: failedGenericIds.length === 0
  };
  await writeJsonAtomic(join(options.outputDir, "generic-brand-ids.json"), [...brandIds].sort());
  await writeJsonAtomic(join(options.outputDir, "generic-manifest.json"), manifest);
  return manifest;
}
