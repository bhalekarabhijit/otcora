import type { BrandDetailPayload } from "./abdm-brand-runner";
import type { AbdmDrugRow } from "./abdm-export";

function definedStrings(values: Array<string | undefined>) {
  return values.filter((value): value is string => typeof value === "string" && value.length > 0);
}

export function normalizeBrandDetail(payload: BrandDetailPayload): AbdmDrugRow {
  const brandIdentifier = payload.brand?.identifier;
  if (!brandIdentifier) throw new Error("ABDM detail has no brand identifier.");
  const row: AbdmDrugRow = {
    brandIdentifier,
    substanceIdentifier: definedStrings((payload.substances ?? []).map((substance) => substance.identifier)),
    substanceName: definedStrings((payload.substances ?? []).map((substance) => substance.name)),
    routeOfAdministrationIdentifier: definedStrings(
      (payload.routeOfAdministrations ?? []).map((route) => route.identifier)
    ),
    routeOfAdministrationName: definedStrings((payload.routeOfAdministrations ?? []).map((route) => route.name)),
    alternativeDrugs: payload.alternateDrugs ?? []
  };
  if (payload.brand?.name) row.brandName = payload.brand.name;
  if (payload.brand?.licenseStatus) row.licenseStatus = payload.brand.licenseStatus;
  if (payload.generic?.identifier) row.genericIdentifier = payload.generic.identifier;
  if (payload.generic?.name) row.genericName = payload.generic.name;
  if (payload.supplier?.identifier) row.supplierIdentifier = payload.supplier.identifier;
  if (payload.supplier?.name) row.supplierName = payload.supplier.name;
  if (payload.doseForm) row.doseForm = payload.doseForm;
  return row;
}

function richness(row: AbdmDrugRow) {
  return Object.values(row).filter((value) => value !== undefined && value !== null && value !== "").length;
}

export function mergeBrandRow(brands: Map<string, AbdmDrugRow>, row: AbdmDrugRow) {
  if (!row.brandIdentifier) throw new Error("Cannot merge an ABDM row without a brand identifier.");
  const current = brands.get(row.brandIdentifier);
  if (!current) {
    brands.set(row.brandIdentifier, row);
    return;
  }
  const richer = richness(row) >= richness(current) ? row : current;
  const other = richer === row ? current : row;
  brands.set(row.brandIdentifier, { ...other, ...richer });
}
