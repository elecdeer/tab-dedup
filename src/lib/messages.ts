import type { DuplicateTab } from "./duplicates";
import type { ClosedTab } from "./restore";

/** Asks the background which other tabs show the same page as the sender tab. */
export interface CheckDuplicatesMessage {
  type: "check-duplicates";
}

/** Focuses the existing tab and closes the sender (new) tab. */
export interface SwitchToExistingMessage {
  type: "switch-to-existing";
  targetTabId: number;
}

/** Closes the existing duplicate tabs and keeps the sender (new) tab. */
export interface CloseOthersMessage {
  type: "close-others";
  tabIds: number[];
}

/** Brings back tabs that were closed automatically. */
export interface UndoMessage {
  type: "undo";
  closedTabs: ClosedTab[];
}

/** Content script → background messages. */
export type Message =
  | CheckDuplicatesMessage
  | SwitchToExistingMessage
  | CloseOthersMessage
  | UndoMessage;

/** Background → content script: tells the tab to offer undoing an automatic action. */
export interface ShowUndoMessage {
  type: "show-undo";
  text: string;
  closedTabs: ClosedTab[];
}

/**
 * What the content script should show after `check-duplicates`.
 * - `none`: nothing (no duplicates, the site is ignored, or this tab is being closed)
 * - `prompt`: the choice toast
 * - `undo`: an automatic action already happened; offer to undo it
 */
export type CheckDuplicatesResponse =
  | { kind: "none" }
  | { kind: "prompt"; duplicates: DuplicateTab[] }
  | { kind: "undo"; text: string; closedTabs: ClosedTab[] };

/** Narrows an unknown runtime message to one of the content → background messages. */
export function isMessage(value: unknown): value is Message {
  if (typeof value !== "object" || value === null || !("type" in value)) return false;
  const { type } = value;
  return (
    type === "check-duplicates" ||
    type === "switch-to-existing" ||
    type === "close-others" ||
    type === "undo"
  );
}

/** Narrows an unknown runtime message to a background → content `show-undo` message. */
export function isShowUndoMessage(value: unknown): value is ShowUndoMessage {
  return (
    typeof value === "object" && value !== null && "type" in value && value.type === "show-undo"
  );
}
