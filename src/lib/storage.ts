'use client';

import Dexie, { type Table } from 'dexie';
import type { Attempt, Settings } from './types';

class KanaDatabase extends Dexie {
  attempts!: Table<Attempt, number>;
  preferences!: Table<{ key: string; value: Settings }, string>;
  constructor() {
    super('kana-studio');
    this.version(1).stores({ attempts: '++id, characterId, completedAt, day', preferences: 'key' });
  }
}

export const db = new KanaDatabase();
export const defaultSettings: Settings = { dailyGoal: 5, sound: true, grid: true, reducedMotion: false };

export async function readProgress() {
  const [attempts, settings] = await Promise.all([db.attempts.toArray(), db.preferences.get('settings')]);
  return { attempts, settings: settings?.value ?? defaultSettings };
}
