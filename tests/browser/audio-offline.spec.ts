import { expect, test } from '@playwright/test';

test('played recordings are cached in full and can play again offline', async ({ page, context }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'speechSynthesis', { value: undefined, configurable: true });
    Reflect.set(window, '__audioPlays', 0);
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      this.addEventListener('playing', () => Reflect.set(window, '__audioPlays', Reflect.get(window, '__audioPlays') + 1), { once: true });
      return play.call(this);
    };
  });
  await page.goto('/practice/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  expect(await page.evaluate(async () => !!await caches.match('/audio/kana/a-single.mp3'))).toBe(false);
  await page.locator('.audio-button').click();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__audioPlays'))).toBe(1);
  await expect.poll(() => page.evaluate(async () => (await caches.match('/audio/kana/a-single.mp3'))?.status)).toBe(200);
  await context.setOffline(true);
  // Exercise a media player's range request against the stored full response.
  expect(await page.evaluate(async () => {
    const response = await fetch('/audio/kana/a-single.mp3', { headers: { Range: 'bytes=0-' } });
    return response.status === 206 && !!response.headers.get('Content-Range') && (await response.arrayBuffer()).byteLength > 1000;
  })).toBe(true);
  await page.locator('.audio-button').click();
  await expect.poll(() => page.evaluate(() => Reflect.get(window, '__audioPlays'))).toBe(2);
});
