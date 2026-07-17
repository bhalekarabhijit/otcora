import { fetchJsonWithRetry, type AbdmPage } from "./abdm-export";
import { assertSafeRegistryId } from "./abdm-identifiers";

interface RetryOptions {
  maxAttempts?: number;
  sleep?: (milliseconds: number) => Promise<void>;
  baseDelayMs?: number;
}

interface FetchAnchorSnapshotOptions {
  accessToken: string;
  baseUrl: string;
  pageSize: number;
  fetchImpl?: typeof fetch;
  savePage?: (page: number, payload: AbdmPage) => Promise<void>;
  retry?: RetryOptions;
}

export interface AnchorCheckpoint {
  id: string;
  kind: "anchor";
  advertisedRecords: number;
  returnedRecords: number;
  complete: boolean;
  error?: string;
}

function pageCount(payload: AbdmPage, page: number) {
  const count = payload.drugsCount ?? payload.count;
  if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
    throw new Error(`ABDM anchor page ${page} has no valid drugsCount.`);
  }
  return count;
}

function validatePage(payload: AbdmPage, page: number, pageSize: number) {
  if (!Array.isArray(payload.drugDetails)) {
    throw new Error(`ABDM anchor page ${page} has no drugDetails array.`);
  }
  if (payload.drugDetails.length > pageSize) {
    throw new Error(`ABDM anchor page ${page} exceeds page size ${pageSize}.`);
  }
  pageCount(payload, page);
}

export function validateAnchorRows(anchorId: string, pages: AbdmPage[]) {
  const brandIds = new Set<string>();
  const supplierIds = new Set<string>();
  for (const row of pages.flatMap((page) => page.drugDetails ?? [])) {
    if (!row.brandIdentifier) throw new Error(`ABDM anchor ${anchorId} contains a row without brandIdentifier.`);
    const brandId = assertSafeRegistryId(row.brandIdentifier, "brand");
    if (brandIds.has(brandId)) throw new Error(`ABDM anchor ${anchorId} contains duplicate brand ${brandId}.`);
    brandIds.add(brandId);
    if (row.supplierIdentifier) supplierIds.add(assertSafeRegistryId(row.supplierIdentifier, "supplier"));
  }
  return { brandIds, supplierIds };
}

export async function fetchAnchorSnapshot(
  anchorId: string,
  options: FetchAnchorSnapshotOptions
): Promise<{ pages: AbdmPage[]; checkpoint: AnchorCheckpoint; discoveredSupplierIds: string[] }> {
  assertSafeRegistryId(anchorId, "supplier anchor");
  const getPage = async (page: number) => {
    const url = new URL(`${options.baseUrl.replace(/\/$/, "")}/suppliers/${encodeURIComponent(anchorId)}`);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", String(options.pageSize));
    const payload = await fetchJsonWithRetry<AbdmPage>(url.toString(), {
      accessToken: options.accessToken,
      ...(options.fetchImpl ? { fetchImpl: options.fetchImpl } : {}),
      ...(options.retry?.maxAttempts !== undefined ? { maxAttempts: options.retry.maxAttempts } : {}),
      ...(options.retry?.sleep ? { sleep: options.retry.sleep } : {}),
      ...(options.retry?.baseDelayMs !== undefined ? { baseDelayMs: options.retry.baseDelayMs } : {})
    });
    validatePage(payload, page, options.pageSize);
    await options.savePage?.(page, payload);
    return payload;
  };

  const firstPage = await getPage(0);
  const advertisedRecords = pageCount(firstPage, 0);
  const pages = [firstPage];
  const requiredPages = Math.max(1, Math.ceil(advertisedRecords / options.pageSize));

  for (let page = 1; page < requiredPages; page += 1) {
    const payload = await getPage(page);
    const currentCount = pageCount(payload, page);
    if (currentCount !== advertisedRecords) {
      throw new Error(
        `ABDM anchor ${anchorId} changed drugsCount from ${advertisedRecords} to ${currentCount} on page ${page}.`
      );
    }
    pages.push(payload);
  }

  const rows = pages.flatMap((page) => page.drugDetails ?? []);
  if (rows.length !== advertisedRecords) {
    throw new Error(`ABDM anchor ${anchorId} returned ${rows.length} of ${advertisedRecords} advertised records.`);
  }
  const { supplierIds } = validateAnchorRows(anchorId, pages);
  return {
    pages,
    discoveredSupplierIds: [...supplierIds].sort(),
    checkpoint: {
      id: anchorId,
      kind: "anchor",
      advertisedRecords,
      returnedRecords: rows.length,
      complete: true
    }
  };
}
