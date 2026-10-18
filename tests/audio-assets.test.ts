import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, it } from "vitest";
import characters from "../src/data/kana.json";

it("ships a verified public-domain recording for every kana reading", () => {
  const directory = new URL("../public/audio/kana/", import.meta.url);
  const sources = JSON.parse(
    readFileSync(new URL("sources.json", directory), "utf8"),
  ) as {
    reading: string;
    file: string;
    author: string;
    license: string;
    source: string;
    bytes: number;
    sha256: string;
    processing: {
      originalSha256: string;
      trimStartSeconds: number;
      trimEndSeconds: number;
      gain: number;
    };
  }[];
  expect(sources.map((source) => source.reading).sort()).toEqual(
    [...new Set(characters.map((character) => character.reading))].sort(),
  );
  for (const source of sources) {
    expect(source.author).toBe("Hakatanoshio117117");
    expect(source.license).toBe("Public domain (PD-self)");
    expect(source.source).toMatch(
      /^https:\/\/commons.wikimedia.org\/wiki\/File:/,
    );
    expect(source.file).toBe(`${source.reading}-single.mp3`);
    expect(source.processing.originalSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(
      source.processing.trimEndSeconds - source.processing.trimStartSeconds,
    ).toBeLessThan(0.8);
    expect(source.processing.gain).toBeGreaterThan(0);
    const audio = readFileSync(new URL(source.file, directory));
    expect(audio.length, source.reading).toBe(source.bytes);
    expect(
      createHash("sha256").update(audio).digest("hex"),
      source.reading,
    ).toBe(source.sha256);
  }
});
