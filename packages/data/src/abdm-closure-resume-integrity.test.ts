import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runCatalogClosure } from "./abdm-closure-runner";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe("ABDM closure resume integrity", () => {
  it("refetches a completed checkpoint whose stored page is corrupt", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "otcora-abdm-resume-integrity-"));
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
    const validPayload = {
      drugDetails: [{ brandIdentifier: "brand-1", brandName: "Alpha", supplierIdentifier: "supplier-1" }],
      drugsCount: 1
    };
    await runCatalogClosure({ ...options, fetchImpl: async () => Response.json(validPayload) });
    const rawPath = join(outputDir, "raw/anchors/supplier-1/0.json");
    const corrupt = JSON.parse(await readFile(rawPath, "utf8"));
    corrupt.drugDetails = [];
    await writeFile(rawPath, JSON.stringify(corrupt), "utf8");
    let calls = 0;
    const resumed = await runCatalogClosure({
      ...options,
      fetchImpl: async () => {
        calls += 1;
        return Response.json(validPayload);
      }
    });
    expect(calls).toBe(1);
    expect(resumed.complete).toBe(true);
  });

  it("rejects unsafe seed supplier IDs before filesystem access", async () => {
    const outputDir = await mkdtemp(join(tmpdir(), "otcora-abdm-resume-integrity-"));
    temporaryDirectories.push(outputDir);
    await expect(runCatalogClosure({
      accessToken: "test-token",
      baseUrl: "https://example.test/v1",
      supplierIds: ["../outside"],
      seedRows: [],
      outputDir,
      pageSize: 500,
      concurrency: 1,
      minimumPrefixCounts: {},
      fetchImpl: async () => Response.json({ drugDetails: [], drugsCount: 0 })
    })).rejects.toThrow("unsafe");
  });
});
