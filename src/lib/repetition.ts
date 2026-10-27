import type { Attempt } from "./types";

export type RepetitionOptions = {
  count: 5 | 10 | 20;
  start: "guided" | "memory";
};
export type PracticeStage = 0 | 1 | 2;

export function parseRepetition(
  count: string | null,
  start: string | null,
): RepetitionOptions {
  return {
    count: count === "10" ? 10 : count === "20" ? 20 : 5,
    start: start === "memory" ? "memory" : "guided",
  };
}

export function repetitionStages(options: RepetitionOptions): PracticeStage[] {
  if (options.start === "memory")
    return Array<PracticeStage>(options.count).fill(2);
  const [guide, outline] =
    options.count === 20 ? [3, 5] : options.count === 10 ? [2, 3] : [1, 2];
  return [
    ...Array<PracticeStage>(guide).fill(0),
    ...Array<PracticeStage>(outline).fill(1),
    ...Array<PracticeStage>(options.count - guide - outline).fill(2),
  ];
}

// Several successful recalls in one repetition session count as one review.
export function independentReviewCount(
  attempts: Attempt[],
  characterId: string,
): number {
  return new Set(
    attempts
      .filter(
        (a) =>
          a.characterId === characterId &&
          a.independent &&
          a.practiceStage !== 0 &&
          a.practiceStage !== 1,
      )
      .map((a) => a.sessionId ?? a.completedAt),
  ).size;
}
