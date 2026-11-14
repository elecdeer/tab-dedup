/** What to do when a newly loaded page is already open in another tab. */
export type DuplicateAction = "prompt" | "ignore" | "switch" | "close-others";

/** Which tabs are searched for duplicates. */
export type SearchScope = "all-windows" | "current-window";

/** How duplicates are handled on one site (or by default). */
export interface Behavior {
  action: DuplicateAction;
  scope: SearchScope;
  /** Whether pinned tabs count as duplicates. */
  includePinned: boolean;
}

/** Everything the user can configure. */
export interface Settings {
  /** Used for every origin that has no rule of its own. */
  defaults: Behavior;
  /** Per-origin overrides, keyed by `URL#origin` (e.g. `https://example.com`). */
  rules: Record<string, Behavior>;
}

export const DUPLICATE_ACTIONS: readonly DuplicateAction[] = [
  "prompt",
  "ignore",
  "switch",
  "close-others",
];

export const SEARCH_SCOPES: readonly SearchScope[] = ["all-windows", "current-window"];

/** Labels shown in the options page and popup. */
export const ACTION_LABELS: Record<DuplicateAction, string> = {
  prompt: "通知を表示して選ぶ",
  ignore: "何もしない",
  switch: "自動で既存のタブへ移動",
  "close-others": "自動で古いタブを閉じる",
};

export const SCOPE_LABELS: Record<SearchScope, string> = {
  "all-windows": "すべてのウィンドウ",
  "current-window": "同じウィンドウのみ",
};

/** The behavior before this extension had settings; kept as the out-of-the-box default. */
export const DEFAULT_BEHAVIOR: Behavior = {
  action: "prompt",
  scope: "all-windows",
  includePinned: true,
};

export const DEFAULT_SETTINGS: Settings = { defaults: DEFAULT_BEHAVIOR, rules: {} };

/**
 * Returns the behavior for `origin`: its own rule if there is one, otherwise the defaults.
 */
export function resolveBehavior(settings: Settings, origin: string | null): Behavior {
  if (origin === null) return settings.defaults;
  return settings.rules[origin] ?? settings.defaults;
}

/**
 * Reads a behavior from untrusted storage data, filling invalid or missing fields from `fallback`.
 */
function parseBehavior(value: unknown, fallback: Behavior): Behavior {
  if (typeof value !== "object" || value === null) return fallback;
  const action: unknown = "action" in value ? value.action : undefined;
  const scope: unknown = "scope" in value ? value.scope : undefined;
  const includePinned: unknown = "includePinned" in value ? value.includePinned : undefined;
  return {
    action: DUPLICATE_ACTIONS.find((a) => a === action) ?? fallback.action,
    scope: SEARCH_SCOPES.find((s) => s === scope) ?? fallback.scope,
    includePinned: typeof includePinned === "boolean" ? includePinned : fallback.includePinned,
  };
}

/**
 * Reads settings from untrusted storage data.
 * Storage written by an older or newer version (or edited by hand) must never break the extension,
 * so anything unrecognized falls back to the defaults instead of throwing.
 */
export function parseSettings(value: unknown): Settings {
  if (typeof value !== "object" || value === null) return DEFAULT_SETTINGS;
  const defaults = parseBehavior(
    "defaults" in value ? value.defaults : undefined,
    DEFAULT_BEHAVIOR,
  );
  const rawRules: unknown = "rules" in value ? value.rules : undefined;
  const rules: Record<string, Behavior> = {};
  if (typeof rawRules === "object" && rawRules !== null) {
    for (const [origin, rule] of Object.entries(rawRules)) {
      rules[origin] = parseBehavior(rule, defaults);
    }
  }
  return { defaults, rules };
}
