import { describe, expect, it } from "vitest";
import {
  independentReviewCount,
  parseRepetition,
  repetitionStages,
} from "../src/lib/repetition";
import type { Attempt } from "../src/lib/types";

describe("repeated writing plans", () => {
  it.each([
    [5, 1, 2, 2],
    [10, 2, 3, 5],
    [20, 3, 5, 12],
  ] as const)("plans %i complete writings", (count, guide, outline, memory) => {
    const stages = repetitionStages({ count, start: "guided" });
    expect(stages).toHaveLength(count);
    expect(stages.filter((s) => s === 0)).toHaveLength(guide);
    expect(stages.filter((s) => s === 1)).toHaveLength(outline);
    expect(stages.filter((s) => s === 2)).toHaveLength(memory);
    expect(stages).toEqual([...stages].sort());
    expect(repetitionStages({ count, start: "memory" })).toEqual(
      Array(count).fill(2),
    );
  });
  it("uses safe defaults for invalid URLs", () => {
    expect(parseRepetition("999", "invalid")).toEqual({
      count: 5,
      start: "guided",
    });
    expect(parseRepetition("20", "memory")).toEqual({
      count: 20,
      start: "memory",
    });
  });
  it("counts one review per repetition session and preserves legacy assessments", () => {
    const base: Attempt = {
      characterId: "a",
      completedAt: "2026-10-28T12:00:00Z",
      day: "2026-10-28",
      independent: true,
      retries: 0,
      hints: 0,
    };
    const attempts: Attempt[] = [
      base,
      ...Array.from({ length: 5 }, (_, i) => ({
        ...base,
        completedAt: `2026-10-28T12:00:0${i + 1}Z`,
        sessionId: "session1",
        practiceStage: 2 as const,
      })),
      { ...base, sessionId: "session2", practiceStage: 2 },
      { ...base, independent: false, practiceStage: 0 },
    ];
    expect(independentReviewCount(attempts, "a")).toBe(3);
    expect(independentReviewCount(attempts, "other")).toBe(0);
  });
});
