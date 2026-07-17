import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchJsonWithRetry } from "./abdm-export";
import { assertSafeRegistryId } from "./abdm-identifiers";

interface RetryOptions {
  maxAttempts?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  baseDelayMs?: number;
}

export interface BrandDetailPayload {
  brand?: { identifier?: string; name?: string; licenseStatus?: string };
  generic?: { identifier?: string; name?: string };
  supplier?: { identifier?: string; name?: string };
  substances?: Array<{ identifier?: string; name?: string }>;
  routeOfAdministrations?: Array<{ identifier?: string; name?: string }>;
  doseForm?: string;
  alternateDrugs?: Array<{ brandIdentifier?: string; brandName?: string }>;
  [key: string]: unknown;
}

interface BrandCheckpoint {
  id: string;
  pageSize: number;
  complete: boolean;
  error?: string;
}

export interface BrandDetailManifest {
  source: "ABDM Drug Registry";
  exportedAt: string;
  pageSize: number;
  totalBrands: number;
  completedBrands: number;
  failedBrandIds: string[];
  complete: boolean;
}

interface RunBrandDetailExportOptions {
  accessToken: string;
  baseUrl: string;
  brandIds: string[];
  outputDir: string;
  pageSize: number;
  concurrency: number;
  fetchImpl?: typeof fetch;
  retry?: RetryOptions;
  onProgress?: (progress: { processed: number; total: number; brandId: string; complete: boolean }) => void;
}

async function writeJsonAtomic(path: string, value: unknown) {
  const temporaryPath = `${path}.partial`;
  await writeFile(temporaryPath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  await rename(temporaryPath, path);
}

async function loadCheckpoints(directory: string) {
  const checkpoints = new Map<string, BrandCheckpoint>();
  let entries: string[] = [];
  try {
    entries = await readdir(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return checkpoints;
    throw error;
  }
  await Promise.all(entries.filter((entry) => entry.endsWith(".json")).map(async (entry) => {
    try {
      const checkpoint = JSON.parse(await readFile(join(directory, entry), "utf8")) as BrandCheckpoint;
      assertSafeRegistryId(checkpoint.id, "brand");
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

export function validateBrandDetail(id: string, payload: BrandDetailPayload) {
  assertSafeRegistryId(id, "brand");
  if (payload.brand?.identifier !== id) {
    throw new Error(`ABDM brand ${id} returned identifier ${payload.brand?.identifier ?? "missing"}.`);
  }
  if (payload.generic?.identifier) assertSafeRegistryId(payload.generic.identifier, "generic");
  if (payload.supplier?.identifier) assertSafeRegistryId(payload.supplier.identifier, "supplier");
  for (const substance of payload.substances ?? []) {
    if (substance.identifier) assertSafeRegistryId(substance.identifier, "substance");
  }
  for (const route of payload.routeOfAdministrations ?? []) {
    if (route.identifier) assertSafeRegistryId(route.identifier, "route");
  }
  for (const alternative of payload.alternateDrugs ?? []) {
    if (!alternative.brandIdentifier) throw new Error(`ABDM brand ${id} has an alternative without brandIdentifier.`);
    assertSafeRegistryId(alternative.brandIdentifier, "brand");
  }
}

export async function runBrandDetailExport(options: RunBrandDetailExportOptions): Promise<BrandDetailManifest> {
  const rawDirectory = join(options.outputDir, "raw", "brands");
  const checkpointDirectory = join(options.outputDir, "checkpoints", "brands");
  await Promise.all([mkdir(rawDirectory, { recursive: true }), mkdir(checkpointDirectory, { recursive: true })]);
  const brandIds = [...new Set(options.brandIds.filter(Boolean).map((id) => assertSafeRegistryId(id, "brand")))].sort();
  const checkpoints = await loadCheckpoints(checkpointDirectory);
  for (const checkpoint of checkpoints.values()) {
    if (!checkpoint.complete || checkpoint.pageSize !== options.pageSize) continue;
    try {
      const payload = JSON.parse(await readFile(join(rawDirectory, `${checkpoint.id}.json`), "utf8")) as BrandDetailPayload;
      validateBrandDetail(checkpoint.id, payload);
    } catch (error) {
      checkpoint.complete = false;
      checkpoint.error = error instanceof Error ? error.message : "Stored brand validation failed.";
      await writeJsonAtomic(join(checkpointDirectory, `${checkpoint.id}.json`), checkpoint);
    }
  }
  const isComplete = (id: string) => {
    const checkpoint = checkpoints.get(id);
    return checkpoint?.complete === true && checkpoint.pageSize === options.pageSize;
  };
  const pending = brandIds.filter((id) => !isComplete(id));
  let processed = brandIds.length - pending.length;

  await runWorkers(pending, options.concurrency, async (brandId) => {
    let checkpoint: BrandCheckpoint;
    try {
      const url = new URL(`${options.baseUrl.replace(/\/$/, "")}/brand/${encodeURIComponent(brandId)}`);
      url.searchParams.set("page", "0");
      url.searchParams.set("limit", String(options.pageSize));
      const payload = await fetchJsonWithRetry<BrandDetailPayload>(url.toString(), {
        accessToken: options.accessToken,
        ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
        ...(options.retry?.maxAttempts !== undefined ? { maxAttempts: options.retry.maxAttempts } : {}),
        ...(options.retry?.sleep ? { sleep: options.retry.sleep } : {}),
        ...(options.retry?.baseDelayMs !== undefined ? { baseDelayMs: options.retry.baseDelayMs } : {})
      });
      validateBrandDetail(brandId, payload);
      await writeJsonAtomic(join(rawDirectory, `${brandId}.json`), payload);
      checkpoint = { id: brandId, pageSize: options.pageSize, complete: true };
    } catch (error) {
      checkpoint = {
        id: brandId,
        pageSize: options.pageSize,
        complete: false,
        error: error instanceof Error ? error.message : "Unknown ABDM brand export error."
      };
    }
    checkpoints.set(brandId, checkpoint);
    await writeJsonAtomic(join(checkpointDirectory, `${brandId}.json`), checkpoint);
    processed += 1;
    options.onProgress?.({ processed, total: brandIds.length, brandId, complete: checkpoint.complete });
  });

  const failedBrandIds = brandIds.filter((id) => !isComplete(id));
  const manifest: BrandDetailManifest = {
    source: "ABDM Drug Registry",
    exportedAt: new Date().toISOString(),
    pageSize: options.pageSize,
    totalBrands: brandIds.length,
    completedBrands: brandIds.length - failedBrandIds.length,
    failedBrandIds,
    complete: failedBrandIds.length === 0
  };
  await writeJsonAtomic(join(options.outputDir, "brand-detail-manifest.json"), manifest);
  return manifest;
}
