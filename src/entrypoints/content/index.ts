import { mount, unmount } from "svelte";
import type { ContentScriptContext } from "wxt/utils/content-script-context";
import type { DuplicateTab } from "@/lib/duplicates";
import { isShowUndoMessage, type CheckDuplicatesResponse, type Message } from "@/lib/messages";
import type { ClosedTab } from "@/lib/restore";
import { toPageKey } from "@/lib/url";
import DuplicateToast from "./DuplicateToast.svelte";
import UndoToast from "./UndoToast.svelte";

const DISMISSED_KEY_PREFIX = "tab-dedup:dismissed:";
/** The toast closes itself after this much time without hover or focus. */
const AUTO_DISMISS_MS = 8000;

type MountedApp = ReturnType<typeof mount>;

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

/** The toast currently on the page, so a new one replaces it instead of stacking. */
let removeCurrent: (() => void) | undefined;

/**
 * Shows a toast in a shadow root. `render` mounts the Svelte component and gets a `close`
 * function for the component's callbacks.
 */
async function showToast(
  ctx: ContentScriptContext,
  render: (target: HTMLElement, close: () => void) => MountedApp,
): Promise<void> {
  removeCurrent?.();
  const ui = await createShadowRootUi(ctx, {
    name: "tab-dedup-toast",
    // The toast positions itself with `position: fixed`; "inline" keeps WXT from adding
    // a full-page wrapper that would cover (and block clicks on) the page.
    position: "inline",
    anchor: "body",
    append: "last",
    onMount: (container) => render(container, close),
    onRemove(app) {
      if (app !== undefined) void unmount(app);
    },
  });
  function close(): void {
    ui.remove();
    if (removeCurrent === close) removeCurrent = undefined;
  }
  removeCurrent = close;
  ui.mount();
}

/**
 * Shows the toast that lets the user choose what to do with the duplicates.
 */
function showDuplicateToast(
  ctx: ContentScriptContext,
  pageKey: string,
  duplicates: DuplicateTab[],
  primary: DuplicateTab,
): Promise<void> {
  return showToast(ctx, (target, close) =>
    mount(DuplicateToast, {
      target,
      props: {
        duplicates,
        autoDismissMs: AUTO_DISMISS_MS,
        onSwitch: () => {
          void sendMessage({ type: "switch-to-existing", targetTabId: primary.id });
        },
        onCloseOthers: () => {
          void sendMessage({ type: "close-others", tabIds: duplicates.map((tab) => tab.id) });
          close();
        },
        onDismiss: () => {
          markDismissed(pageKey);
          close();
        },
        // Not marked as dismissed: timing out is not an explicit choice,
        // so a reload should offer the dialog again.
        onTimeout: close,
      },
    }),
  );
}

/**
 * Shows the toast that offers to undo an automatic switch or close.
 */
function showUndoToast(
  ctx: ContentScriptContext,
  text: string,
  closedTabs: ClosedTab[],
): Promise<void> {
  return showToast(ctx, (target, close) =>
    mount(UndoToast, {
      target,
      props: {
        text,
        autoDismissMs: AUTO_DISMISS_MS,
        onUndo: () => {
          void sendMessage({ type: "undo", closedTabs });
          close();
        },
        onClose: close,
      },
    }),
  );
}

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  runAt: "document_idle",
  cssInjectionMode: "ui",

  async main(ctx) {
    // Registered before any early return: this tab may be the one an automatic switch lands on.
    browser.runtime.onMessage.addListener((message: unknown) => {
      if (isShowUndoMessage(message)) void showUndoToast(ctx, message.text, message.closedTabs);
    });

    const pageKey = toPageKey(location.href);
    if (pageKey === null || isDismissed(pageKey)) return;

    const response = await sendMessage<CheckDuplicatesResponse | undefined>({
      type: "check-duplicates",
    });
    switch (response?.kind) {
      case "prompt": {
        const [primary] = response.duplicates;
        if (primary !== undefined) {
          await showDuplicateToast(ctx, pageKey, response.duplicates, primary);
        }
        return;
      }
      case "undo":
        await showUndoToast(ctx, response.text, response.closedTabs);
        return;
      case "none":
      case undefined:
        return;
    }
  },
});
