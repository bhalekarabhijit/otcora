import { isSymptomId, recommendMedicines, type RecommendationRequest, type UserContext } from "@otcora/core";
import { NextResponse } from "next/server";
import { toPublicRecommendationResponse } from "../../../lib/public-medicine";

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return NextResponse.json({ error: "Request is too large." }, { status: 413 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = parseRecommendationRequest(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  return NextResponse.json(toPublicRecommendationResponse(recommendMedicines(parsed.value)), {
    headers: { "Cache-Control": "no-store" }
  });
}

type ParseResult = { ok: true; value: RecommendationRequest } | { ok: false; error: string };

function parseRecommendationRequest(value: unknown): ParseResult {
  if (!isRecord(value) || !Array.isArray(value.symptomIds)) {
    return { ok: false, error: "Choose between one and five symptoms." };
  }

  const symptomIds = [...new Set(value.symptomIds)];
  if (symptomIds.length < 1 || symptomIds.length > 5 || symptomIds.some((id) => typeof id !== "string" || !isSymptomId(id))) {
    return { ok: false, error: "One or more symptoms are invalid." };
  }

  if (!isRecord(value.context) || value.context.adultConfirmed !== true) {
    return { ok: false, error: "Confirm that this search is for an adult aged 18 to 64 who is not pregnant or breastfeeding." };
  }

  const context: UserContext = { adultConfirmed: true };
  if (value.context.allergies !== undefined) {
    if (!Array.isArray(value.context.allergies)
      || value.context.allergies.length > 10
      || value.context.allergies.some((allergy) => typeof allergy !== "string" || allergy.trim().length < 1 || allergy.length > 80)) {
      return { ok: false, error: "Medicine allergies must be a short comma-separated list." };
    }
    context.allergies = value.context.allergies.map((allergy) => allergy.trim());
  }

  return { ok: true, value: { symptomIds: symptomIds as string[], context } };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
