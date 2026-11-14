/**
 * Parses `url`, returning `null` for unparsable URLs and non-http(s) schemes.
 */
function parseHttpUrl(url: string | undefined): URL | null {
  if (url === undefined) return null;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return parsed;
}

/**
 * Normalizes a URL into the key used to decide whether two tabs show the same page.
 * Only `origin` and `pathname` are kept; query string and hash are ignored.
 * Returns `null` for unparsable URLs and non-http(s) schemes so they are never treated as duplicates.
 */
export function toPageKey(url: string | undefined): string | null {
  const parsed = parseHttpUrl(url);
  return parsed === null ? null : `${parsed.origin}${parsed.pathname}`;
}

/**
 * Returns the origin that per-site rules are keyed by,
 * or `null` for unparsable URLs and non-http(s) schemes, which rules never apply to.
 */
export function toOrigin(url: string | undefined): string | null {
  return parseHttpUrl(url)?.origin ?? null;
}
