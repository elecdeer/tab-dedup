import { findDuplicateTabs, type DuplicateTab } from "@/lib/duplicates";
import {
  isMessage,
  type CheckDuplicatesResponse,
  type Message,
  type ShowUndoMessage,
} from "@/lib/messages";
import { planRestore, type ClosedTab } from "@/lib/restore";
import { resolveBehavior } from "@/lib/settings";
import { loadSettings } from "@/lib/settings-storage";
import { toOrigin } from "@/lib/url";

/**
 * Tabs reopened by "undo". They are duplicates by definition, so checking them again would just
 * redo the automatic action the user wanted to undo.
 * In memory only: the service worker is kept alive by the undo message that fills this set and by
 * the restored tab's check that drains it moments later.
 */
const restoredTabIds = new Set<number>();
/** Settles when the latest undo has finished registering its tabs in `restoredTabIds`. */
let pendingUndo: Promise<void> = Promise.resolve();

/**
 * Captures what is needed to reopen `tab` later, or `undefined` if it cannot be reopened.
 */
function toClosedTab(tab: Browser.tabs.Tab): ClosedTab | undefined {
  if (tab.url === undefined || tab.windowId === undefined) return undefined;
  return { url: tab.url, windowId: tab.windowId, index: tab.index };
}

/**
 * Focuses `targetTabId` (and its window) and closes `senderTabId`.
 */
async function switchToExisting(targetTabId: number, senderTabId: number): Promise<void> {
  const target = await browser.tabs.update(targetTabId, { active: true });
  if (target?.windowId !== undefined) {
    await browser.windows.update(target.windowId, { focused: true });
  }
  await browser.tabs.remove(senderTabId);
}

/**
 * Handles `check-duplicates`: applies the sender origin's rule and either asks the content script
 * to prompt, or performs the automatic action right away.
 */
async function checkDuplicates(
  senderTab: Browser.tabs.Tab & { id: number },
): Promise<CheckDuplicatesResponse> {
  // A restored tab may finish loading before `sessions.restore` resolves.
  await pendingUndo;
  if (restoredTabIds.delete(senderTab.id)) return { kind: "none" };

  const { url, windowId } = senderTab;
  if (url === undefined || windowId === undefined) return { kind: "none" };

  const behavior = resolveBehavior(await loadSettings(), toOrigin(url));
  if (behavior.action === "ignore") return { kind: "none" };

  const tabs = await browser.tabs.query({});
  const duplicates = findDuplicateTabs(tabs, { id: senderTab.id, url, windowId }, behavior);
  const [primary] = duplicates;
  if (primary === undefined) return { kind: "none" };

  switch (behavior.action) {
    case "prompt":
      return { kind: "prompt", duplicates };
    case "switch": {
      await autoSwitch(primary, senderTab);
      // The sender tab is gone, so there is nobody to answer.
      return { kind: "none" };
    }
    case "close-others":
      return autoCloseOthers(duplicates, tabs);
  }
}

/**
 * Switches to `primary`, closes the sender, and offers undo in the tab that was switched to.
 */
async function autoSwitch(
  primary: DuplicateTab,
  senderTab: Browser.tabs.Tab & { id: number },
): Promise<void> {
  const closed = toClosedTab(senderTab);
  await switchToExisting(primary.id, senderTab.id);
  if (closed === undefined) return;
  const message: ShowUndoMessage = {
    type: "show-undo",
    text: "同じページを開いていたので、このタブへ移動しました",
    closedTabs: [closed],
  };
  // The target tab may have no content script (opened before the extension was installed or
  // reloaded); then there is simply no undo offer.
  await browser.tabs.sendMessage(primary.id, message).catch(() => undefined);
}

/**
 * Closes the older duplicates and tells the sender to offer undo.
 */
async function autoCloseOthers(
  duplicates: readonly DuplicateTab[],
  tabs: readonly Browser.tabs.Tab[],
): Promise<CheckDuplicatesResponse> {
  const ids = new Set(duplicates.map((tab) => tab.id));
  const closedTabs = tabs
    .filter((tab) => tab.id !== undefined && ids.has(tab.id))
    .map(toClosedTab)
    .filter((tab) => tab !== undefined);
  await browser.tabs.remove([...ids]);
  return {
    kind: "undo",
    text: `同じページを開いていた古いタブを ${ids.size} 個閉じました`,
    closedTabs,
  };
}

/**
 * Brings back tabs closed by an automatic action, preferring session restore so history is kept.
 */
async function undo(closedTabs: readonly ClosedTab[]): Promise<void> {
  const sessions = await browser.sessions.getRecentlyClosed({ maxResults: 25 });
  const plan = planRestore(closedTabs, sessions);
  for (const sessionId of plan.sessionIds) {
    const restored = await browser.sessions.restore(sessionId);
    if (restored?.tab?.id !== undefined) restoredTabIds.add(restored.tab.id);
  }
  for (const tab of plan.reopen) {
    // The original window may have been closed since; fall back to the current window.
    const created = await browser.tabs
      .create({ url: tab.url, windowId: tab.windowId, index: tab.index })
      .catch(() => browser.tabs.create({ url: tab.url }));
    if (created.id !== undefined) restoredTabIds.add(created.id);
  }
}

/**
 * Handles a message from a content script and returns the response payload.
 */
async function handleMessage(
  message: Message,
  senderTab: Browser.tabs.Tab,
): Promise<CheckDuplicatesResponse | undefined> {
  const senderTabId = senderTab.id;
  if (senderTabId === undefined) return undefined;

  switch (message.type) {
    case "check-duplicates":
      return checkDuplicates({ ...senderTab, id: senderTabId });
    case "switch-to-existing":
      await switchToExisting(message.targetTabId, senderTabId);
      return undefined;
    case "close-others":
      await browser.tabs.remove(message.tabIds.filter((id) => id !== senderTabId));
      return undefined;
    case "undo":
      pendingUndo = undo(message.closedTabs).catch((error: unknown) => {
        console.error("[tab-dedup] failed to undo", error);
      });
      await pendingUndo;
      return undefined;
  }
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown, sender, sendResponse) => {
    const tab = sender.tab;
    if (!isMessage(message) || tab === undefined) return false;
    // Returning a Promise from the listener is not supported in every Chrome version,
    // so use the sendResponse + `return true` form to keep the channel open.
    handleMessage(message, tab).then(sendResponse, (error: unknown) => {
      console.error("[tab-dedup] failed to handle message", message, error);
      sendResponse(undefined);
    });
    return true;
  });
});
