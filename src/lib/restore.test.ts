import { describe, expect, it } from "vite-plus/test";
import { planRestore, type ClosedTab } from "./restore";

describe("planRestore", () => {
  const closedA: ClosedTab = { url: "https://example.com/a", windowId: 1, index: 0 };
  const closedB: ClosedTab = { url: "https://example.com/b", windowId: 1, index: 1 };

  it("restores closed tabs from their recently-closed session entries", () => {
    const result = planRestore(
      [closedA, closedB],
      [
        { tab: { url: "https://example.com/b", sessionId: "s2" } },
        { tab: { url: "https://example.com/a", sessionId: "s1" } },
      ],
    );

    expect(result).toEqual({ sessionIds: ["s1", "s2"], reopen: [] });
  });

  it("uses each session entry only once for tabs with the same URL", () => {
    const result = planRestore(
      [closedA, { ...closedA, index: 3 }],
      [
        { tab: { url: "https://example.com/a", sessionId: "s1" } },
        { tab: { url: "https://example.com/a", sessionId: "s2" } },
      ],
    );

    expect(result.sessionIds).toEqual(["s1", "s2"]);
  });

  it("reopens tabs that are no longer in the recently-closed list", () => {
    const result = planRestore(
      [closedA, closedB],
      [{ tab: { url: "https://example.com/a", sessionId: "s1" } }, {}],
    );

    expect(result).toEqual({ sessionIds: ["s1"], reopen: [closedB] });
  });
});
