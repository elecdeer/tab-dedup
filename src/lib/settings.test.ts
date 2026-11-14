import { describe, expect, it } from "vite-plus/test";
import {
  DEFAULT_BEHAVIOR,
  DEFAULT_SETTINGS,
  parseSettings,
  resolveBehavior,
  type Behavior,
  type Settings,
} from "./settings";

describe("resolveBehavior", () => {
  const ignore: Behavior = { action: "ignore", scope: "current-window", includePinned: false };
  const settings: Settings = {
    defaults: DEFAULT_BEHAVIOR,
    rules: { "https://mail.example.com": ignore },
  };

  it("uses the origin's own rule when there is one", () => {
    expect(resolveBehavior(settings, "https://mail.example.com")).toBe(ignore);
  });

  it("falls back to the defaults for origins without a rule", () => {
    expect(resolveBehavior(settings, "https://example.com")).toBe(DEFAULT_BEHAVIOR);
  });

  it("falls back to the defaults when there is no origin", () => {
    expect(resolveBehavior(settings, null)).toBe(DEFAULT_BEHAVIOR);
  });
});

describe("parseSettings", () => {
  it("keeps valid settings as they are", () => {
    const settings: Settings = {
      defaults: { action: "switch", scope: "current-window", includePinned: false },
      rules: {
        "https://example.com": {
          action: "close-others",
          scope: "all-windows",
          includePinned: true,
        },
      },
    };

    expect(parseSettings(settings)).toEqual(settings);
  });

  it.each([undefined, null, "settings", 1])("returns the defaults for %o", (value) => {
    expect(parseSettings(value)).toEqual(DEFAULT_SETTINGS);
  });

  it("replaces invalid fields with the defaults", () => {
    const result = parseSettings({
      defaults: { action: "explode", scope: "current-window", includePinned: "yes" },
      rules: "nope",
    });

    expect(result).toEqual({
      defaults: { action: "prompt", scope: "current-window", includePinned: true },
      rules: {},
    });
  });

  it("fills missing rule fields from the stored defaults", () => {
    const result = parseSettings({
      defaults: { action: "ignore", scope: "current-window", includePinned: false },
      rules: { "https://example.com": { action: "switch" } },
    });

    expect(result.rules["https://example.com"]).toEqual({
      action: "switch",
      scope: "current-window",
      includePinned: false,
    });
  });
});
