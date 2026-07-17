import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runBrandDetailExport } from "./abdm-brand-runner";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

const createOutput = async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "otcora-abdm-brands-"));
  temporaryDirectories.push(outputDir);
  return outputDir;
};

const baseOptions = (outputDir: string) => ({
  accessToken: "test-token",
  baseUrl: "https://example.test/v1",
  brandIds: ["brand-1"],
  outputDir,
  pageSize: 10000,
  concurrency: 1,
  retry: { maxAttempts: 1, sleep: async () => undefined }
});

describe("ABDM residual brand export", () => {
  it("exports a matching brand detail", async () => {
    const outputDir = await createOutput();
    const manifest = await runBrandDetailExport({
      ...baseOptions(outputDir),
      fetchImpl: async () => Response.json({ brand: { identifier: "brand-1", name: "Alpha" } })
    });
    expect(manifest).toMatchObject({ totalBrands: 1, completedBrands: 1, failedBrandIds: [], complete: true });
  });

  it("rejects a mismatched brand detail", async () => {
    const outputDir = await createOutput();
    const manifest = await runBrandDetailExport({
      ...baseOptions(outputDir),
      fetchImpl: async () => Response.json({ brand: { identifier: "brand-2", name: "Beta" } })
    });
    expect(manifest.complete).toBe(false);
    expect(manifest.failedBrandIds).toEqual(["brand-1"]);
  });

  it("rejects unsafe brand IDs before a request", async () => {
    const outputDir = await createOutput();
    let requested = false;
    await expect(runBrandDetailExport({
      ...baseOptions(outputDir),
      brandIds: ["../outside"],
      fetchImpl: async () => {
        requested = true;
        return Response.json({});
      }
    })).rejects.toThrow("unsafe");
    expect(requested).toBe(false);
  });

  it("rejects unsafe nested identifiers", async () => {
    const outputDir = await createOutput();
    const manifest = await runBrandDetailExport({
      ...baseOptions(outputDir),
      fetchImpl: async () => Response.json({
        brand: { identifier: "brand-1", name: "Alpha" },
        supplier: { identifier: "../outside" }
      })
    });
    expect(manifest.complete).toBe(false);
    expect(manifest.failedBrandIds).toEqual(["brand-1"]);
  });

  it("resumes completed brand checkpoints without network calls", async () => {
    const outputDir = await createOutput();
    const options = baseOptions(outputDir);
    await runBrandDetailExport({
      ...options,
      fetchImpl: async () => Response.json({ brand: { identifier: "brand-1", name: "Alpha" } })
    });
    const resumed = await runBrandDetailExport({
      ...options,
      fetchImpl: async () => { throw new Error("completed brand must not be fetched"); }
    });
    expect(resumed.complete).toBe(true);
    expect(resumed.completedBrands).toBe(1);
  });
});
