import { describe, expect, it } from "vitest";
import { bangla, translate } from "../src/lib/i18n";
import { examples, stageDescriptions, stageNames } from "../src/lib/content";

describe("Bangla and English language support", () => {
  it("keeps English copy and Japanese readings intact", () => {
    expect(translate("en", "Write “{reading}”", { reading: "shi" })).toBe(
      "Write “shi”",
    );
    expect(translate("bn", "Write “{reading}”", { reading: "shi" })).toBe(
      "“shi” লেখো",
    );
    expect(translate("bn", "あ")).toBe("あ");
  });

  it("formats dynamic counts in the selected language", () => {
    expect(
      translate("bn", "Character {current} of {total}", {
        current: 2,
        total: 5,
      }),
    ).toBe("অক্ষর ২ / ৫");
    expect(translate("en", "{count} characters", { count: 5 })).toBe(
      "5 characters",
    );
    expect(translate("bn", "{count} characters", { count: 5 })).toBe(
      "৫টি অক্ষর",
    );
  });

  it("translates every stage instruction and vocabulary meaning", () => {
    for (const text of [
      ...stageNames,
      ...stageDescriptions,
      ...Object.values(examples).map((example) => example[1]),
    ]) {
      expect(bangla[text], `Missing Bangla translation: ${text}`).toBeTruthy();
    }
  });
});
