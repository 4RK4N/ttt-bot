import { describe, expect, it } from "vitest";
import {
  extractSupportedPostUrls,
  isSupportedPostUrl,
  stripUrls,
} from "../bot/src/modules/links-pics-vids-autothread/urls.js";

describe("isSupportedPostUrl", () => {
  it("accepts x.com status links", () => {
    expect(isSupportedPostUrl("https://x.com/user/status/1234567890")).toBe(
      true,
    );
  });

  it("accepts bsky.app post links", () => {
    expect(
      isSupportedPostUrl("https://bsky.app/profile/user.bsky.social/post/abc"),
    ).toBe(true);
  });

  it("rejects unrelated hosts", () => {
    expect(isSupportedPostUrl("https://example.com/foo")).toBe(false);
  });
});

describe("extractSupportedPostUrls", () => {
  it("extracts only supported post URLs from mixed text", () => {
    const urls = extractSupportedPostUrls(
      "See https://x.com/user/status/1 and https://example.com/foo",
    );
    expect(urls).toEqual(["https://x.com/user/status/1"]);
  });
});

describe("stripUrls", () => {
  it("removes http URLs from text", () => {
    expect(stripUrls("Check https://x.com/user/status/1 now")).toBe(
      "Check now",
    );
  });

  it("collapses whitespace after stripping", () => {
    expect(stripUrls("  hello   https://example.com   world  ")).toBe(
      "hello world",
    );
  });
});
