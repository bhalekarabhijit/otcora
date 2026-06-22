import { searchMedicines } from "@otcora/core";
import { NextResponse } from "next/server";
import { toPublicMedicine } from "../../../../lib/public-medicine";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  return NextResponse.json({ medicines: searchMedicines(query).map(toPublicMedicine) });
}
