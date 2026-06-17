import { buildMedicineCatalog } from "./medicine-catalog";
import type { Medicine } from "./types";

export const medicines: Medicine[] = buildMedicineCatalog();

export function getMedicineById(id: string): Medicine | undefined {
  return medicines.find((medicine) => medicine.id === id);
}

export function searchMedicines(query: string, limit = 10): Medicine[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return medicines.slice(0, limit);
  }

  return medicines
    .filter((medicine) => {
      const haystack = [
        medicine.name,
        medicine.genericName,
        medicine.composition,
        medicine.manufacturer,
        medicine.form,
        ...medicine.indications
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    })
    .slice(0, limit);
}
