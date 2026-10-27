import { describe, expect, it } from "vitest";
import { characters, lessons } from "../src/lib/content";
import {
  answerChoices,
  createQuestions,
  parseQuizOptions,
  quizKey,
} from "../src/lib/quiz";

describe("quiz question generation", () => {
  it("exhausts a selected pool before repeating and avoids adjacent repeats", () => {
    const pool = lessons[0].characters;
    for (let run = 0; run < 20; run++) {
      const questions = createQuestions(pool, 20);
      expect(questions).toHaveLength(20);
      for (let i = 0; i < 20; i += pool.length) {
        expect(
          new Set(questions.slice(i, i + pool.length).map((c) => c.id)).size,
        ).toBe(pool.length);
      }
      expect(
        questions.every((c, i) => !i || c.id !== questions[i - 1].id),
      ).toBe(true);
    }
    expect(createQuestions([], 10)).toEqual([]);
  });
  it("uses unique selected readings even with both scripts", () => {
    const pool = characters.filter((c) => c.lessonId.endsWith("-0"));
    for (const target of pool) {
      const choices = answerChoices(target, pool);
      expect(choices).toHaveLength(4);
      expect(new Set(choices).size).toBe(4);
      expect(choices).toContain(target.reading);
      expect(choices.every((r) => pool.some((c) => c.reading === r))).toBe(
        true,
      );
    }
  });
  it("does not introduce unselected readings for small rows", () => {
    const pool = lessons[7].characters;
    expect(pool).toHaveLength(3);
    expect(new Set(answerChoices(pool[0], pool))).toEqual(
      new Set(pool.map((c) => c.reading)),
    );
  });
  it("normalizes saved preferences and compares only equivalent configurations", () => {
    const options = parseQuizOptions({
      script: "invalid",
      rows: [2, 0, 2, -1, 99, "1"],
      count: 30,
      timed: "yes",
    });
    expect(options).toEqual({
      script: "hiragana",
      rows: [2, 0],
      count: 10,
      timed: true,
    });
    expect(quizKey(options)).toBe(quizKey({ ...options, rows: [0, 2] }));
    expect(quizKey(options)).not.toBe(quizKey({ ...options, timed: false }));
    expect(parseQuizOptions(undefined).timed).toBe(true);
    expect(parseQuizOptions({ timed: false }).timed).toBe(false);
  });
});
