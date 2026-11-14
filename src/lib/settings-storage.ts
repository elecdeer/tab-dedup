import { DEFAULT_SETTINGS, parseSettings, type Behavior, type Settings } from "./settings";

// `sync` so that rules follow the user across browsers signed in to the same profile.
// The raw value is `unknown` because storage may hold data from other versions; it is
// always passed through `parseSettings` before use.
const settingsItem = storage.defineItem<unknown>("sync:settings", { fallback: DEFAULT_SETTINGS });

/**
 * Loads the current settings.
 */
export async function loadSettings(): Promise<Settings> {
  return parseSettings(await settingsItem.getValue());
}

/**
 * Replaces the stored settings.
 */
export async function saveSettings(settings: Settings): Promise<void> {
  await settingsItem.setValue(settings);
}

/**
 * Sets (or with `undefined`, removes) the rule for `origin`.
 */
export async function setRule(origin: string, rule: Behavior | undefined): Promise<Settings> {
  const current = await loadSettings();
  const { [origin]: _removed, ...rest } = current.rules;
  const next: Settings = {
    ...current,
    rules: rule === undefined ? rest : { ...rest, [origin]: rule },
  };
  await saveSettings(next);
  return next;
}

/**
 * Calls `callback` whenever the settings change (from any page of the extension).
 * Returns a function that stops watching.
 */
export function watchSettings(callback: (settings: Settings) => void): () => void {
  return settingsItem.watch((value) => callback(parseSettings(value)));
}
