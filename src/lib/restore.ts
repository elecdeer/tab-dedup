/** Enough about a tab this extension closed to bring it back. */
export interface ClosedTab {
  url: string;
  windowId: number;
  index: number;
}

/** The subset of a `sessions.Session` entry needed to find a closed tab. */
export interface SessionLike {
  tab?: { url?: string; sessionId?: string };
}

/** How each closed tab should be brought back. */
export interface RestorePlan {
  /** Session ids to pass to `sessions.restore`, which keeps the tab's history. */
  sessionIds: string[];
  /** Tabs no longer in the recently-closed list; they can only be reopened by URL. */
  reopen: ClosedTab[];
}

/**
 * Matches the tabs this extension closed against the browser's recently-closed list.
 * Matching is by URL because closed-session entries carry no tab id; each entry is used at most
 * once so two closed tabs with the same URL map to two different entries.
 */
export function planRestore(
  closedTabs: readonly ClosedTab[],
  sessions: readonly SessionLike[],
): RestorePlan {
  const used = new Set<string>();
  const sessionIds: string[] = [];
  const reopen: ClosedTab[] = [];

  for (const closed of closedTabs) {
    const match = sessions.find(
      (session) =>
        session.tab?.sessionId !== undefined &&
        !used.has(session.tab.sessionId) &&
        session.tab.url === closed.url,
    )?.tab?.sessionId;
    if (match === undefined) {
      reopen.push(closed);
    } else {
      used.add(match);
      sessionIds.push(match);
    }
  }

  return { sessionIds, reopen };
}
