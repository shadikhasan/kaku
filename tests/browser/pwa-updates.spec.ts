import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { expect, test as base } from "@playwright/test";

// A separate origin per test allows real service-worker lifecycle failures and
// upgrades without rewriting production output or mocking browser lifecycle APIs.
const test = base.extend<{
  release: {
    url: string;
    version: number;
    failCore: boolean;
    failAudio: boolean;
    slowAudio: boolean;
  };
}>({
  release: async ({}, use) => {
    const state = {
      url: "",
      version: 1,
      failCore: false,
      failAudio: false,
      slowAudio: false,
    };
    const root = path.resolve("out");
    const server = createServer(async (req, res) => {
      try {
        const url = new URL(req.url!, "http://localhost");
        if (
          (state.failCore && url.pathname === "/offline.html") ||
          (state.failAudio && url.pathname === "/audio/kana/i-single.mp3")
        ) {
          res.writeHead(503);
          res.end("Unavailable");
          return;
        }
        if (state.slowAudio && url.pathname.startsWith("/audio/"))
          await new Promise((resolve) => setTimeout(resolve, 300));
        let filename = path.resolve(
          root,
          "." + decodeURIComponent(url.pathname),
        );
        if (!filename.startsWith(root + path.sep) && filename !== root) {
          res.writeHead(400);
          res.end();
          return;
        }
        if ((await stat(filename)).isDirectory())
          filename = path.join(filename, "index.html");
        let bytes = await readFile(filename);
        if (url.pathname === "/sw.js")
          bytes = Buffer.from(
            bytes
              .toString()
              .replace(
                /const BUILD = ["'][^"']+["']/,
                `const BUILD = 'test-release-${state.version}'`,
              ),
          );
        const mime: Record<string, string> = {
          ".js": "application/javascript",
          ".css": "text/css",
          ".html": "text/html",
          ".txt": "text/plain",
          ".mp3": "audio/mpeg",
          ".png": "image/png",
          ".svg": "image/svg+xml",
          ".webmanifest": "application/manifest+json",
        };
        res.writeHead(200, {
          "Content-Type":
            mime[path.extname(filename)] || "application/octet-stream",
          "Cache-Control": "no-store",
        });
        res.end(bytes);
      } catch {
        res.writeHead(404);
        res.end("Not found");
      }
    });
    await new Promise<void>((resolve) =>
      server.listen(0, "127.0.0.1", resolve),
    );
    const address = server.address();
    if (!address || typeof address === "string")
      throw new Error("No test port");
    state.url = `http://127.0.0.1:${address.port}`;
    try {
      await use(state);
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  },
});

test("failed initial cache can be retried; failed upgrade preserves the working release", async ({
  page,
  context,
  release,
}) => {
  release.failCore = true;
  await page.goto(`${release.url}/settings/`);
  await expect(
    page.getByText("Offline setup failed. You can still practise online."),
  ).toBeVisible();
  expect(
    await page.evaluate(() => navigator.serviceWorker.controller),
  ).toBeNull();
  release.failCore = false;
  await page.getByRole("button", { name: "Retry offline setup" }).click();
  await expect(
    page.getByText("Ready offline: lessons, practice, and progress."),
  ).toBeVisible();
  release.version = 2;
  release.failCore = true;
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())!.update();
  });
  await expect
    .poll(() =>
      page.evaluate(
        async () =>
          !(await navigator.serviceWorker.getRegistration())?.installing,
      ),
    )
    .toBe(true);
  await expect(
    page.getByRole("button", { name: "Update and reload" }),
  ).toHaveCount(0);
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByText("You are offline. Your notebook is ready."),
  ).toBeVisible();
  expect(
    await page.evaluate(async () =>
      (await caches.keys()).filter((key) => key.startsWith("kaku-core-")),
    ),
  ).toEqual(["kaku-core-test-release-1"]);
});

test("updates protect practice and quizzes in another tab and retain preferences and old audio", async ({
  page,
  context,
  release,
}) => {
  await page.goto(`${release.url}/settings/`);
  await expect(
    page.getByText("Ready offline: lessons, practice, and progress."),
  ).toBeVisible();
  await page.getByLabel("Daily character goal").selectOption("15");
  await page.evaluate(async () => {
    const cache = await caches.open("kana-studio-v3");
    await cache.put(
      "/audio/kana/a-single.mp3",
      await fetch("/audio/kana/a-single.mp3"),
    );
  });
  const practice = await context.newPage();
  await practice.goto(`${release.url}/practice/`);
  await expect(practice.locator("canvas")).toBeVisible();
  release.version = 2;
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.getRegistration())!.update();
  });
  await expect(
    page.getByRole("button", { name: "Update and reload" }),
  ).toBeVisible();
  await expect(
    practice.getByRole("button", { name: "Update and reload" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Update and reload" }).click();
  await expect(
    page.getByText("Finish practice in all open Kaku tabs, then try again."),
  ).toBeVisible();
  await expect(practice.locator("canvas")).toBeVisible();
  await practice.goto(`${release.url}/quiz/`);
  await practice
    .getByRole("button", { name: "Start quiz", exact: true })
    .click();
  await expect(practice.locator(".quiz-character")).toBeVisible();
  await expect(
    practice.getByRole("button", { name: "Update and reload" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Update and reload" }).click();
  await expect(
    page.getByText("Finish practice in all open Kaku tabs, then try again."),
  ).toBeVisible();
  await practice.goto(`${release.url}/lessons/`);
  await expect(practice.locator(".lesson-row")).toHaveCount(10);
  await Promise.all([
    page.waitForEvent("load"),
    page.getByRole("button", { name: "Update and reload" }).click(),
  ]);
  expect(
    await page.evaluate(async () =>
      (await caches.keys()).includes("kaku-core-test-release-2"),
    ),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Update and reload" }),
  ).toHaveCount(0);
  await expect(page.getByLabel("Daily character goal")).toHaveValue("15");
  await expect
    .poll(() =>
      page.evaluate(async () =>
        (await caches.keys()).some(
          (key) =>
            key === "kaku-core-test-release-1" ||
            key.startsWith("kana-studio-"),
        ),
      ),
    )
    .toBe(false);
  expect(
    await page.evaluate(
      async () =>
        !!(await (
          await caches.open("kaku-audio-v1")
        ).match("/audio/kana/a-single.mp3")),
    ),
  ).toBe(true);
});

test("failed and cancelled audio downloads resume using saved recordings", async ({
  page,
  release,
}) => {
  release.failAudio = true;
  await page.goto(`${release.url}/settings/`);
  await expect(
    page.getByText("Ready offline: lessons, practice, and progress."),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Download all audio", exact: true })
    .click();
  await expect(page.locator('.pwa-settings [role="alert"]')).toContainText(
    "Could not save audio.",
  );
  expect(
    await page.evaluate(
      async () => (await (await caches.open("kaku-audio-v1")).keys()).length,
    ),
  ).toBeGreaterThan(0);
  release.failAudio = false;
  release.slowAudio = true;
  await page
    .getByRole("button", { name: "Download all audio", exact: true })
    .click();
  await page.getByRole("button", { name: "Cancel download" }).click();
  await expect(
    page.getByRole("button", { name: "Cancel download" }),
  ).toHaveCount(0);
  release.slowAudio = false;
  await page
    .getByRole("button", { name: "Download all audio", exact: true })
    .click();
  await expect(page.getByText("46 of 46 recordings saved.")).toBeVisible();
});
