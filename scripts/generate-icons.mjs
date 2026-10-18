import { chromium } from "@playwright/test";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";

// Rasterize the existing vector logo with browser font fallback for Japanese text.
const executablePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch(
  existsSync(executablePath) ? { executablePath } : {},
);
try {
  await mkdir("public/icons", { recursive: true });
  const svg = await readFile("public/icon.svg", "utf8");
  for (const [size, name, maskable] of [
    [192, "icon-192", false],
    [512, "icon-512", false],
    [512, "maskable-512", true],
    [180, "apple-touch-icon", true],
  ]) {
    const page = await browser.newPage({
      viewport: { width: size, height: size },
      deviceScaleFactor: 1,
    });
    const logo = maskable
      ? svg
          .replace('rx="44"', 'rx="0"')
          .replace('font-size="112"', 'font-size="100"')
      : svg;
    await page.setContent(
      `<style>html,body{margin:0;background:#4c6542}svg{display:block;width:100vw;height:100vh}</style>${logo}`,
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `public/icons/${name}.png` });
    await page.close();
  }
} finally {
  await browser.close();
}
