import { describe, expect, it } from "vitest";
import {
  assessPageSet,
  buildExportManifest,
  fetchJsonWithRetry,
  mergeBrandRows,
  type ExportCheckpoint
} from "./abdm-export";

describe("ABDM request handling", () => {
  it("retries ABDM-1001 instead of treating it as an empty result", async () => {
    let attempts = 0;
    const fetchImpl: typeof fetch = async () => {
      attempts += 1;
      if (attempts < 3) {
        return new Response(JSON.stringify({ code: "ABDM-1001", message: "No data found" }), {
          status: 404,
          headers: { "content-type": "application/json" }
        });
      }
      return Response.json({ drugDetails: [{ brandIdentifier: "brand-1" }], drugsCount: 1 });
    };

    const result = await fetchJsonWithRetry<{ drugsCount: number }>("https://example.test/suppliers/1", {
      accessToken: "test-token",
      fetchImpl,
      maxAttempts: 3,
      sleep: async () => undefined
    });

    expect(result.drugsCount).toBe(1);
    expect(attempts).toBe(3);
  });

  it("fails after repeated ABDM-1001 responses", async () => {
    const fetchImpl: typeof fetch = async () => new Response(
      JSON.stringify({ code: "ABDM-1001", message: "No data found" }),
      { status: 404, headers: { "content-type": "application/json" } }
    );

    await expect(fetchJsonWithRetry("https://example.test/suppliers/1", {
      accessToken: "test-token",
      fetchImpl,
      maxAttempts: 2,
      sleep: async () => undefined
    })).rejects.toThrow("ABDM-1001");
  });
});

describe("ABDM export completeness", () => {
  it("requires every advertised record before marking a page set complete", () => {
    expect(assessPageSet(3, [
      { drugDetails: [{ brandIdentifier: "1" }, { brandIdentifier: "2" }] },
      { drugDetails: [] }
    ])).toEqual({ advertisedRecords: 3, returnedRecords: 2, complete: false });
  });

  it("rebuilds the manifest from checkpoints and keeps failures visible", () => {
    const checkpoints: ExportCheckpoint[] = [
      { id: "supplier-1", kind: "supplier", advertisedRecords: 2, returnedRecords: 2, complete: true },
      { id: "supplier-2", kind: "supplier", advertisedRecords: 3, returnedRecords: 1, complete: false, error: "HTTP 404 ABDM-1001" }
    ];

    expect(buildExportManifest(checkpoints)).toMatchObject({
      expectedEntities: 2,
      completedEntities: 1,
      advertisedRecords: 5,
      returnedRecords: 3,
      complete: false,
      failedEntityIds: ["supplier-2"]
    });
  });

  it("deduplicates brands by identifier while retaining the richer record", () => {
    const rows = mergeBrandRows([
      { brandIdentifier: "brand-1", brandName: "Demo" },
      { brandIdentifier: "brand-1", brandName: "Demo", genericIdentifier: "generic-1" },
      { brandIdentifier: "brand-2", brandName: "Second" }
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ brandIdentifier: "brand-1", genericIdentifier: "generic-1" });
  });
});
