import { describe, expect, it } from "vite-plus/test";
import { findDuplicateTabs, type TabLike } from "./duplicates";

describe("findDuplicateTabs", () => {
  const current: TabLike = { id: 1, windowId: 10, url: "https://example.com/page?x=1" };

  it("returns other tabs showing the same page, ignoring query and hash", () => {
    // Given
    const tabs: TabLike[] = [
      current,
      { id: 2, windowId: 10, url: "https://example.com/page#section", title: "Page" },
      { id: 3, windowId: 10, url: "https://example.com/other" },
    ];

    // When
    const result = findDuplicateTabs(tabs, 1, current.url ?? "");

    // Then
    expect(result).toEqual([
      { id: 2, windowId: 10, title: "Page", url: "https://example.com/page#section" },
    ]);
  });

  it("orders duplicates by most recently accessed first", () => {
    const tabs: TabLike[] = [
      current,
      { id: 2, windowId: 10, url: "https://example.com/page", lastAccessed: 100 },
      { id: 3, windowId: 20, url: "https://example.com/page", lastAccessed: 300 },
      { id: 4, windowId: 10, url: "https://example.com/page" },
    ];

    const result = findDuplicateTabs(tabs, 1, current.url ?? "");

    expect(result.map((tab) => tab.id)).toEqual([3, 2, 4]);
  });

  it("falls back to the URL when the tab has no title", () => {
    const tabs: TabLike[] = [current, { id: 2, windowId: 10, url: "https://example.com/page" }];

    const [duplicate] = findDuplicateTabs(tabs, 1, current.url ?? "");

    expect(duplicate?.title).toBe("https://example.com/page");
  });

  it("returns nothing for pages that cannot be keyed", () => {
    const tabs: TabLike[] = [
      { id: 1, windowId: 10, url: "chrome://newtab/" },
      { id: 2, windowId: 10, url: "chrome://newtab/" },
    ];

    expect(findDuplicateTabs(tabs, 1, "chrome://newtab/")).toEqual([]);
  });

  it("skips tabs without an id, window or URL", () => {
    const tabs: TabLike[] = [
      current,
      { windowId: 10, url: "https://example.com/page" },
      { id: 3, url: "https://example.com/page" },
      { id: 4, windowId: 10 },
    ];

    expect(findDuplicateTabs(tabs, 1, current.url ?? "")).toEqual([]);
  });
});
