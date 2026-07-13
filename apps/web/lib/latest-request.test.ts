import { describe, expect, it } from "vitest";
import { LatestRequest } from "./latest-request";

describe("LatestRequest", () => {
  it("aborts and rejects stale requests when a newer request starts", () => {
    const requests = new LatestRequest();
    const first = requests.start();
    const second = requests.start();

    expect(first.signal.aborted).toBe(true);
    expect(requests.isCurrent(first)).toBe(false);
    expect(requests.isCurrent(second)).toBe(true);
    expect(requests.finish(first)).toBe(false);
    expect(requests.finish(second)).toBe(true);
  });

  it("cancels the active request when the form changes", () => {
    const requests = new LatestRequest();
    const active = requests.start();

    requests.cancel();

    expect(active.signal.aborted).toBe(true);
    expect(requests.isCurrent(active)).toBe(false);
  });
});
