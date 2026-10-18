import type { Point } from "./types";

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function resample(points: Point[], count = 32): Point[] {
  if (!points.length) return [];
  if (points.length === 1)
    return Array.from({ length: count }, () => ({ ...points[0] }));
  const lengths = [0];
  for (let i = 1; i < points.length; i++)
    lengths.push(lengths[i - 1] + distance(points[i - 1], points[i]));
  const total = lengths.at(-1)!;
  if (!total) return Array.from({ length: count }, () => ({ ...points[0] }));
  let segment = 1;
  return Array.from({ length: count }, (_, i) => {
    const target = (total * i) / (count - 1);
    while (segment < lengths.length - 1 && lengths[segment] < target) segment++;
    const start = points[segment - 1],
      end = points[segment];
    const ratio =
      (target - lengths[segment - 1]) /
      (lengths[segment] - lengths[segment - 1] || 1);
    return {
      x: start.x + ratio * (end.x - start.x),
      y: start.y + ratio * (end.y - start.y),
    };
  });
}

export function samplePath(path: string): Point[] {
  const node = document.createElementNS("http://www.w3.org/2000/svg", "path");
  node.setAttribute("d", path);
  const length = node.getTotalLength();
  return Array.from({ length: 40 }, (_, i) => {
    const p = node.getPointAtLength((length * i) / 39);
    return { x: p.x / 109, y: p.y / 109 };
  });
}

export type StrokeResult = { accepted: boolean; message: string };

export function evaluateStroke(
  input: Point[],
  reference: Point[],
  relaxed = false,
): StrokeResult {
  if (input.length < 2 || reference.length < 2)
    return { accepted: false, message: "Draw a stroke on the writing pad." };
  const user = resample(input),
    expected = resample(reference);
  const inputLength = input
    .slice(1)
    .reduce((n, p, i) => n + distance(input[i], p), 0);
  const expectedLength = reference
    .slice(1)
    .reduce((n, p, i) => n + distance(reference[i], p), 0);
  if (inputLength < expectedLength * 0.35)
    return {
      accepted: false,
      message: "A little longer. Follow the stroke all the way through.",
    };
  if (inputLength > expectedLength * 2.4 + 0.12)
    return { accepted: false, message: "Try one smooth stroke at a time." };
  const forward =
    user.reduce((sum, p, i) => sum + distance(p, expected[i]), 0) / user.length;
  const backward =
    user.reduce(
      (sum, p, i) => sum + distance(p, expected[expected.length - i - 1]),
      0,
    ) / user.length;
  if (backward + 0.035 < forward)
    return {
      accepted: false,
      message: "Try the other direction. Watch where the stroke starts.",
    };
  const tolerance = relaxed ? 0.19 : 0.145;
  if (distance(user[0], expected[0]) > tolerance * 1.65)
    return {
      accepted: false,
      message: "Check the starting point, then give it another try.",
    };
  if (forward > tolerance)
    return {
      accepted: false,
      message: "Almost. Follow the shape and position a little more closely.",
    };
  if (distance(user.at(-1)!, expected.at(-1)!) > tolerance * 1.8)
    return {
      accepted: false,
      message: "Take another look at where this stroke ends.",
    };
  return { accepted: true, message: "Lovely stroke. Keep going." };
}

export function dayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function streakForDays(days: string[], today = new Date()): number {
  const unique = new Set(days);
  const cursor = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  if (!unique.has(dayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while (unique.has(dayKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
