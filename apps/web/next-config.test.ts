import { describe, expect, it } from "vitest";
import { buildSecurityHeaders } from "./next.config";

function headerValue(environment: string, key: string): string | undefined {
  return buildSecurityHeaders(environment).find((header) => header.key === key)?.value;
}

describe("web security headers", () => {
  it("allows the Next.js development runtime without weakening production", () => {
    expect(headerValue("development", "Content-Security-Policy")).toContain("'unsafe-eval'");
    expect(headerValue("production", "Content-Security-Policy")).not.toContain("'unsafe-eval'");
  });

  it("only sends HSTS in production", () => {
    expect(headerValue("development", "Strict-Transport-Security")).toBeUndefined();
    expect(headerValue("production", "Strict-Transport-Security")).toContain("max-age=31536000");
  });
});
