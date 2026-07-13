import { describe, expect, it } from "vitest";
import { POST } from "./route";

function request(body: string): Request {
  return new Request("http://localhost/api/recommendations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body
  });
}

describe("recommendation API", () => {
  it("returns a safe 400 response for malformed JSON", async () => {
    const response = await POST(request("{bad json"));
    expect(response.status).toBe(400);
  });

  it("requires adult eligibility confirmation", async () => {
    const response = await POST(request(JSON.stringify({ symptomIds: ["fever"], context: {} })));
    expect(response.status).toBe(400);
  });

  it("rejects unknown symptoms", async () => {
    const response = await POST(request(JSON.stringify({
      symptomIds: ["not-a-real-symptom"],
      context: { adultConfirmed: true }
    })));
    expect(response.status).toBe(400);
  });

  it("returns OTC examples and composition-only prescription context", async () => {
    const response = await POST(request(JSON.stringify({
      symptomIds: ["chest-congestion"],
      context: { adultConfirmed: true }
    })));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.otc.length).toBeGreaterThan(0);
    expect(payload.prescription).toHaveLength(0);
    expect(payload.prescriptionGroups.every((group: { products: unknown[] }) => group.products.length === 0)).toBe(true);
  });

  it("returns a guided fever plan and composition-only pharmacist context", async () => {
    const response = await POST(request(JSON.stringify({
      symptomIds: ["fever", "cold", "blocked-nose"],
      context: { adultConfirmed: true }
    })));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.treatmentPlans[0].steps.some((step: { purpose: string }) => step.purpose === "Fever discomfort")).toBe(true);
    expect(payload.pharmacistGroups.length).toBeGreaterThan(0);
    expect(payload.pharmacistGroups.every((group: { products: unknown[] }) => group.products.length === 0)).toBe(true);
  });
});
