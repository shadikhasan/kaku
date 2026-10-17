import type { Character } from './types';
import { banglaReadings } from './readings';

export const audioUnavailable = 'Could not play audio. Check your connection and media volume, then try again.';

let active: { finish: (message: string | null) => void } | null = null;

export function stopPronunciation() {
  active?.finish(null);
}

export function speakCharacter(character: Pick<Character, 'reading'>): Promise<string | null> {
  stopPronunciation();
  if (typeof window === 'undefined' || !window.Audio || !Object.hasOwn(banglaReadings, character.reading)) {
    return Promise.resolve(audioUnavailable);
  }

  return new Promise(resolve => {
    let audio: HTMLAudioElement | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let settled = false;
    const playback = { finish };

    function finish(message: string | null) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (active === playback) active = null;
      if (audio) {
        audio.onended = audio.onerror = audio.onplaying = null;
        audio.pause();
        audio.removeAttribute('src');
      }
      resolve(message);
    }

    try {
      audio = new window.Audio();
      audio.preload = 'none';
      audio.volume = 1;
      audio.onended = () => finish(null);
      audio.onerror = () => finish(audioUnavailable);
      audio.onplaying = () => {
        clearTimeout(timer);
        // Recordings are under five seconds; also handle engines that stop sending events.
        timer = setTimeout(() => finish(audioUnavailable), 15000);
      };
      audio.src = `/audio/kana/${character.reading}-single.mp3`;
      active = playback;
      timer = setTimeout(() => finish(audioUnavailable), 15000);
      // Start directly in the tap handler to preserve mobile playback permission.
      void audio.play().catch(() => finish(audioUnavailable));
    } catch {
      finish(audioUnavailable);
    }
  });
}
