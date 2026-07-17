import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { runSubstanceDetailExport } from "./abdm-substance-runner";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

const createOutput = async () => {
  const outputDir = await mkdtemp(join(tmpdir(), "otcora-abdm-substances-"));
  temporaryDirectories.push(outputDir);
  return outputDir;
};

const baseOptions = (outputDir: string) => ({
  accessToken: "test-token",
  baseUrl: "https://example.test/v1",
  substanceIds: ["substance-1"],
  outputDir,
  concurrency: 1,
  retry: { maxAttempts: 1, sleep: async () => undefined }
});

describe("ABDM substance detail export", () => {
  it("exports a matching substance detail", async () => {
    const outputDir = await createOutput();
    const manifest = await runSubstanceDetailExport({
      ...baseOptions(outputDir),
      fetchImpl: async () => Response.json({ substanceIdentifier: "substance-1", substanceName: "Example" })
    });
    expect(manifest).toMatchObject({ totalSubstances: 1, completedSubstances: 1, failedSubstanceIds: [], complete: true });
  });

  it("rejects a mismatched substance detail", async () => {
    const outputDir = await createOutput();
    const manifest = await runSubstanceDetailExport({
      ...baseOptions(outputDir),
      fetchImpl: async () => Response.json({ substanceIdentifier: "substance-2" })
    });
    expect(manifest.complete).toBe(false);
    expect(manifest.failedSubstanceIds).toEqual(["substance-1"]);
  });

  it("rejects unsafe substance IDs before a request", async () => {
    const outputDir = await createOutput();
    let requested = false;
    await expect(runSubstanceDetailExport({
      ...baseOptions(outputDir),
      substanceIds: ["../outside"],
      fetchImpl: async () => {
        requested = true;
        return Response.json({});
      }
    })).rejects.toThrow("unsafe");
    expect(requested).toBe(false);
  });

  it("resumes completed substance checkpoints without network calls", async () => {
    const outputDir = await createOutput();
    const options = baseOptions(outputDir);
    await runSubstanceDetailExport({
      ...options,
      fetchImpl: async () => Response.json({ substanceIdentifier: "substance-1" })
    });
    const resumed = await runSubstanceDetailExport({
      ...options,
      fetchImpl: async () => { throw new Error("completed substance must not be fetched"); }
    });
    expect(resumed.complete).toBe(true);
    expect(resumed.completedSubstances).toBe(1);
  });
});
