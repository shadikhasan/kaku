import { mkdir, writeFile } from "node:fs/promises";

const rows = [
  ["Vowels", "a i u e o", "あいうえお", "アイウエオ"],
  ["K row", "ka ki ku ke ko", "かきくけこ", "カキクケコ"],
  ["S row", "sa shi su se so", "さしすせそ", "サシスセソ"],
  ["T row", "ta chi tsu te to", "たちつてと", "タチツテト"],
  ["N row", "na ni nu ne no", "なにぬねの", "ナニヌネノ"],
  ["H row", "ha hi fu he ho", "はひふへほ", "ハヒフヘホ"],
  ["M row", "ma mi mu me mo", "まみむめも", "マミムメモ"],
  ["Y row", "ya yu yo", "やゆよ", "ヤユヨ"],
  ["R row", "ra ri ru re ro", "らりるれろ", "ラリルレロ"],
  ["W row & n", "wa wo n", "わをん", "ワヲン"],
];
const items = rows.flatMap(([group, readings, hiragana, katakana], row) =>
  ["hiragana", "katakana"].flatMap((script, scriptIndex) =>
    [...(scriptIndex ? katakana : hiragana)].map((symbol, index) => ({
      id: symbol.codePointAt(0).toString(16).padStart(5, "0"),
      symbol,
      reading: readings.split(" ")[index],
      script,
      group,
      lessonId: `${script}-${row}`,
      paths: [],
    })),
  ),
);
let cursor = 0;
await Promise.all(
  Array.from({ length: 6 }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      const url = `https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/${item.id}.svg`;
      const response = await fetch(url);
      if (!response.ok)
        throw new Error(`${item.symbol}: HTTP ${response.status}`);
      const svg = await response.text();
      item.paths = [...svg.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)].map(
        (match) => match[1],
      );
      if (!item.paths.length) throw new Error(`No strokes for ${item.symbol}`);
    }
  }),
);
await mkdir("src/data", { recursive: true });
await writeFile("src/data/kana.json", JSON.stringify(items, null, 2) + "\n");
await mkdir("public", { recursive: true });
const license = await fetch(
  "https://raw.githubusercontent.com/KanjiVG/kanjivg/master/COPYING",
);
if (!license.ok) throw new Error(`License: HTTP ${license.status}`);
await writeFile("public/KANJIVG-LICENSE.txt", await license.text());
console.log(
  `Downloaded ${items.length} characters with ${items.reduce((n, x) => n + x.paths.length, 0)} ordered strokes.`,
);
