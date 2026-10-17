import { describe, expect, it } from 'vitest';
import { banglaReadings, displayReading, matchesReading } from '../src/lib/readings';
import data from '../src/data/kana.json';

describe('pronunciation in both scripts', () => {
  it('covers every kana without changing the original romaji', () => {
    for (const character of data) {
      expect(banglaReadings[character.reading], character.symbol).toBeTruthy();
      expect(displayReading(character.reading)).toContain(`(${character.reading})`);
    }
  });

  it('pairs Bengali and romaji, keeping ambiguous sounds distinguishable', () => {
    expect(displayReading('a')).toBe('আ (a)');
    expect(displayReading('shi')).toBe('শি (shi)');
    expect(displayReading('o')).toBe('ও (o)');
    expect(displayReading('wo')).toBe('ও (wo)');
    expect(displayReading('future-reading')).toBe('future-reading');
  });

  it('finds characters using Japanese, Bengali, or romaji', () => {
    expect(matchesReading('し', 'shi', 'শি')).toBe(true);
    expect(matchesReading('し', 'shi', ' SHI ')).toBe(true);
    expect(matchesReading('し', 'shi', 'し')).toBe(true);
    expect(matchesReading('し', 'shi', 'কা')).toBe(false);
  });
});
