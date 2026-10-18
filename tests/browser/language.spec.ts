import { expect, test, type Page } from "@playwright/test";
import data from "../../src/data/kana.json" with { type: "json" };

async function switchLanguage(page: Page, language: "en" | "bn") {
  const previous = page.url();
  await page.goto("/settings/");
  await page.locator(`.language-switch button[lang="${language}"]`).click();
  if (new URL(previous).pathname !== "/settings/") await page.goto(previous);
}

test("Bangla preference persists, both script tabs work, and every page fits", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await switchLanguage(page, "bn");
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  await expect(
    page.getByRole("heading", { name: "শেখার নতুন শুরু এখানেই." }),
  ).toBeVisible();
  await page
    .locator(".page-enter")
    .evaluate((element) =>
      element.getAnimations().forEach((animation) => animation.finish()),
    );
  await page.screenshot({
    path: `test-results/bangla-dashboard-${info.project.name}.png`,
    fullPage: true,
  });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "bn");
  for (const route of [
    "lessons",
    "library",
    "review",
    "progress",
    "settings",
  ]) {
    await page.goto(`/${route}/`);
    await expect(page.locator("html")).toHaveAttribute("lang", "bn");
    await expect(page.locator("main h1")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    if (route === "lessons") {
      await expect(page.locator(".lesson-row")).toHaveCount(10);
      await page.getByRole("button", { name: /ア\s*কাতাকানা/ }).click();
      await expect(page.locator(".lesson-row")).toHaveCount(10);
      await expect(page.locator(".lesson-preview").first()).toContainText(
        "アイウエオ",
      );
    }
    if (route === "library") {
      await expect(page.locator(".character-tile")).toHaveCount(46);
      await page.getByRole("button", { name: /ア\s*কাতাকানা/ }).click();
      await expect(page.locator(".character-tile")).toHaveCount(46);
      await expect(page.locator(".character-tile").first()).toContainText("ア");
    }
  }
  await switchLanguage(page, "en");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: "Your practice, your way." }),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  expect(errors).toEqual([]);
});

test("the language chosen in Settings applies to writing and saved progress", async ({
  page,
}, info) => {
  const character = data.find((c) => c.symbol === "い")!;
  await page.goto(`/practice/?lesson=hiragana-0&characters=${character.id}`);
  await expect(page.locator("main h1")).toHaveText("Write “ই (i)”");
  await expect(page.locator(".reference-reading")).toHaveText("ই (i)");
  await switchLanguage(page, "bn");
  await expect(page.locator("main h1")).toHaveText("“ই (i)” লেখো");
  for (let stage = 0; stage < 3; stage++) {
    await expect(page.locator(".practice-stage-tabs .active")).toContainText(
      ["স্ট্রোক গাইড", "ট্রেস গাইড", "মনে করে লেখা"][stage],
    );
    for (
      let strokeIndex = 0;
      strokeIndex < character.paths.length;
      strokeIndex++
    ) {
      const points = await page.evaluate((path) => {
        const element = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "path",
        );
        element.setAttribute("d", path);
        return Array.from({ length: 40 }, (_, i) => {
          const point = element.getPointAtLength(
            (element.getTotalLength() * i) / 39,
          );
          return { x: point.x / 109, y: point.y / 109 };
        });
      }, character.paths[strokeIndex]);
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
        strokeIndex + 1,
      );
      if (stage === 0 && strokeIndex === 0) {
        await page
          .locator(".page-enter")
          .evaluate((element) =>
            element.getAnimations().forEach((animation) => animation.finish()),
          );
        await page.screenshot({
          path: `test-results/bangla-practice-${info.project.name}.png`,
          fullPage: true,
        });
      }
    }
  }
  await expect(
    page.getByRole("heading", { name: "দেখো, কী সুন্দর লিখেছ!" }),
  ).toBeVisible();
  await expect(page.locator(".result-stats")).toContainText(
    "১সাহায্য ছাড়া লিখেছ",
  );
  await page.goto("/progress/");
  await expect(page.locator(".stat-card").first().locator("strong")).toHaveText(
    "১",
  );
  await switchLanguage(page, "en");
  await expect(page.locator(".stat-card").first().locator("strong")).toHaveText(
    "1",
  );
  await page.reload();
  await expect(page.locator(".stat-card").first().locator("strong")).toHaveText(
    "1",
  );
});

test("Bengali and romaji readings stay together in the library across language changes", async ({
  page,
}) => {
  await page.goto("/library/");
  await page.getByRole("textbox", { name: "Search characters" }).fill("শি");
  await expect(page.locator(".character-tile")).toHaveCount(1);
  await expect(page.locator(".character-tile")).toContainText("শি (shi)");
  await switchLanguage(page, "bn");
  await page.getByRole("textbox").fill("shi");
  await expect(page.locator(".character-tile")).toHaveCount(1);
  await expect(page.locator(".character-tile")).toContainText("শি (shi)");
  await page.locator(".character-tile").click();
  await expect(page.locator(".detail-reading")).toHaveText("শি (shi)");
  await page.getByRole("button", { name: "উইন্ডো বন্ধ করো" }).click();
  await page.getByRole("textbox", { name: "অক্ষর খোঁজো" }).fill("shi");
  await expect(page.locator(".character-tile")).toHaveCount(1);
  await page.getByRole("button", { name: /ア\s*কাতাকানা/ }).click();
  await expect(page.locator(".character-tile")).toHaveCount(1);
  await expect(page.locator(".character-tile")).toContainText("シ");
  await expect(page.locator(".character-tile")).toContainText("শি (shi)");
});
