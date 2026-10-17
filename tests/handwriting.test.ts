import { describe, expect, it } from 'vitest';
import { evaluateStroke, resample, dayKey, streakForDays } from '../src/lib/handwriting';
import data from '../src/data/kana.json';

const line = Array.from({ length: 20 }, (_, i) => ({ x: .2 + i / 19 * .6, y: .35 }));

describe('stroke evaluation', () => {
  it('accepts a correctly drawn reference with small beginner wobble', () => {
    const handwriting = line.map((point, i) => ({ x: point.x + .02, y: point.y + Math.sin(i) * .025 }));
    expect(evaluateStroke(handwriting, line).accepted).toBe(true);
  });
  it('rejects a stroke drawn in reverse with a useful direction hint', () => {
    const result = evaluateStroke([...line].reverse(), line);
    expect(result.accepted).toBe(false);
    expect(result.message).toContain('direction');
  });
  it('rejects a tap instead of accepting an incomplete stroke', () => {
    expect(evaluateStroke([{ x: .2, y: .35 }, { x: .205, y: .35 }], line).accepted).toBe(false);
  });
  it('rejects writing in the wrong part of the pad', () => {
    expect(evaluateStroke(line.map(p => ({ ...p, y: p.y + .4 })), line).accepted).toBe(false);
  });
  it('resamples input consistently regardless of input frequency', () => {
    const result = resample([line[0], line.at(-1)!]);
    expect(result).toHaveLength(32);
    expect(result[0]).toEqual(line[0]);
    expect(result.at(-1)!.x).toBeCloseTo(line.at(-1)!.x);
  });
  it('handles repeated points without NaN', () => {
    expect(resample([{ x: .3, y: .5 }, { x: .3, y: .5 }]).every(p => Number.isFinite(p.x) && Number.isFinite(p.y))).toBe(true);
  });
});

describe('practice calendar', () => {
  it('counts unique consecutive days and includes yesterday when today is unfinished', () => {
    expect(streakForDays(['2026-10-14', '2026-10-15', '2026-10-15', '2026-10-16'], new Date(2026, 9, 17))).toBe(3);
  });
  it('ends a streak after a missed day', () => {
    expect(streakForDays(['2026-10-14'], new Date(2026, 9, 17))).toBe(0);
  });
  it('formats local dates correctly at a year boundary', () => {
    expect(dayKey(new Date(2026, 0, 1))).toBe('2026-01-01');
    expect(streakForDays(['2025-12-31', '2026-01-01'], new Date(2026, 0, 1))).toBe(2);
  });
});

describe('kana curriculum', () => {
  it('contains 46 unique base characters per script with ordered paths', () => {
    for (const script of ['hiragana', 'katakana']) expect(data.filter(c => c.script === script)).toHaveLength(46);
    expect(new Set(data.map(c => c.id)).size).toBe(92);
    expect(data.every(c => c.paths.length > 0 && c.paths.every(path => /^M/i.test(path)))).toBe(true);
  });
});
