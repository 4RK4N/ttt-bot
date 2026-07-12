import { describe, expect, it } from "vitest";
import {
  customEmojiCdnUrl,
  isCustomEmojiMarkup,
  isValidGuildEmojiName,
} from "../shared/core/discordEmoji.js";

describe("isValidGuildEmojiName", () => {
  it("accepts valid names", () => {
    expect(isValidGuildEmojiName("ab")).toBe(true);
    expect(isValidGuildEmojiName("my_emoji_2")).toBe(true);
    expect(isValidGuildEmojiName("A".repeat(32))).toBe(true);
  });

  it("rejects invalid names", () => {
    expect(isValidGuildEmojiName("a")).toBe(false);
    expect(isValidGuildEmojiName("A".repeat(33))).toBe(false);
    expect(isValidGuildEmojiName("bad-name")).toBe(false);
    expect(isValidGuildEmojiName("has space")).toBe(false);
    expect(isValidGuildEmojiName("")).toBe(false);
  });
});

describe("customEmojiCdnUrl", () => {
  it("builds static png URL", () => {
    expect(customEmojiCdnUrl("123456789012345678", false)).toBe(
      "https://cdn.discordapp.com/emojis/123456789012345678.png",
    );
  });

  it("builds animated gif URL", () => {
    expect(customEmojiCdnUrl("123456789012345678", true)).toBe(
      "https://cdn.discordapp.com/emojis/123456789012345678.gif",
    );
  });
});

describe("isCustomEmojiMarkup", () => {
  it("returns true for custom emoji markup", () => {
    expect(isCustomEmojiMarkup("<:test:123456789012345678>")).toBe(true);
    expect(isCustomEmojiMarkup("<a:wave:987654321098765432>")).toBe(true);
  });

  it("returns false for unicode emoji", () => {
    expect(isCustomEmojiMarkup("😀")).toBe(false);
    expect(isCustomEmojiMarkup("")).toBe(false);
  });
});
