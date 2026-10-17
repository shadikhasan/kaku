import { expect, test } from '@playwright/test';
import data from '../../src/data/kana.json' with { type: 'json' };

test.use({ serviceWorkers: 'block' });

test('audio download failures are visible in practice and character details', async ({ page }) => {
  await page.route('**/audio/kana/*.mp3', route => route.abort());
  const message = 'Could not play audio. Check your connection and media volume, then try again.';
  await page.goto('/practice/');
  await page.locator('.writing-prompt .audio-button').click();
  await expect(page.locator('.writing-feedback')).toHaveText(message);
  await page.goto('/library/');
  await page.locator('.character-tile').first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Play pronunciation' }).click();
  await expect(dialog.getByRole('status')).toHaveText(message);
  await page.getByRole('button', { name: 'Close dialog' }).click();
  await page.locator('.character-tile').nth(1).click();
  await expect(page.getByRole('dialog').getByRole('status')).toHaveCount(0);
});

test('both speaker buttons play real recordings without speech synthesis', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
    Reflect.set(window, '__playedAudio', []);
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.addEventListener('playing', () => Reflect.get(window, '__playedAudio').push(this.currentSrc), { once: true });
      return play.call(this);
    };
  });
  for (const route of ['/practice/', '/library/']) {
    const downloads: string[] = [];
    const track = (request: { url(): string }) => { if (request.url().includes('/audio/kana/')) downloads.push(request.url()); };
    page.on('request', track);
    await page.goto(route);
    if (route === '/library/') await page.locator('.character-tile').first().click();
    expect(downloads).toEqual([]);
    await page.locator('.audio-button').click();
    await expect.poll(() => page.evaluate(() => Reflect.get(window, '__playedAudio'))).toEqual([
      'http://127.0.0.1:3020/audio/kana/a-single.mp3',
    ]);
    page.off('request', track);
  }
});

test('all kana files contain one short pronunciation at a consistent volume', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'Decode the shared assets once.');
  await page.goto('/');
  const results = await page.evaluate(async readings => {
    const context = new AudioContext();
    try {
      const results = [];
      for (const reading of readings) {
        const response = await fetch(`/audio/kana/${reading}-single.mp3`);
        if (!response.ok) throw new Error(`${reading}: HTTP ${response.status}`);
        const audio = await context.decodeAudioData(await response.arrayBuffer());
        const channel = audio.getChannelData(0);
        let peak = 0;
        for (const sample of channel) peak = Math.max(peak, Math.abs(sample));
        const frameSize = Math.round(audio.sampleRate * .01);
        const rms = [];
        for (let i = 0; i < channel.length; i += frameSize) {
          let sum = 0;
          for (let j = i; j < Math.min(channel.length, i + frameSize); j++) sum += channel[j] ** 2;
          rms.push(Math.sqrt(sum / Math.min(frameSize, channel.length - i)));
        }
        const threshold = Math.max(.001, Math.max(...rms) * .025);
        const voiced = rms.map((value, index) => ({ value, index })).filter(frame => frame.value > threshold);
        let pronunciations = 0, previous = -100;
        for (const frame of voiced) {
          if (frame.index - previous > 18) pronunciations++;
          previous = frame.index;
        }
        const voiceRms = Math.sqrt(voiced.reduce((sum, frame) => sum + frame.value ** 2, 0) / voiced.length);
        results.push({ reading, duration: audio.duration, peak, pronunciations, voiceRms });
      }
      return results;
    } finally { await context.close(); }
  }, [...new Set(data.map(character => character.reading))]);
  expect(results).toHaveLength(46);
  for (const result of results) {
    expect(result.duration, result.reading).toBeGreaterThan(.2);
    expect(result.duration, result.reading).toBeLessThan(.8);
    expect(result.peak, result.reading).toBeGreaterThan(.01);
    expect(result.peak, result.reading).toBeLessThan(.99);
    expect(result.pronunciations, result.reading).toBe(1);
    expect(result.voiceRms, result.reading).toBeGreaterThan(.04);
    expect(result.voiceRms, result.reading).toBeLessThan(.16);
  }
});
