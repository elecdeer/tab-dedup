import type { SearchScope } from "./settings";
import { toPageKey } from "./url";

/** The subset of a browser tab needed for duplicate detection. */
export interface TabLike {
  id?: number;
  url?: string;
  title?: string;
  windowId?: number;
  lastAccessed?: number;
  pinned?: boolean;
}

/** The tab whose duplicates are being looked for. */
export interface CurrentTab {
  id: number;
  url: string;
  windowId: number;
}

/** Which tabs may count as duplicates. */
export interface DuplicateFilter {
  scope: SearchScope;
  includePinned: boolean;
  /** Whether a different query string makes a different page. */
  includeQuery: boolean;
}

/** A tab that shows the same page as the current one. */
export interface DuplicateTab {
  id: number;
  windowId: number;
  title: string;
  url: string;
}

/**
 * Finds tabs other than `current` that show the same page and pass `filter`.
 * The result is ordered by most recently accessed first, so `[0]` is the best tab to switch to.
 */
export function findDuplicateTabs(
  tabs: readonly TabLike[],
  current: CurrentTab,
  filter: DuplicateFilter,
): DuplicateTab[] {
  const keyOptions = { includeQuery: filter.includeQuery };
  const key = toPageKey(current.url, keyOptions);
  if (key === null) return [];

  return tabs
    .filter(
      (tab): tab is TabLike & { id: number; url: string; windowId: number } =>
        tab.id !== undefined &&
        tab.id !== current.id &&
        tab.windowId !== undefined &&
        (filter.scope === "all-windows" || tab.windowId === current.windowId) &&
        (filter.includePinned || tab.pinned !== true) &&
        toPageKey(tab.url, keyOptions) === key,
    )
    .toSorted((a, b) => (b.lastAccessed ?? 0) - (a.lastAccessed ?? 0))
    .map((tab) => ({
      id: tab.id,
      windowId: tab.windowId,
      title: tab.title ?? tab.url,
      url: tab.url,
    }));
}
