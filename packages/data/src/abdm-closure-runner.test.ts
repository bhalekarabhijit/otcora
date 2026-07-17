import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runCatalogClosure } from "./abdm-closure-runner";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("ABDM catalog closure", () => {
  it("runs another round for a newly discovered supplier anchor", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "otcora-abdm-closure-"));
    temporaryDirectories.push(outputDir);
    const requestedAnchors: string[] = [];
    const fetchImpl: typeof fetch = async (input) => {
      const anchorId = new URL(String(input)).pathname.split("/").at(-1)!;
      requestedAnchors.push(anchorId);
      return Response.json(anchorId === "supplier-1"
        ? {
            drugDetails: [
              { brandIdentifier: "brand-1", brandName: "Alpha", supplierIdentifier: "supplier-1" },
              { brandIdentifier: "brand-2", brandName: "Beta", supplierIdentifier: "supplier-2" }
            ],
            drugsCount: 2
          }
        : {
            drugDetails: [{ brandIdentifier: "brand-2", brandName: "Beta", supplierIdentifier: "supplier-2" }],
            drugsCount: 1
          });
    };

    const manifest = await runCatalogClosure({
      accessToken: "test-token",
      baseUrl: "https://example.test/v1",
      supplierIds: ["supplier-1"],
      seedRows: [],
      outputDir,
      pageSize: 500,
      concurrency: 2,
      minimumPrefixCounts: {},
      fetchImpl,
      retry: { maxAttempts: 1, sleep: async () => undefined }
    });

    expect(requestedAnchors).toEqual(["supplier-1", "supplier-2"]);
    expect(manifest).toMatchObject({
      rounds: 2,
      totalAnchors: 2,
      completedAnchors: 2,
      failedAnchorIds: [],
      closureReached: true,
      complete: true,
      uniqueBrands: 2
    });
  });

  it("keeps a failed anchor visible and blocks completion", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "otcora-abdm-closure-"));
    temporaryDirectories.push(outputDir);
    const fetchImpl: typeof fetch = async () => new Response(
      JSON.stringify({ code: "ABDM-1001", message: "No data found" }),
      { status: 404, headers: { "content-type": "application/json" } }
    );

    const manifest = await runCatalogClosure({
      accessToken: "test-token",
      baseUrl: "https://example.test/v1",
      supplierIds: ["supplier-1"],
      seedRows: [],
      outputDir,
      pageSize: 500,
      concurrency: 1,
      minimumPrefixCounts: {},
      fetchImpl,
      retry: { maxAttempts: 1, sleep: async () => undefined }
    });

    expect(manifest).toMatchObject({
      closureReached: false,
      complete: false,
      failedAnchorIds: ["supplier-1"]
    });
  });

  it("resumes complete checkpoints without new network calls", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "otcora-abdm-closure-"));
    temporaryDirectories.push(outputDir);
    const options = {
      accessToken: "test-token",
      baseUrl: "https://example.test/v1",
      supplierIds: ["supplier-1"],
      seedRows: [],
      outputDir,
      pageSize: 500,
      concurrency: 1,
      minimumPrefixCounts: {},
      retry: { maxAttempts: 1, sleep: async () => undefined }
    };

    await runCatalogClosure({
      ...options,
      fetchImpl: async () => Response.json({
        drugDetails: [{ brandIdentifier: "brand-1", brandName: "Alpha", supplierIdentifier: "supplier-1" }],
        drugsCount: 1
      })
    });
    const resumed = await runCatalogClosure({
      ...options,
      fetchImpl: async () => { throw new Error("complete anchors must not be fetched again"); }
    });

    expect(resumed.complete).toBe(true);
    expect(resumed.completedAnchors).toBe(1);
  });
});
