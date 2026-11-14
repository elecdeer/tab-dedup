/**
 * Normalizes a URL into the key used to decide whether two tabs show the same page.
 * Only `origin` and `pathname` are kept; query string and hash are ignored.
 * Returns `null` for unparsable URLs and non-http(s) schemes so they are never treated as duplicates.
 */
export function toPageKey(url: string | undefined): string | null {
  if (url === undefined) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return `${parsed.origin}${parsed.pathname}`;
}
