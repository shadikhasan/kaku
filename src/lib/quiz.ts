import type { Character } from "./types";

export type QuizOptions = {
  script: "hiragana" | "katakana" | "mixed";
  rows: number[];
  count: 10 | 20;
  timed: boolean;
};
export type QuizAnswer = {
  characterId: string;
  correct: boolean;
  reading: string | null;
};
export type QuizResult = {
  id?: number;
  completedAt: string;
  configuration: string;
  score: number;
  total: number;
  combo: number;
  answers: QuizAnswer[];
};

export const defaultQuizOptions: QuizOptions = {
  script: "hiragana",
  rows: [0],
  count: 10,
  timed: false,
};

export function parseQuizOptions(value: unknown): QuizOptions {
  if (!value || typeof value !== "object") return defaultQuizOptions;
  const v = value as Partial<QuizOptions>;
  return {
    script:
      v.script === "katakana" || v.script === "mixed" ? v.script : "hiragana",
    rows: Array.isArray(v.rows)
      ? [
          ...new Set(
            v.rows.filter((n) => Number.isInteger(n) && n >= 0 && n < 10),
          ),
        ]
      : [0],
    count: v.count === 20 ? 20 : 10,
    timed: v.timed === true,
  };
}

export function shuffle<T>(items: readonly T[], random = Math.random): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function createQuestions(pool: Character[], count: number): Character[] {
  if (!pool.length) return [];
  const result: Character[] = [];
  while (result.length < count) {
    const batch = shuffle(pool);
    if (batch.length > 1 && batch[0].id === result.at(-1)?.id) {
      [batch[0], batch[1]] = [batch[1], batch[0]];
    }
    result.push(...batch.slice(0, count - result.length));
  }
  return result;
}

export function answerChoices(target: Character, pool: Character[]): string[] {
  const other = [...new Set(pool.map((c) => c.reading))].filter(
    (r) => r !== target.reading,
  );
  return shuffle([target.reading, ...shuffle(other).slice(0, 3)]);
}

export function quizKey(options: QuizOptions): string {
  return `${options.script}:${[...options.rows].sort((a, b) => a - b).join(",")}:${options.count}:${options.timed ? 15 : 0}`;
}
