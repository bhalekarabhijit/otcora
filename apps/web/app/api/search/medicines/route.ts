import { searchMedicines } from "@otcora/core";
import { NextResponse } from "next/server";
import { isPublicOtcMedicine, toPublicMedicine } from "../../../../lib/public-medicine";

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";
  return NextResponse.json({ medicines: searchMedicines(query, 50).filter(isPublicOtcMedicine).slice(0, 10).map(toPublicMedicine) });
}
