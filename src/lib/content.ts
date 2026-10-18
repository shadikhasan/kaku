import data from "@/data/kana.json";
import type { Character, Lesson, Script } from "./types";

export const characters: Character[] = data;
export const lessons: Lesson[] = ["hiragana", "katakana"].flatMap((script) =>
  Array.from({ length: 10 }, (_, index) => {
    const selected = characters.filter(
      (c) => c.lessonId === `${script}-${index}`,
    );
    return {
      id: `${script}-${index}`,
      name: selected[0].group,
      script: script as Script,
      characters: selected,
      number: index + 1,
    };
  }),
);

export const stageNames = ["Stroke guide", "Trace guide", "From memory"];
export const stageDescriptions = [
  "Follow the highlighted stroke. We’ll guide you, one line at a time.",
  "Trace the soft outline. You’re getting a feel for the character.",
  "Your turn. Write the character with no guides to help you.",
];

export const examples: Record<string, [string, string]> = {
  a: ["あさ", "morning"],
  i: ["いぬ", "dog"],
  u: ["うみ", "sea"],
  e: ["えき", "station"],
  o: ["おと", "sound"],
  ka: ["かさ", "umbrella"],
  ki: ["き", "tree"],
  ku: ["くち", "mouth"],
  ke: ["けむり", "smoke"],
  ko: ["こえ", "voice"],
  sa: ["さくら", "cherry blossom"],
  shi: ["しお", "salt"],
  su: ["すし", "sushi"],
  se: ["せかい", "world"],
  so: ["そら", "sky"],
  ta: ["たまご", "egg"],
  chi: ["ちず", "map"],
  tsu: ["つき", "moon"],
  te: ["て", "hand"],
  to: ["とり", "bird"],
  na: ["なつ", "summer"],
  ni: ["にわ", "garden"],
  nu: ["ぬの", "cloth"],
  ne: ["ねこ", "cat"],
  no: ["のり", "seaweed"],
  ha: ["はな", "flower"],
  hi: ["ひ", "sun"],
  fu: ["ふね", "boat"],
  he: ["へや", "room"],
  ho: ["ほし", "star"],
  ma: ["まど", "window"],
  mi: ["みみ", "ear"],
  mu: ["むし", "insect"],
  me: ["め", "eye"],
  mo: ["もり", "forest"],
  ya: ["やま", "mountain"],
  yu: ["ゆき", "snow"],
  yo: ["よる", "night"],
  ra: ["らくだ", "camel"],
  ri: ["りんご", "apple"],
  ru: ["るす", "absence"],
  re: ["れい", "zero"],
  ro: ["ろく", "six"],
  wa: ["わに", "crocodile"],
  wo: ["を", "object marker"],
  n: ["ほん", "book"],
};
