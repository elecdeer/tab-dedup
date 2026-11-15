import { describe, expect, it } from "vite-plus/test";
import {
  findDuplicateTabs,
  type CurrentTab,
  type DuplicateFilter,
  type TabLike,
} from "./duplicates";

describe("findDuplicateTabs", () => {
  const current: CurrentTab = { id: 1, windowId: 10, url: "https://example.com/page?x=1" };
  const everywhere: DuplicateFilter = {
    scope: "all-windows",
    includePinned: true,
    includeQuery: false,
  };

  it("returns other tabs showing the same page, ignoring query and hash", () => {
    // Given
    const tabs: TabLike[] = [
      current,
      { id: 2, windowId: 10, url: "https://example.com/page#section", title: "Page" },
      { id: 3, windowId: 10, url: "https://example.com/other" },
    ];

    // When
    const result = findDuplicateTabs(tabs, current, everywhere);

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

    const result = findDuplicateTabs(tabs, current, everywhere);

    expect(result.map((tab) => tab.id)).toEqual([3, 2, 4]);
  });

  it("only looks in the current window when the scope is current-window", () => {
    const tabs: TabLike[] = [
      current,
      { id: 2, windowId: 10, url: "https://example.com/page" },
      { id: 3, windowId: 20, url: "https://example.com/page" },
    ];

    const result = findDuplicateTabs(tabs, current, { ...everywhere, scope: "current-window" });

    expect(result.map((tab) => tab.id)).toEqual([2]);
  });

  it("skips pinned tabs unless they are included", () => {
    const tabs: TabLike[] = [
      current,
      { id: 2, windowId: 10, url: "https://example.com/page", pinned: true },
      { id: 3, windowId: 10, url: "https://example.com/page", pinned: false },
    ];

    expect(
      findDuplicateTabs(tabs, current, { ...everywhere, includePinned: false }).map((t) => t.id),
    ).toEqual([3]);
    expect(findDuplicateTabs(tabs, current, everywhere).map((t) => t.id)).toEqual([2, 3]);
  });

  it("requires the same query when includeQuery is set, regardless of parameter order", () => {
    const withQuery: CurrentTab = { id: 1, windowId: 10, url: "https://example.com/watch?v=a&t=1" };
    const tabs: TabLike[] = [
      withQuery,
      { id: 2, windowId: 10, url: "https://example.com/watch?t=1&v=a#top" },
      { id: 3, windowId: 10, url: "https://example.com/watch?v=b&t=1" },
      { id: 4, windowId: 10, url: "https://example.com/watch" },
    ];

    expect(
      findDuplicateTabs(tabs, withQuery, { ...everywhere, includeQuery: true }).map((t) => t.id),
    ).toEqual([2]);
    expect(findDuplicateTabs(tabs, withQuery, everywhere).map((t) => t.id)).toEqual([2, 3, 4]);
  });

  it("falls back to the URL when the tab has no title", () => {
    const tabs: TabLike[] = [current, { id: 2, windowId: 10, url: "https://example.com/page" }];

    const [duplicate] = findDuplicateTabs(tabs, current, everywhere);

    expect(duplicate?.title).toBe("https://example.com/page");
  });

  it("returns nothing for pages that cannot be keyed", () => {
    const tabs: TabLike[] = [
      { id: 1, windowId: 10, url: "chrome://newtab/" },
      { id: 2, windowId: 10, url: "chrome://newtab/" },
    ];

    expect(
      findDuplicateTabs(tabs, { id: 1, windowId: 10, url: "chrome://newtab/" }, everywhere),
    ).toEqual([]);
  });

  it("skips tabs without an id, window or URL", () => {
    const tabs: TabLike[] = [
      current,
      { windowId: 10, url: "https://example.com/page" },
      { id: 3, url: "https://example.com/page" },
      { id: 4, windowId: 10 },
    ];

    expect(findDuplicateTabs(tabs, current, everywhere)).toEqual([]);
  });
});
