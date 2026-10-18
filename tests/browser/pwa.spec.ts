import { expect, test } from "@playwright/test";

test("installation controls follow browser availability, dismissal, and installed state", async ({
  page,
}) => {
  await page.goto("/settings/");
  await expect(
    page.getByText("Ready offline: lessons, practice, and progress."),
  ).toBeVisible();
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        Reflect.set(window, "__installRequested", true);
      },
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    });
    window.dispatchEvent(event);
  });
  await page.getByRole("button", { name: "Install Kaku", exact: true }).click();
  expect(
    await page.evaluate(() => Reflect.get(window, "__installRequested")),
  ).toBe(true);
  await expect(
    page.getByRole("button", { name: "Install Kaku", exact: true }),
  ).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("button", { name: "How to install" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "How to install" }).click();
  await expect(page.getByText(/On iPhone or iPad:/)).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await expect(
    page.getByText("Kaku is installed", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "How to install" }),
  ).toHaveCount(0);
});

test("manifest icons have real dimensions and the app is ready before visiting other screens", async ({
  page,
  context,
  request,
}, info) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json();
  expect(manifest.scope).toBe("/");
  expect(manifest.display).toBe("standalone");
  for (const icon of manifest.icons) {
    const response = await request.get(icon.src);
    expect(response.ok()).toBe(true);
    const bytes = await response.body();
    const [width, height] = icon.sizes.split("x").map(Number);
    expect(bytes.readUInt32BE(16)).toBe(width);
    expect(bytes.readUInt32BE(20)).toBe(height);
  }
  await page.goto("/settings/");
  await expect(
    page.getByText("Ready offline: lessons, practice, and progress."),
  ).toBeVisible();
  await context.setOffline(true);
  // Visit routes that were never loaded in this browser, including client navigation.
  await page
    .getByRole("link", {
      name: info.project.name === "mobile" ? "Lessons" : "My lessons",
      exact: true,
    })
    .click();
  await expect(page.locator(".lesson-row")).toHaveCount(10);
  await page.goto("/practice/?lesson=katakana-0&characters=030a2");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator(".reference-character")).toContainText("ア");
  await page.reload();
  await expect(page.locator("canvas")).toBeVisible();
  for (const route of ["/library/", "/review/", "/progress/", "/settings/"]) {
    await page.goto(route);
    await expect(page.locator(".page-heading")).toBeVisible();
  }
  await page.getByLabel("Daily character goal").selectOption("15");
  // A fresh page exercises a cold app launch without relying on HTTP cache.
  const cold = await context.newPage();
  const devtools = await context.newCDPSession(cold);
  await devtools.send("Network.enable");
  await devtools.send("Network.setCacheDisabled", { cacheDisabled: true });
  // Attaching a new CDP Network domain resets Chromium's per-target emulation.
  await devtools.send("Network.emulateNetworkConditions", {
    offline: true,
    latency: 0,
    downloadThroughput: -1,
    uploadThroughput: -1,
  });
  const scriptsFromWorker: boolean[] = [];
  cold.on("response", (response) => {
    if (response.url().endsWith(".js"))
      scriptsFromWorker.push(response.fromServiceWorker());
  });
  await page.close();
  await cold.goto("/settings/");
  await expect(cold.getByLabel("Daily character goal")).toHaveValue("15");
  await expect(
    cold.getByText("You are offline. Your notebook is ready."),
  ).toBeVisible();
  expect(scriptsFromWorker.length).toBeGreaterThan(0);
  expect(scriptsFromWorker.every(Boolean)).toBe(true);
  await cold.screenshot({
    path: `test-results/pwa-settings-${info.project.name}.png`,
    fullPage: true,
  });
  await cold.goto("/page-that-does-not-exist/");
  await expect(
    cold.getByRole("heading", { name: "This page is unavailable offline" }),
  ).toBeVisible();
  expect(
    (await cold
      .evaluate(async () =>
        (await fetch("/missing-script.js")).headers.get("content-type"),
      )
      .catch(() => "")) ?? "",
  ).not.toContain("text/html");
});

test("all audio can be downloaded, replayed offline with ranges, and removed without deleting progress", async ({
  page,
  context,
}) => {
  await page.goto("/settings/");
  await expect(
    page.getByText("Ready offline: lessons, practice, and progress."),
  ).toBeVisible();
  await page.getByLabel("Daily character goal").selectOption("15");
  await page
    .getByRole("button", { name: "Download all audio", exact: true })
    .click();
  await expect(page.getByText("46 of 46 recordings saved.")).toBeVisible();
  await context.setOffline(true);
  expect(
    await page.evaluate(async () => {
      const cache = await caches.open("kaku-audio-v1");
      const keys = await cache.keys();
      for (const key of keys) {
        const response = await fetch(key.url, {
          headers: { Range: "bytes=0-99" },
        });
        if (
          response.status !== 206 ||
          (await response.arrayBuffer()).byteLength !== 100
        )
          return false;
      }
      return keys.length === 46;
    }),
  ).toBe(true);
  await page.getByRole("button", { name: "Remove downloaded audio" }).click();
  const confirmation = page.getByRole("alertdialog", {
    name: "Remove downloaded audio?",
  });
  await expect(confirmation).toBeVisible();
  await confirmation
    .getByRole("button", { name: "Cancel", exact: true })
    .click();
  await expect(page.getByText("46 of 46 recordings saved.")).toBeVisible();
  await page.getByRole("button", { name: "Remove downloaded audio" }).click();
  await confirmation
    .getByRole("button", { name: "Remove audio", exact: true })
    .click();
  await expect(page.getByText("0 of 46 recordings saved.")).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Daily character goal")).toHaveValue("15");
});
