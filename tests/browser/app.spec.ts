import { expect, test } from "@playwright/test";
import data from "../../src/data/kana.json" with { type: "json" };

test("dashboard, lessons, library, and settings work without horizontal overflow", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Your next chapter/ }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Start your first lesson" }),
  ).toBeEnabled();
  await page
    .locator(".page-enter")
    .evaluate((element) =>
      element.getAnimations().forEach((animation) => animation.finish()),
    );
  await page.screenshot({
    path: `test-results/dashboard-${info.project.name}.png`,
    fullPage: true,
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Start your first lesson" }).click();
  await expect(
    page.getByRole("heading", { name: "Write “আ (a)”" }),
  ).toBeVisible();
  await expect(page.locator(".practice-stage-tabs .active")).toHaveText(
    "1Stroke guide",
  );
  await page
    .locator(".page-enter")
    .evaluate((element) =>
      element.getAnimations().forEach((animation) => animation.finish()),
    );
  await page.screenshot({
    path: `test-results/practice-${info.project.name}.png`,
    fullPage: true,
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.getByRole("button", { name: "Back to lessons" }).click();
  await expect(page.locator(".lesson-row")).toHaveCount(10);
  await page.getByRole("button", { name: "ア Katakana" }).click();
  await expect(page.locator(".lesson-preview").first()).toContainText(
    "アイウエオ",
  );
  await page.goto("/library/");
  await expect(page.locator(".character-tile")).toHaveCount(46);
  await page.getByRole("textbox", { name: "Search characters" }).fill("shi");
  await expect(page.locator(".character-tile")).toHaveCount(1);
  await page.locator(".character-tile").click();
  await expect(
    page.getByRole("dialog", { name: "Character details" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.goto("/settings/");
  await page.getByLabel("Daily character goal").selectOption("10");
  await page.reload();
  await expect(page.getByLabel("Daily character goal")).toHaveValue("10");
  expect(errors).toEqual([]);
});

test("a real three-stage writing cycle saves progress after reload", async ({
  page,
  context,
}, info) => {
  const character = data.find((c) => c.symbol === "い")!;
  await page.goto(`/practice/?lesson=hiragana-0&characters=${character.id}`);
  await expect(
    page.getByRole("heading", { name: "Write “ই (i)”" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBe(true);
  await context.setOffline(true);
  for (let stage = 0; stage < 3; stage++) {
    await expect(page.locator(".practice-stage-tabs .active")).toContainText(
      ["Stroke guide", "Trace guide", "From memory"][stage],
    );
    if (stage === 2)
      await expect(page.locator(".reference-character")).toHaveText("?");
    for (let index = 0; index < character.paths.length; index++) {
      const points = await page.evaluate((path) => {
        const element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        element.setAttribute("d", path);
        const length = element.getTotalLength();
        return Array.from({ length: 40 }, (_, i) => {
          const point = element.getPointAtLength((length * i) / 39);
          return { x: point.x / 109, y: point.y / 109 };
        });
      }, character.paths[index]);
      const rect = await page.locator("canvas").boundingBox();
      if (!rect) throw new Error("Missing drawing pad");
      await page.mouse.move(
        rect.x + points[0].x * rect.width,
        rect.y + points[0].y * rect.height,
      );
      await page.mouse.down();
      for (const point of points.slice(1))
        await page.mouse.move(
          rect.x + point.x * rect.width,
          rect.y + point.y * rect.height,
        );
      await page.mouse.up();
      await expect(page.locator(".stroke-status i.complete")).toHaveCount(
        index + 1,
      );
    }
  }
  await expect(
    page.getByRole("heading", { name: "Look what you wrote." }),
  ).toBeVisible();
  await expect(page.locator(".result-stats")).toContainText(
    "1recalled independently",
  );
  await page
    .locator(".page-enter")
    .evaluate((element) =>
      element.getAnimations().forEach((animation) => animation.finish()),
    );
  await page.screenshot({
    path: `test-results/results-${info.project.name}.png`,
    fullPage: true,
  });
  await page.goto("/progress/");
  await expect(page.locator(".stat-card").first().locator("strong")).toHaveText(
    "1",
  );
  await page.reload();
  await expect(page.locator(".stat-card").first().locator("strong")).toHaveText(
    "1",
  );
  await expect(page.locator(".history-list")).toContainText(
    "Recalled independently",
  );
});

test("wrong strokes do not advance and custom review selection works", async ({
  page,
}) => {
  await page.goto("/practice/");
  const rect = await page.locator("canvas").boundingBox();
  if (!rect) throw new Error("Missing pad");
  await page.mouse.move(rect.x + 10, rect.y + 10);
  await page.mouse.down();
  await page.mouse.move(rect.x + 15, rect.y + 12);
  await page.mouse.up();
  await expect(page.locator(".writing-feedback")).toHaveClass(/retry/);
  await expect(page.locator(".stroke-status i.complete")).toHaveCount(0);
  await page.goto("/review/");
  await expect(
    page.getByRole("button", { name: "Practice selected" }),
  ).toBeDisabled();
  await page.locator(".character-tile").first().click();
  await page.getByRole("button", { name: "Practice selected" }).click();
  await expect(
    page.getByRole("heading", { name: "Write “আ (a)”" }),
  ).toBeVisible();
  await expect(page.locator(".practice-heading")).toContainText(
    "Character 1 of 1",
  );
});

test("touch strokes work and a loaded lesson remains available offline", async ({
  page,
  context,
}) => {
  const character = data.find((c) => c.symbol === "し")!;
  await page.goto(`/practice/?lesson=hiragana-2&characters=${character.id}`);
  await expect(
    page.getByRole("heading", { name: "Write “শি (shi)”" }),
  ).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  const points = await page.evaluate((path) => {
    const element = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path",
    );
    element.setAttribute("d", path);
    return Array.from({ length: 30 }, (_, i) => {
      const point = element.getPointAtLength(
        (element.getTotalLength() * i) / 29,
      );
      return { x: point.x / 109, y: point.y / 109 };
    });
  }, character.paths[0]);
  const canvas = page.locator("canvas");
  await canvas.scrollIntoViewIfNeeded();
  const rect = await canvas.boundingBox();
  if (!rect) throw new Error("Missing pad");
  const session = await context.newCDPSession(page);
  const touch = (point: { x: number; y: number }) => ({
    x: rect.x + point.x * rect.width,
    y: rect.y + point.y * rect.height,
  });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [touch(points[0])],
  });
  for (const point of points.slice(1))
    await session.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [touch(point)],
    });
  await session.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect(page.locator(".practice-stage-tabs .active")).toContainText(
    "Trace guide",
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Write “শি (shi)”" }),
  ).toBeVisible();
  await page.waitForLoadState("networkidle");
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Write “শি (shi)”" }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toBeVisible();
  await context.setOffline(false);
});
