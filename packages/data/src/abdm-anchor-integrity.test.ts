import { describe, expect, it } from "vitest";
import { fetchAnchorSnapshot } from "./abdm-anchor-export";

const options = (drugDetails: Array<Record<string, unknown>>) => ({
  accessToken: "test-token",
  baseUrl: "https://example.test/v1",
  pageSize: 500,
  fetchImpl: async () => Response.json({ drugDetails, drugsCount: drugDetails.length }),
  retry: { maxAttempts: 1, sleep: async () => undefined }
});

describe("ABDM anchor integrity", () => {
  it("rejects unsafe supplier anchors before a request", async () => {
    let requested = false;
    await expect(fetchAnchorSnapshot("../outside", {
      ...options([]),
      fetchImpl: async () => {
        requested = true;
        return Response.json({ drugDetails: [], drugsCount: 0 });
      }
    })).rejects.toThrow("unsafe");
    expect(requested).toBe(false);
  });

  it("rejects rows without brand identifiers", async () => {
    await expect(fetchAnchorSnapshot("supplier-1", options([
      { brandName: "Alpha", supplierIdentifier: "supplier-1" }
    ]))).rejects.toThrow("without brandIdentifier");
  });

  it("rejects duplicate brand identifiers", async () => {
    await expect(fetchAnchorSnapshot("supplier-1", options([
      { brandIdentifier: "brand-1", supplierIdentifier: "supplier-1" },
      { brandIdentifier: "brand-1", supplierIdentifier: "supplier-1" }
    ]))).rejects.toThrow("duplicate brand");
  });

  it("rejects unsafe discovered supplier identifiers", async () => {
    await expect(fetchAnchorSnapshot("supplier-1", options([
      { brandIdentifier: "brand-1", supplierIdentifier: "../outside" }
    ]))).rejects.toThrow("unsafe");
  });
});
