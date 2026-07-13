interface RuntimeCatalogRecord {
  composition: string;
  prescriptionRaw?: string;
}

export function compactRuntimeCatalog<T extends RuntimeCatalogRecord>(records: T[]): T[] {
  const nonPrescription: T[] = [];
  const prescriptionByComposition = new Map<string, T>();

  for (const record of records) {
    if (!/prescription required/i.test(record.prescriptionRaw ?? "")) {
      nonPrescription.push(record);
      continue;
    }

    const key = record.composition
      .toLowerCase()
      .replace(/\s*\([^)]*\)/g, "")
      .split("+")
      .map((ingredient) => ingredient.trim())
      .filter(Boolean)
      .sort()
      .join("+");
    if (key && !prescriptionByComposition.has(key)) {
      prescriptionByComposition.set(key, record);
    }
  }

  return [...nonPrescription, ...prescriptionByComposition.values()];
}
