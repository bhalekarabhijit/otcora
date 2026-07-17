import { PassThrough } from "node:stream";
import { describe, expect, it } from "vitest";
import { readSecretLine } from "./secure-input";

describe("secure token input", () => {
  it("reads one line without echoing the secret", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    let displayed = "";
    output.on("data", (chunk) => { displayed += chunk.toString(); });

    const result = readSecretLine(input, output, "Token: ");
    input.write("very-secret-token\n");

    await expect(result).resolves.toBe("very-secret-token");
    expect(displayed).toBe("Token: \n");
    expect(displayed).not.toContain("very-secret-token");
  });
});
