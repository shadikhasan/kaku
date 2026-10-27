import { expect, test } from "@playwright/test";
import characters from "../../src/data/kana.json" with { type: "json" };

test("home quiz completes, saves a best score and keeps writing progress separate", async ({
  page,
}, info) => {
  await page.goto("/");
  await page
    .getByRole("link", { name: /How many characters do you remember/ })
    .click();
  await expect(page).toHaveURL(/\/quiz\/$/);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/quiz-setup-${info.project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.getByRole("button", { name: "Start quiz", exact: true }).click();
  for (let i = 0; i < 10; i++) {
    const symbol = await page.locator(".quiz-character").innerText();
    const reading = characters.find((c) => c.symbol === symbol)!.reading;
    await page.getByRole("button", { name: reading, exact: true }).click();
    await page
      .getByRole("button", {
        name: i === 9 ? "See results" : "Next question",
        exact: true,
      })
      .click();
  }
  await expect(page.getByText("100% correct", { exact: true })).toBeVisible();
  await page.screenshot({
    path: `test-results/quiz-results-${info.project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await expect(page.getByText("Personal best: 10/10")).toBeVisible();
  await page.reload();
  await expect(page.getByText("Personal best: 10/10")).toBeVisible();
  await page.goto("/progress/");
  await expect(page.locator(".stat-card").first().locator("strong")).toHaveText(
    "0",
  );
});

test("lesson rows preselect and small rows keep choices inside the row", async ({
  page,
}) => {
  await page.goto("/lessons/");
  await page
    .getByRole("link", { name: "Quiz this lesson", exact: true })
    .nth(7)
    .click();
  await expect(page.locator(".quiz-row input:checked")).toHaveCount(1);
  await expect(
    page.getByText("3 characters selected", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start quiz", exact: true }).click();
  await expect(page.locator(".quiz-answer")).toHaveCount(3);
  await page.getByRole("button", { name: "Leave quiz", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep playing", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

test("timer pauses in background, expires once and mistakes open writing practice", async ({
  page,
}) => {
  await page.goto("/quiz/");
  await page.getByRole("switch").check();
  await page.getByRole("button", { name: "Start quiz", exact: true }).click();
  await page.clock.install();
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(20_000);
  await expect(page.getByText("Paused", { exact: true })).toBeVisible();
  await expect(page.getByText("Time is up", { exact: true })).toHaveCount(0);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: false,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(15_100);
  await expect(page.getByText("Time is up", { exact: true })).toBeVisible();
  for (let i = 0; i < 10; i++) {
    if (i) await page.locator(".quiz-answer").first().click();
    await page
      .getByRole("button", {
        name: i === 9 ? "See results" : "Next question",
        exact: true,
      })
      .click();
  }
  await page
    .getByRole("button", { name: "Retry mistakes", exact: true })
    .click();
  const total = await page.locator(".quiz-play-header").innerText();
  expect(total).toMatch(/Question 1 of/);
  const retryCount = Number(total.match(/of (\d+)/)![1]);
  for (let i = 0; i < retryCount; i++) {
    const symbol = await page.locator(".quiz-character").innerText();
    const reading = characters.find((c) => c.symbol === symbol)!.reading;
    const choices = await page.locator(".quiz-answer").allTextContents();
    await page
      .locator(".quiz-answer")
      .nth(choices.findIndex((r) => r !== reading))
      .click();
    await page
      .getByRole("button", {
        name: i === retryCount - 1 ? "See results" : "Next question",
        exact: true,
      })
      .click();
  }
  await page
    .getByRole("button", { name: "Practice these in writing", exact: true })
    .click();
  await expect(page).toHaveURL(/\/practice\/\?lesson=review&characters=/);
  await expect(page.locator("canvas")).toBeVisible();
});

test("Bangla quiz localizes readings and controls without mobile overflow", async ({
  page,
}, info) => {
  await page.goto("/quiz/");
  await page.evaluate(() => localStorage.setItem("kana-studio-language", "bn"));
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "কানা কুইজ", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "শুরু করো", exact: true }).click();
  await expect(page.locator(".quiz-answer").first()).toContainText(/\(.+\)/);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/quiz-bangla-${info.project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
});

test("selection controls, mixed scripts, saved options and offline quiz work", async ({
  page,
  context,
}) => {
  await page.goto("/quiz/");
  await page.getByRole("button", { name: "Select all", exact: true }).click();
  await page
    .getByRole("button", { name: "Clear selection", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Start quiz", exact: true }),
  ).toBeDisabled();
  await page.locator(".quiz-row input").first().check();
  await page.getByRole("button", { name: "Both scripts", exact: true }).click();
  await page.getByRole("button", { name: "20", exact: true }).click();
  await page.getByRole("button", { name: "Start quiz", exact: true }).click();
  await expect(page.locator(".quiz-answer")).toHaveCount(4);
  await page.getByRole("button", { name: "Leave quiz", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Leave quiz", exact: true })
    .click();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Both scripts", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "20", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.goto("/settings/");
  await expect(
    page.getByText("Ready offline: lessons, practice, and progress.", {
      exact: true,
    }),
  ).toBeVisible({ timeout: 30_000 });
  await page.goto("/quiz/");
  await context.setOffline(true);
  await page.reload();
  await page.getByRole("button", { name: "Start quiz", exact: true }).click();
  await expect(page.locator(".quiz-character")).toBeVisible();
});
