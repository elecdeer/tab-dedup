import { mount, unmount } from "svelte";
import type { CheckDuplicatesResponse, Message } from "@/lib/messages";
import { toPageKey } from "@/lib/url";
import DuplicateToast from "./DuplicateToast.svelte";

const DISMISSED_KEY_PREFIX = "tab-dedup:dismissed:";

/**
 * Sends a typed message to the background script.
 */
function sendMessage<T = undefined>(message: Message): Promise<T> {
  return browser.runtime.sendMessage(message);
}

/**
 * Reports whether the user already chose "do nothing" for this page in this tab,
 * so that reloads do not show the dialog again.
 */
function isDismissed(pageKey: string): boolean {
  try {
    return sessionStorage.getItem(DISMISSED_KEY_PREFIX + pageKey) !== null;
  } catch {
    // sessionStorage can throw on sandboxed or opaque-origin pages.
    return false;
  }
}

/**
 * Remembers the "do nothing" choice for this page in this tab.
 */
function markDismissed(pageKey: string): void {
  try {
    sessionStorage.setItem(DISMISSED_KEY_PREFIX + pageKey, "1");
  } catch {
    // Best effort only; the dialog will simply reappear after a reload.
  }
}

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  runAt: "document_idle",
  cssInjectionMode: "ui",

  async main(ctx) {
    const pageKey = toPageKey(location.href);
    if (pageKey === null || isDismissed(pageKey)) return;

    const { duplicates } = await sendMessage<CheckDuplicatesResponse>({
      type: "check-duplicates",
    });
    const [primary] = duplicates;
    if (primary === undefined) return;

    const ui = await createShadowRootUi(ctx, {
      name: "tab-dedup-toast",
      // The toast positions itself with `position: fixed`; "inline" keeps WXT from adding
      // a full-page wrapper that would cover (and block clicks on) the page.
      position: "inline",
      anchor: "body",
      append: "last",
      onMount(container) {
        return mount(DuplicateToast, {
          target: container,
          props: {
            duplicates,
            onSwitch: () => {
              void sendMessage({ type: "switch-to-existing", targetTabId: primary.id });
            },
            onCloseOthers: () => {
              void sendMessage({ type: "close-others", tabIds: duplicates.map((tab) => tab.id) });
              ui.remove();
            },
            onDismiss: () => {
              markDismissed(pageKey);
              ui.remove();
            },
          },
        });
      },
      onRemove(app) {
        if (app !== undefined) void unmount(app);
      },
    });

    ui.mount();
  },
});
