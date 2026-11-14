import { describe, expect, it } from "vite-plus/test";
import { toPageKey } from "./url";

describe("toPageKey", () => {
  it("keeps origin and pathname", () => {
    expect(toPageKey("https://example.com/foo/bar")).toBe("https://example.com/foo/bar");
  });

  it("ignores the query string and hash", () => {
    expect(toPageKey("https://example.com/foo?a=1#top")).toBe("https://example.com/foo");
  });

  it("distinguishes different ports and schemes", () => {
    expect(toPageKey("http://example.com/")).not.toBe(toPageKey("https://example.com/"));
    expect(toPageKey("https://example.com:8443/")).not.toBe(toPageKey("https://example.com/"));
  });

  it("returns null for non-http(s) schemes", () => {
    expect(toPageKey("chrome://extensions/")).toBeNull();
    expect(toPageKey("file:///tmp/a.html")).toBeNull();
  });

  it("returns null for undefined or unparsable input", () => {
    expect(toPageKey(undefined)).toBeNull();
    expect(toPageKey("not a url")).toBeNull();
  });
});
