import { describe, expect, it } from "vite-plus/test";
import { isMessage } from "./messages";

describe("isMessage", () => {
  it.each(["check-duplicates", "switch-to-existing", "close-others"])(
    "accepts a %s message",
    (type) => {
      expect(isMessage({ type })).toBe(true);
    },
  );

  it.each([null, undefined, "check-duplicates", {}, { type: "unknown" }])("rejects %o", (value) => {
    expect(isMessage(value)).toBe(false);
  });
});
