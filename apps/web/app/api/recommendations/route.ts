import { recommendMedicines, type RecommendationRequest } from "@otcora/core";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = (await request.json()) as RecommendationRequest;
  if (!Array.isArray(body.symptomIds)) {
    return NextResponse.json({ error: "symptomIds must be an array." }, { status: 400 });
  }
  return NextResponse.json(recommendMedicines(body));
}
