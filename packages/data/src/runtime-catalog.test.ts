import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { compactRuntimeCatalog } from "./runtime-catalog";

describe("compactRuntimeCatalog", () => {
  it("keeps all non-prescription brands but one prescription representative per composition", () => {
    const records = [
      { id: "otc-a", composition: "Paracetamol (500mg)", prescriptionRaw: "Not Mentioned" },
      { id: "otc-b", composition: "Paracetamol (500mg)", prescriptionRaw: "Not Mentioned" },
      { id: "rx-a", composition: "Paracetamol (500mg) + Phenylephrine (10mg)", prescriptionRaw: "Prescription Required" },
      { id: "rx-b", composition: "Phenylephrine (5mg) + Paracetamol (650mg)", prescriptionRaw: "Prescription Required" },
      { id: "rx-c", composition: "Ibuprofen (400mg)", prescriptionRaw: "Prescription Required" }
    ];

    expect(compactRuntimeCatalog(records).map((record) => record.id)).toEqual([
      "otc-a",
      "otc-b",
      "rx-a",
      "rx-c"
    ]);
  });

  it("keeps the committed runtime catalog free of unused price and source-row fields", () => {
    const records = JSON.parse(readFileSync(
      resolve(process.cwd(), "data/generated/seed_medicines.json"),
      "utf8"
    )) as Array<Record<string, unknown>>;

    expect(records.length).toBeGreaterThan(0);
    expect(records.every((record) =>
      !("mrp" in record) && !("price" in record) && !("rowNumber" in record)
    )).toBe(true);
  });
});
