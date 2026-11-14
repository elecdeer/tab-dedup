import { findDuplicateTabs } from "@/lib/duplicates";
import { isMessage, type CheckDuplicatesResponse, type Message } from "@/lib/messages";

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
    case "check-duplicates": {
      if (senderTab.url === undefined) return { duplicates: [] };
      const tabs = await browser.tabs.query({});
      return { duplicates: findDuplicateTabs(tabs, senderTabId, senderTab.url) };
    }
    case "switch-to-existing": {
      const target = await browser.tabs.update(message.targetTabId, { active: true });
      if (target?.windowId !== undefined) {
        await browser.windows.update(target.windowId, { focused: true });
      }
      await browser.tabs.remove(senderTabId);
      return undefined;
    }
    case "close-others": {
      await browser.tabs.remove(message.tabIds.filter((id) => id !== senderTabId));
      return undefined;
    }
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
