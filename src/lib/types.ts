export type Script = "hiragana" | "katakana";
export type View =
  | "overview"
  | "lessons"
  | "library"
  | "review"
  | "progress"
  | "settings"
  | "practice"
  | "quiz";
export type Point = { x: number; y: number };
export type Character = {
  id: string;
  symbol: string;
  reading: string;
  script: string;
  group: string;
  lessonId: string;
  paths: string[];
};
export type Attempt = {
  id?: number;
  characterId: string;
  completedAt: string;
  day: string;
  independent: boolean;
  retries: number;
  hints: number;
};
export type Settings = {
  dailyGoal: number;
  sound: boolean;
  grid: boolean;
  reducedMotion: boolean;
};
export type Lesson = {
  id: string;
  name: string;
  script: Script;
  characters: Character[];
  number: number;
};
