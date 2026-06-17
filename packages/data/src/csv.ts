export interface SeedMedicineRow {
  id?: string;
  name?: string;
  sourceUrl?: string;
  prescriptionStatus?: string;
  [key: string]: string | undefined;
}

export function parseCsv(content: string): SeedMedicineRow[] {
  const rows = parseRows(content);
  const [headers, ...body] = rows;
  if (!headers) {
    return [];
  }

  return body
    .filter((row) => row.some((cell) => cell.trim()))
    .map((row) => {
      const record: SeedMedicineRow = {};
      headers.forEach((header, index) => {
        record[normalizeHeader(header)] = row[index]?.trim();
      });
      return record;
    });
}

function parseRows(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (char === "\"" && quoted && next === "\"") {
      cell += "\"";
      index += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function normalizeHeader(header: string): string {
  const cleaned = header.trim().toLowerCase().replace(/[^a-z0-9]+(.)/g, (_, char: string) => char.toUpperCase());
  const aliases: Record<string, string> = {
    url: "sourceUrl",
    source: "sourceUrl",
    sourceUrl: "sourceUrl",
    medicineName: "name",
    productName: "name",
    prescriptionRequired: "prescriptionStatus"
  };
  return aliases[cleaned] ?? cleaned;
}
