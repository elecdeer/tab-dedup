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

/** Options for {@link toPageKey}. */
export interface PageKeyOptions {
  /** Whether pages with different query strings count as different pages. */
  includeQuery?: boolean;
}

/**
 * Normalizes a URL into the key used to decide whether two tabs show the same page.
 * `origin` and `pathname` are always kept and the hash is always ignored. The query string is kept
 * only with `includeQuery`, with parameters sorted so that their order does not matter.
 * Returns `null` for unparsable URLs and non-http(s) schemes so they are never treated as duplicates.
 */
export function toPageKey(
  url: string | undefined,
  { includeQuery = false }: PageKeyOptions = {},
): string | null {
  const parsed = parseHttpUrl(url);
  if (parsed === null) return null;
  const base = `${parsed.origin}${parsed.pathname}`;
  if (!includeQuery) return base;
  parsed.searchParams.sort();
  return `${base}${parsed.search}`;
}

/**
 * Returns the origin that per-site rules are keyed by,
 * or `null` for unparsable URLs and non-http(s) schemes, which rules never apply to.
 */
export function toOrigin(url: string | undefined): string | null {
  return parseHttpUrl(url)?.origin ?? null;
}
