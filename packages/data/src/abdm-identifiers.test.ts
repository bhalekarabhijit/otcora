import { describe, expect, it } from "vitest";
import { assertSafeRegistryId } from "./abdm-identifiers";

describe("ABDM registry identifiers", () => {
  it.each(["1234567890", "supplier-1", "generic_2", "brand.3"])("accepts safe identifier %s", (id) => {
    expect(assertSafeRegistryId(id, "test")).toBe(id);
  });

  it.each(["", ".", "..", "../outside", "a/b", "a\\b", "/absolute", "a%2fb", "two words"])(
    "rejects unsafe identifier %s",
    (id) => expect(() => assertSafeRegistryId(id, "test")).toThrow("unsafe")
  );
});
