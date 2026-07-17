import { describe, expect, it } from "vitest";
import { normalizeBrandDetail } from "./abdm-finalize";

describe("ABDM final catalog normalization", () => {
  it("normalizes a nested brand detail into a catalog row", () => {
    expect(normalizeBrandDetail({
      brand: { identifier: "brand-1", name: "Alpha", licenseStatus: "ACTIVE" },
      generic: { identifier: "generic-1", name: "Example 10 mg tablet" },
      supplier: { identifier: "supplier-1", name: "Example Pharma" },
      substances: [{ identifier: "substance-1", name: "Example" }],
      routeOfAdministrations: [{ identifier: "route-1", name: "Oral route" }],
      doseForm: "Oral tablet",
      alternateDrugs: [{ brandIdentifier: "brand-2", brandName: "Beta" }]
    })).toMatchObject({
      brandIdentifier: "brand-1",
      brandName: "Alpha",
      licenseStatus: "ACTIVE",
      genericIdentifier: "generic-1",
      genericName: "Example 10 mg tablet",
      supplierIdentifier: "supplier-1",
      supplierName: "Example Pharma",
      substanceIdentifier: ["substance-1"],
      substanceName: ["Example"],
      routeOfAdministrationIdentifier: ["route-1"],
      routeOfAdministrationName: ["Oral route"],
      doseForm: "Oral tablet",
      alternativeDrugs: [{ brandIdentifier: "brand-2", brandName: "Beta" }]
    });
  });

  it("rejects a detail without a brand identifier", () => {
    expect(() => normalizeBrandDetail({ brand: { name: "Alpha" } })).toThrow("brand identifier");
  });
});
