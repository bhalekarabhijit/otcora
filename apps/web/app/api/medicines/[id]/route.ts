import { getMedicineById } from "@otcora/core";
import { NextResponse } from "next/server";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const medicine = getMedicineById(id);
  if (!medicine) {
    return NextResponse.json({ error: "Medicine not found." }, { status: 404 });
  }
  return NextResponse.json({ medicine });
}
