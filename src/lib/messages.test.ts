import { describe, expect, it } from "vite-plus/test";
import { isMessage, isShowUndoMessage } from "./messages";

describe("isMessage", () => {
  it.each(["check-duplicates", "switch-to-existing", "close-others", "undo"])(
    "accepts a %s message",
    (type) => {
      expect(isMessage({ type })).toBe(true);
    },
  );

  it.each([null, undefined, "check-duplicates", {}, { type: "unknown" }, { type: "show-undo" }])(
    "rejects %o",
    (value) => {
      expect(isMessage(value)).toBe(false);
    },
  );
});

describe("isShowUndoMessage", () => {
  it("accepts a show-undo message", () => {
    expect(isShowUndoMessage({ type: "show-undo", text: "", closedTabs: [] })).toBe(true);
  });

  it.each([null, "show-undo", {}, { type: "undo" }])("rejects %o", (value) => {
    expect(isShowUndoMessage(value)).toBe(false);
  });
});
