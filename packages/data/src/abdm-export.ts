export interface AbdmDrugRow {
  brandIdentifier?: string;
  brandName?: string;
  genericIdentifier?: string;
  supplierIdentifier?: string;
  substanceIdentifier?: string[];
  [key: string]: unknown;
}

export interface AbdmPage {
  drugDetails?: AbdmDrugRow[];
  count?: number;
  drugsCount?: number;
  [key: string]: unknown;
}

export interface ExportCheckpoint {
  id: string;
  kind: "supplier" | "generic" | "substance";
  advertisedRecords: number;
  returnedRecords: number;
  complete: boolean;
  error?: string;
}

export interface ExportManifest {
  expectedEntities: number;
  completedEntities: number;
  advertisedRecords: number;
  returnedRecords: number;
  complete: boolean;
  failedEntityIds: string[];
}

interface FetchJsonOptions {
  accessToken: string;
  fetchImpl?: typeof fetch;
  maxAttempts?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  baseDelayMs?: number;
}

export class AbdmRequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly attempts: number
  ) {
    super(message);
    this.name = "AbdmRequestError";
  }
}

const defaultSleep = (milliseconds: number) => new Promise<void>((resolve) => {
  setTimeout(resolve, milliseconds);
});

function parseResponseBody(body: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(body) as Record<string, unknown>;
  } catch {
    return undefined;
  }
}

export async function fetchJsonWithRetry<T>(url: string, options: FetchJsonOptions): Promise<T> {
  const fetchImpl = options.fetchImpl ?? fetch;
  const maxAttempts = options.maxAttempts ?? 6;
  const sleep = options.sleep ?? defaultSleep;
  const baseDelayMs = options.baseDelayMs ?? 750;
  let lastError = new AbdmRequestError("ABDM request was not attempted.", 0, 0);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    let response: Response;
    try {
      response = await fetchImpl(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${options.accessToken}`
        }
      });
    } catch (error) {
      lastError = new AbdmRequestError(
        `ABDM network request failed: ${error instanceof Error ? error.message : "unknown error"}`,
        0,
        attempt
      );
      if (attempt < maxAttempts) {
        await sleep(Math.min(15_000, baseDelayMs * 2 ** (attempt - 1)));
        continue;
      }
      throw lastError;
    }

    const body = await response.text();
    const parsed = parseResponseBody(body);
    if (response.ok) return parsed as T;

    const code = typeof parsed?.code === "string" ? parsed.code : undefined;
    const retryable = response.status === 429 || response.status >= 500 || code === "ABDM-1001";
    const label = code ? `${response.status} ${code}` : `HTTP ${response.status}`;
    lastError = new AbdmRequestError(`ABDM request failed with ${label}.`, response.status, attempt);

    if (!retryable || attempt === maxAttempts) throw lastError;
    await sleep(Math.min(15_000, baseDelayMs * 2 ** (attempt - 1)));
  }

  throw lastError;
}

export function assessPageSet(advertisedRecords: number, pages: AbdmPage[]) {
  const returnedRecords = pages.reduce(
    (total, page) => total + (Array.isArray(page.drugDetails) ? page.drugDetails.length : 0),
    0
  );
  return {
    advertisedRecords,
    returnedRecords,
    complete: returnedRecords === advertisedRecords
  };
}

export function buildExportManifest(checkpoints: ExportCheckpoint[]): ExportManifest {
  const failedEntityIds = checkpoints.filter((checkpoint) => !checkpoint.complete).map((checkpoint) => checkpoint.id);
  return {
    expectedEntities: checkpoints.length,
    completedEntities: checkpoints.length - failedEntityIds.length,
    advertisedRecords: checkpoints.reduce((total, checkpoint) => total + checkpoint.advertisedRecords, 0),
    returnedRecords: checkpoints.reduce((total, checkpoint) => total + checkpoint.returnedRecords, 0),
    complete: failedEntityIds.length === 0,
    failedEntityIds
  };
}

function richness(row: AbdmDrugRow) {
  return Object.values(row).filter((value) => value !== undefined && value !== null && value !== "").length;
}

export function mergeBrandRows(rows: AbdmDrugRow[]) {
  const brands = new Map<string, AbdmDrugRow>();
  for (const row of rows) {
    if (!row.brandIdentifier) continue;
    const current = brands.get(row.brandIdentifier);
    if (!current) {
      brands.set(row.brandIdentifier, row);
      continue;
    }
    const richer = richness(row) >= richness(current) ? row : current;
    const other = richer === row ? current : row;
    brands.set(row.brandIdentifier, { ...other, ...richer });
  }
  return [...brands.values()].sort((a, b) => String(a.brandIdentifier).localeCompare(String(b.brandIdentifier)));
}
