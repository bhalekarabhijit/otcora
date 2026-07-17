import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runGenericFamilyExport } from "./abdm-generic-runner";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

const createOutput = async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "otcora-abdm-generics-"));
  temporaryDirectories.push(outputDir);
  return outputDir;
};

const baseOptions = (outputDir: string) => ({
  accessToken: "test-token",
  baseUrl: "https://example.test/v1",
  genericIds: ["generic-1"],
  outputDir,
  pageSize: 500,
  concurrency: 1,
  retry: { maxAttempts: 1, sleep: async () => undefined }
});

describe("ABDM generic family export", () => {
  it("exports full generic families and accepts the observed totalCount plus target row", async () => {
    const outputDir = await createOutput();
    const manifest = await runGenericFamilyExport({
      ...baseOptions(outputDir),
      fetchImpl: async () => Response.json({
        generic: { identifier: "generic-1", name: "Example 10 mg tablet" },
        totalCount: 2,
        alternateDrugs: [
          { brandIdentifier: "brand-1", brandName: "Alpha" },
          { brandIdentifier: "brand-2", brandName: "Beta" },
          { brandIdentifier: "brand-3", brandName: "Gamma" }
        ]
      })
    });
    expect(manifest).toMatchObject({
      totalGenerics: 1,
      completedGenerics: 1,
      failedGenericIds: [],
      referencedBrands: 3,
      complete: true
    });
  });

  it("does not hide a truncated family", async () => {
    const outputDir = await createOutput();
    const manifest = await runGenericFamilyExport({
      ...baseOptions(outputDir),
      fetchImpl: async () => Response.json({
        generic: { identifier: "generic-1" },
        totalCount: 2,
        alternateDrugs: [{ brandIdentifier: "brand-1" }]
      })
    });
    expect(manifest.complete).toBe(false);
    expect(manifest.failedGenericIds).toEqual(["generic-1"]);
  });

  it("rejects a response for the wrong generic", async () => {
    const outputDir = await createOutput();
    const manifest = await runGenericFamilyExport({
      ...baseOptions(outputDir),
      fetchImpl: async () => Response.json({
        generic: { identifier: "generic-2" },
        totalCount: 1,
        alternateDrugs: [{ brandIdentifier: "brand-1" }]
      })
    });
    expect(manifest.complete).toBe(false);
    expect(manifest.failedGenericIds).toEqual(["generic-1"]);
  });

  it("rejects unsafe generic IDs before a request", async () => {
    const outputDir = await createOutput();
    let requested = false;
    await expect(runGenericFamilyExport({
      ...baseOptions(outputDir),
      genericIds: ["../outside"],
      fetchImpl: async () => {
        requested = true;
        return Response.json({});
      }
    })).rejects.toThrow("unsafe");
    expect(requested).toBe(false);
  });

  it("resumes completed generic checkpoints without network calls", async () => {
    const outputDir = await createOutput();
    const options = baseOptions(outputDir);
    await runGenericFamilyExport({
      ...options,
      fetchImpl: async () => Response.json({
        generic: { identifier: "generic-1" },
        totalCount: 1,
        alternateDrugs: [{ brandIdentifier: "brand-1" }]
      })
    });
    const resumed = await runGenericFamilyExport({
      ...options,
      fetchImpl: async () => { throw new Error("completed generic must not be fetched"); }
    });
    expect(resumed.complete).toBe(true);
    expect(resumed.completedGenerics).toBe(1);
  });
});
