import { describe, expect, it } from "vitest";
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
});
