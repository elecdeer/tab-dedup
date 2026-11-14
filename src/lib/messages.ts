import type { DuplicateTab } from "./duplicates";

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

export type Message = CheckDuplicatesMessage | SwitchToExistingMessage | CloseOthersMessage;

export interface CheckDuplicatesResponse {
  duplicates: DuplicateTab[];
}

/** Narrows an unknown runtime message to one of this extension's messages. */
export function isMessage(value: unknown): value is Message {
  if (typeof value !== "object" || value === null || !("type" in value)) return false;
  const { type } = value;
  return type === "check-duplicates" || type === "switch-to-existing" || type === "close-others";
}
