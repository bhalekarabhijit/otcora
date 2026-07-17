import { describe, expect, it } from "vitest";
import { fetchAnchorSnapshot } from "./abdm-anchor-export";

describe("ABDM anchor snapshots", () => {
  it("discovers neighboring suppliers in a stable paginated snapshot", async () => {
    const requestedPages: number[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const page = Number(new URL(String(input)).searchParams.get("page"));
      requestedPages.push(page);
      return Response.json(page === 0
        ? {
            drugDetails: [
              { brandIdentifier: "brand-1", supplierIdentifier: "supplier-1" },
              { brandIdentifier: "brand-2", supplierIdentifier: "supplier-2" }
            ],
            drugsCount: 3
          }
        : {
            drugDetails: [{ brandIdentifier: "brand-3", supplierIdentifier: "supplier-2" }],
            drugsCount: 3
          });
    };

    const result = await fetchAnchorSnapshot("supplier-1", {
      accessToken: "test-token",
      baseUrl: "https://example.test/v1",
      pageSize: 2,
      fetchImpl,
      retry: { maxAttempts: 1, sleep: async () => undefined }
    });

    expect(requestedPages).toEqual([0, 1]);
    expect(result.discoveredSupplierIds).toEqual(["supplier-1", "supplier-2"]);
    expect(result.checkpoint).toMatchObject({
      id: "supplier-1",
      kind: "anchor",
      advertisedRecords: 3,
      returnedRecords: 3,
      complete: true
    });
  });

  it("rejects a snapshot whose drugsCount changes between pages", async () => {
    const fetchImpl: typeof fetch = async (input) => {
      const page = Number(new URL(String(input)).searchParams.get("page"));
      return Response.json({
        drugDetails: page === 0
          ? [
              { brandIdentifier: "brand-1", supplierIdentifier: "supplier-1" },
              { brandIdentifier: "brand-2", supplierIdentifier: "supplier-1" }
            ]
          : [{ brandIdentifier: "brand-3", supplierIdentifier: "supplier-1" }],
        drugsCount: page === 0 ? 3 : 4
      });
    };

    await expect(fetchAnchorSnapshot("supplier-1", {
      accessToken: "test-token",
      baseUrl: "https://example.test/v1",
      pageSize: 2,
      fetchImpl,
      retry: { maxAttempts: 1, sleep: async () => undefined }
    })).rejects.toThrow("changed drugsCount");
  });

  it("rejects a page that exceeds the requested page size", async () => {
    const fetchImpl: typeof fetch = async () => Response.json({
      drugDetails: [
        { brandIdentifier: "brand-1", supplierIdentifier: "supplier-1" },
        { brandIdentifier: "brand-2", supplierIdentifier: "supplier-1" }
      ],
      drugsCount: 2
    });

    await expect(fetchAnchorSnapshot("supplier-1", {
      accessToken: "test-token",
      baseUrl: "https://example.test/v1",
      pageSize: 1,
      fetchImpl,
      retry: { maxAttempts: 1, sleep: async () => undefined }
    })).rejects.toThrow("exceeds page size");
  });
});
