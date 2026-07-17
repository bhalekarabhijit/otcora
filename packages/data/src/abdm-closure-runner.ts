import { createWriteStream } from "node:fs";
import { once } from "node:events";
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fetchAnchorSnapshot, validateAnchorRows } from "./abdm-anchor-export";
import type { AbdmDrugRow, AbdmPage } from "./abdm-export";
import { assertSafeRegistryId } from "./abdm-identifiers";

interface RetryOptions {
  maxAttempts?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  baseDelayMs?: number;
}

interface AnchorCheckpoint {
  id: string;
  kind: "anchor";
  pageSize: number;
  advertisedRecords: number;
  returnedRecords: number;
  discoveredSupplierIds: string[];
  complete: boolean;
  error?: string;
}

export interface CatalogClosureManifest {
  source: "ABDM Drug Registry";
  exportedAt: string;
  pageSize: number;
  rounds: number;
  totalAnchors: number;
  completedAnchors: number;
  failedAnchorIds: string[];
  closureReached: boolean;
  coverageReached: boolean;
  minimumPrefixCounts: Record<string, number>;
  prefixCounts: Record<string, number>;
  uniqueBrands: number;
  complete: boolean;
}

export interface RunCatalogClosureOptions {
  accessToken: string;
  baseUrl: string;
  supplierIds: string[];
  seedRows: AbdmDrugRow[];
  outputDir: string;
  pageSize: number;
  concurrency: number;
  minimumPrefixCounts?: Record<string, number>;
  fetchImpl?: typeof fetch;
  retry?: RetryOptions;
  onProgress?: (progress: {
    rounds: number;
    knownAnchors: number;
    completedAnchors: number;
    failedAnchors: number;
    activeAnchor?: string;
  }) => void;
}

const DEFAULT_MINIMUM_PREFIX_COUNTS = { A: 13_406, C: 12_463 };

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

function parseCheckpoint(value: unknown): AnchorCheckpoint {
  const checkpoint = value as Partial<AnchorCheckpoint>;
  if (checkpoint.kind !== "anchor" || typeof checkpoint.id !== "string") throw new Error("Invalid anchor checkpoint.");
  assertSafeRegistryId(checkpoint.id, "supplier anchor");
  if (!Number.isInteger(checkpoint.pageSize) || Number(checkpoint.pageSize) < 1) throw new Error("Invalid checkpoint pageSize.");
  if (!Number.isInteger(checkpoint.advertisedRecords) || Number(checkpoint.advertisedRecords) < 0) {
    throw new Error("Invalid checkpoint advertisedRecords.");
  }
  if (!Number.isInteger(checkpoint.returnedRecords) || Number(checkpoint.returnedRecords) < 0) {
    throw new Error("Invalid checkpoint returnedRecords.");
  }
  if (!Array.isArray(checkpoint.discoveredSupplierIds)) throw new Error("Invalid checkpoint discoveries.");
  const discoveredSupplierIds = checkpoint.discoveredSupplierIds.map((id) => {
    if (typeof id !== "string") throw new Error("Invalid discovered supplier ID.");
    return assertSafeRegistryId(id, "supplier");
  });
  return { ...checkpoint, discoveredSupplierIds } as AnchorCheckpoint;
}

async function loadCheckpoints(directory: string) {
  const checkpoints = new Map<string, AnchorCheckpoint>();
  let entries: string[] = [];
  try {
    entries = await readdir(directory);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return checkpoints;
    throw error;
  }
  await Promise.all(entries.filter((entry) => entry.endsWith(".json")).map(async (entry) => {
    try {
      const parsed = parseCheckpoint(JSON.parse(await readFile(join(directory, entry), "utf8")));
      checkpoints.set(parsed.id, parsed);
    } catch {
      // Invalid checkpoints are ignored and fetched again if present in the seed inventory.
    }
  }));
  return checkpoints;
}

function payloadCount(payload: AbdmPage) {
  return payload.drugsCount ?? payload.count;
}

async function validateStoredSnapshot(rawDirectory: string, checkpoint: AnchorCheckpoint, pageSize: number) {
  const pages: AbdmPage[] = [];
  const requiredPages = Math.max(1, Math.ceil(checkpoint.advertisedRecords / pageSize));
  for (let page = 0; page < requiredPages; page += 1) {
    const payload = JSON.parse(
      await readFile(join(rawDirectory, checkpoint.id, `${page}.json`), "utf8")
    ) as AbdmPage;
    if (!Array.isArray(payload.drugDetails) || payload.drugDetails.length > pageSize) {
      throw new Error(`Stored anchor ${checkpoint.id} has invalid page ${page}.`);
    }
    if (payloadCount(payload) !== checkpoint.advertisedRecords) {
      throw new Error(`Stored anchor ${checkpoint.id} has inconsistent drugsCount.`);
    }
    pages.push(payload);
  }
  const returnedRecords = pages.reduce((total, page) => total + (page.drugDetails?.length ?? 0), 0);
  if (returnedRecords !== checkpoint.returnedRecords || returnedRecords !== checkpoint.advertisedRecords) {
    throw new Error(`Stored anchor ${checkpoint.id} has inconsistent row totals.`);
  }
  const { supplierIds } = validateAnchorRows(checkpoint.id, pages);
  const discovered = [...supplierIds].sort();
  if (JSON.stringify(discovered) !== JSON.stringify([...checkpoint.discoveredSupplierIds].sort())) {
    throw new Error(`Stored anchor ${checkpoint.id} has inconsistent supplier discoveries.`);
  }
}

function richness(row: AbdmDrugRow) {
  return Object.values(row).filter((value) => value !== undefined && value !== null && value !== "").length;
}

function mergeBrand(brands: Map<string, AbdmDrugRow>, row: AbdmDrugRow) {
  if (!row.brandIdentifier) throw new Error("Cannot merge an ABDM row without brandIdentifier.");
  assertSafeRegistryId(row.brandIdentifier, "brand");
  const current = brands.get(row.brandIdentifier);
  if (!current) {
    brands.set(row.brandIdentifier, row);
    return;
  }
  const richer = richness(row) >= richness(current) ? row : current;
  const other = richer === row ? current : row;
  brands.set(row.brandIdentifier, { ...other, ...richer });
}

async function mergeCompletedRows(
  rawDirectory: string,
  checkpoints: Map<string, AnchorCheckpoint>,
  pageSize: number,
  brands: Map<string, AbdmDrugRow>
) {
  for (const checkpoint of checkpoints.values()) {
    if (!checkpoint.complete || checkpoint.pageSize !== pageSize) continue;
    const pages = Math.max(1, Math.ceil(checkpoint.advertisedRecords / pageSize));
    for (let page = 0; page < pages; page += 1) {
      const payload = JSON.parse(await readFile(join(rawDirectory, checkpoint.id, `${page}.json`), "utf8")) as AbdmPage;
      for (const row of payload.drugDetails ?? []) mergeBrand(brands, row);
    }
  }
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

export async function runCatalogClosure(options: RunCatalogClosureOptions): Promise<CatalogClosureManifest> {
  if (!Number.isInteger(options.pageSize) || options.pageSize < 1) throw new Error("pageSize must be a positive integer.");
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error("concurrency must be a positive integer.");
  }
  const seedSupplierIds = options.supplierIds.map((id) => assertSafeRegistryId(id, "supplier anchor"));
  const rawDirectory = join(options.outputDir, "raw", "anchors");
  const checkpointDirectory = join(options.outputDir, "checkpoints", "anchors");
  await Promise.all([mkdir(rawDirectory, { recursive: true }), mkdir(checkpointDirectory, { recursive: true })]);

  const checkpoints = await loadCheckpoints(checkpointDirectory);
  for (const checkpoint of checkpoints.values()) {
    if (!checkpoint.complete || checkpoint.pageSize !== options.pageSize) continue;
    try {
      await validateStoredSnapshot(rawDirectory, checkpoint, options.pageSize);
    } catch (error) {
      checkpoint.complete = false;
      checkpoint.error = error instanceof Error ? error.message : "Stored anchor validation failed.";
      await writeJsonAtomic(join(checkpointDirectory, `${checkpoint.id}.json`), checkpoint);
    }
  }

  const knownAnchors = new Set(uniqueStrings(seedSupplierIds));
  for (const checkpoint of checkpoints.values()) {
    knownAnchors.add(checkpoint.id);
    for (const id of checkpoint.discoveredSupplierIds) knownAnchors.add(id);
  }
  const isComplete = (id: string) => {
    const checkpoint = checkpoints.get(id);
    return checkpoint?.complete === true && checkpoint.pageSize === options.pageSize;
  };
  let pending = [...knownAnchors].filter((id) => !isComplete(id)).sort();
  let rounds = 0;

  while (pending.length > 0) {
    rounds += 1;
    const currentRound = pending;
    const discoveredThisRound = new Set<string>();
    await runWorkers(currentRound, options.concurrency, async (anchorId) => {
      const anchorDirectory = join(rawDirectory, assertSafeRegistryId(anchorId, "supplier anchor"));
      await rm(anchorDirectory, { recursive: true, force: true });
      await mkdir(anchorDirectory, { recursive: true });
      options.onProgress?.({
        rounds,
        knownAnchors: knownAnchors.size,
        completedAnchors: [...knownAnchors].filter(isComplete).length,
        failedAnchors: [...checkpoints.values()].filter((checkpoint) => !checkpoint.complete).length,
        activeAnchor: anchorId
      });
      try {
        const result = await fetchAnchorSnapshot(anchorId, {
          accessToken: options.accessToken,
          baseUrl: options.baseUrl,
          pageSize: options.pageSize,
          ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
          ...(options.retry ? { retry: options.retry } : {}),
          savePage: async (page, payload) => writeJsonAtomic(join(anchorDirectory, `${page}.json`), payload)
        });
        const checkpoint: AnchorCheckpoint = {
          id: anchorId,
          kind: "anchor",
          pageSize: options.pageSize,
          advertisedRecords: result.checkpoint.advertisedRecords,
          returnedRecords: result.checkpoint.returnedRecords,
          discoveredSupplierIds: result.discoveredSupplierIds,
          complete: true
        };
        checkpoints.set(anchorId, checkpoint);
        await writeJsonAtomic(join(checkpointDirectory, `${anchorId}.json`), checkpoint);
        for (const discoveredId of result.discoveredSupplierIds) discoveredThisRound.add(discoveredId);
      } catch (error) {
        const checkpoint: AnchorCheckpoint = {
          id: anchorId,
          kind: "anchor",
          pageSize: options.pageSize,
          advertisedRecords: 0,
          returnedRecords: 0,
          discoveredSupplierIds: [],
          complete: false,
          error: error instanceof Error ? error.message : "Unknown ABDM export error."
        };
        checkpoints.set(anchorId, checkpoint);
        await writeJsonAtomic(join(checkpointDirectory, `${anchorId}.json`), checkpoint);
      }
    });
    for (const id of discoveredThisRound) knownAnchors.add(assertSafeRegistryId(id, "supplier"));
    pending = [...discoveredThisRound].filter((id) => !isComplete(id)).sort();
  }

  const failedAnchorIds = [...knownAnchors].filter((id) => !isComplete(id)).sort();
  const completedAnchors = knownAnchors.size - failedAnchorIds.length;
  const closureReached = failedAnchorIds.length === 0;
  const brandsById = new Map<string, AbdmDrugRow>();
  for (const row of options.seedRows) mergeBrand(brandsById, row);
  await mergeCompletedRows(rawDirectory, checkpoints, options.pageSize, brandsById);
  const brands = [...brandsById.values()].sort((a, b) => String(a.brandIdentifier).localeCompare(String(b.brandIdentifier)));
  const prefixCounts = countPrefixes(brands);
  const minimumPrefixCounts = options.minimumPrefixCounts ?? DEFAULT_MINIMUM_PREFIX_COUNTS;
  const coverageReached = Object.entries(minimumPrefixCounts).every(
    ([prefix, minimum]) => (prefixCounts[prefix.toUpperCase()] ?? 0) >= minimum
  );
  const complete = closureReached && coverageReached;
  const genericIds = uniqueStrings(brands.map((row) => row.genericIdentifier));
  const substanceIds = uniqueStrings(brands.flatMap((row) => Array.isArray(row.substanceIdentifier)
    ? row.substanceIdentifier
    : [row.substanceIdentifier]));
  const manifest: CatalogClosureManifest = {
    source: "ABDM Drug Registry",
    exportedAt: new Date().toISOString(),
    pageSize: options.pageSize,
    rounds,
    totalAnchors: knownAnchors.size,
    completedAnchors,
    failedAnchorIds,
    closureReached,
    coverageReached,
    minimumPrefixCounts,
    prefixCounts,
    uniqueBrands: brands.length,
    complete
  };

  await writeJsonLinesAtomic(join(options.outputDir, "brands.jsonl"), brands);
  await Promise.all([
    writeJsonAtomic(join(options.outputDir, "supplier-ids.json"), [...knownAnchors].sort()),
    writeJsonAtomic(join(options.outputDir, "generic-ids.json"), genericIds),
    writeJsonAtomic(join(options.outputDir, "substance-ids.json"), substanceIds)
  ]);
  await writeJsonAtomic(join(options.outputDir, "manifest.json"), manifest);
  options.onProgress?.({ rounds, knownAnchors: knownAnchors.size, completedAnchors, failedAnchors: failedAnchorIds.length });
  return manifest;
}
