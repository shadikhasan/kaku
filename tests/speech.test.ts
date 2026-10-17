import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import characters from '../src/data/kana.json';

class AudioMock {
  src = '';
  preload = '';
  volume = 0;
  onended: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onplaying: (() => void) | null = null;
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  removeAttribute = vi.fn(() => { this.src = ''; });
  constructor() { players.push(this); }
}

let players: AudioMock[];
let speech: typeof import('../src/lib/speech');

beforeEach(async () => {
  vi.useFakeTimers();
  vi.resetModules();
  players = [];
  // Deliberately no speechSynthesis or installed voices.
  vi.stubGlobal('window', { Audio: AudioMock });
  speech = await import('../src/lib/speech');
});

afterEach(() => { speech.stopPronunciation(); vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('recorded Japanese pronunciation', () => {
  it('starts playback during the tap without a device voice', async () => {
    const playback = speech.speakCharacter({ reading: 'a' });
    expect(players[0].src).toBe('/audio/kana/a-single.mp3');
    expect(players[0].play).toHaveBeenCalledOnce();
    players[0].onended?.();
    await expect(playback).resolves.toBeNull();
  });

  it('shares the same recording between scripts for every kana', async () => {
    for (const character of characters) {
      const playback = speech.speakCharacter(character);
      expect(players.at(-1)?.src).toBe(`/audio/kana/${character.reading}-single.mp3`);
      players.at(-1)?.onended?.();
      await expect(playback).resolves.toBeNull();
    }
  });

  it('replaces playback and ignores late rejection from the previous player', async () => {
    const first = speech.speakCharacter({ reading: 'a' });
    const old = players[0];
    const staleError = old.onerror;
    const second = speech.speakCharacter({ reading: 'i' });
    expect(old.pause).toHaveBeenCalledOnce();
    expect(old.src).toBe('');
    staleError?.();
    await expect(first).resolves.toBeNull();
    expect(players[1].src).toBe('/audio/kana/i-single.mp3');
    players[1].onended?.();
    await expect(second).resolves.toBeNull();
  });

  it('reports missing, corrupt, or unavailable files', async () => {
    const playback = speech.speakCharacter({ reading: 'a' });
    players[0].onerror?.();
    await expect(playback).resolves.toBe(speech.audioUnavailable);
  });

  it('reports a browser rejecting play()', async () => {
    const original = AudioMock;
    vi.stubGlobal('window', { Audio: class extends original {
      play = vi.fn(() => Promise.reject(new Error('NotAllowedError')));
    } });
    await expect(speech.speakCharacter({ reading: 'a' })).resolves.toBe(speech.audioUnavailable);
  });

  it('stops stalled downloads and releases the audio', async () => {
    const playback = speech.speakCharacter({ reading: 'a' });
    await vi.advanceTimersByTimeAsync(15000);
    await expect(playback).resolves.toBe(speech.audioUnavailable);
    expect(players[0].pause).toHaveBeenCalledOnce();
    expect(players[0].src).toBe('');
  });

  it('stops playback on navigation without displaying an error', async () => {
    const playback = speech.speakCharacter({ reading: 'a' });
    speech.stopPronunciation();
    await expect(playback).resolves.toBeNull();
    expect(players[0].pause).toHaveBeenCalledOnce();
    expect(players[0].onended).toBeNull();
  });

  it('handles unsupported browsers and unknown readings', async () => {
    await expect(speech.speakCharacter({ reading: '../other' })).resolves.toBe(speech.audioUnavailable);
    expect(players).toHaveLength(0);
    vi.stubGlobal('window', {});
    await expect(speech.speakCharacter({ reading: 'a' })).resolves.toBe(speech.audioUnavailable);
  });
});
