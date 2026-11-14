import { toPageKey } from "./url";

/** The subset of a browser tab needed for duplicate detection. */
export interface TabLike {
  id?: number;
  url?: string;
  title?: string;
  windowId?: number;
  lastAccessed?: number;
}

/** A tab that shows the same page as the current one. */
export interface DuplicateTab {
  id: number;
  windowId: number;
  title: string;
  url: string;
}

/**
 * Finds tabs other than `currentTabId` that show the same page as `currentUrl`.
 * The result is ordered by most recently accessed first, so `[0]` is the best tab to switch to.
 */
export function findDuplicateTabs(
  tabs: readonly TabLike[],
  currentTabId: number,
  currentUrl: string,
): DuplicateTab[] {
  const key = toPageKey(currentUrl);
  if (key === null) return [];

  return tabs
    .filter(
      (tab): tab is TabLike & { id: number; url: string; windowId: number } =>
        tab.id !== undefined &&
        tab.id !== currentTabId &&
        tab.windowId !== undefined &&
        toPageKey(tab.url) === key,
    )
    .toSorted((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))
    .map((tab) => ({
      id: tab.id,
      windowId: tab.windowId,
      title: tab.title ?? tab.url,
      url: tab.url,
    }));
}
