import { expect, test, type Page } from "@playwright/test";
import data from "../../src/data/kana.json" with { type: "json" };

const character = data.find((c) => c.symbol === "く")!;

async function writeCharacter(page: Page) {
  await expect(page.locator(".pad-success")).toHaveCount(0);
  for (const path of character.paths) {
    const points = await page.evaluate((path) => {
      const element = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );
      element.setAttribute("d", path);
      const length = element.getTotalLength();
      return Array.from({ length: 35 }, (_, i) => {
        const p = element.getPointAtLength((length * i) / 34);
        return { x: p.x / 109, y: p.y / 109 };
      });
    }, path);
    const canvas = page.locator("canvas");
    await canvas.scrollIntoViewIfNeeded();
    const rect = (await canvas.boundingBox())!;
    await page.mouse.move(
      rect.x + points[0].x * rect.width,
      rect.y + points[0].y * rect.height,
    );
    await page.mouse.down();
    for (const p of points.slice(1))
      await page.mouse.move(
        rect.x + p.x * rect.width,
        rect.y + p.y * rect.height,
      );
    await page.mouse.up();
  }
}

async function savedAttempts(page: Page) {
  return page.evaluate(
    () =>
      new Promise<
        { independent: boolean; practiceStage?: number; sessionId?: string }[]
      >((resolve, reject) => {
        const request = indexedDB.open("kana-studio");
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const database = request.result;
          const read = database
            .transaction("attempts")
            .objectStore("attempts")
            .getAll();
          read.onsuccess = () => {
            database.close();
            resolve(read.result);
          };
          read.onerror = () => reject(read.error);
        };
      }),
  );
}

test("library setup offers repeat plans while other practice entries remain direct", async ({
  page,
}, info) => {
  await page.goto("/library/");
  await page.getByRole("textbox", { name: "Search characters" }).fill("ku");
  await page.locator(".character-tile").click();
  await page
    .getByRole("button", { name: "Practice this character", exact: true })
    .click();
  const setup = page.getByRole("dialog", {
    name: "Practice setup",
    exact: true,
  });
  await expect(setup).toBeVisible();
  await setup.getByRole("radio", { name: /Repeat writing/ }).check();
  await setup.getByRole("button", { name: "10 times", exact: true }).click();
  await expect(
    setup.getByText("2 guided → 3 outline → 5 from memory", { exact: true }),
  ).toBeVisible();
  await setup.getByRole("button", { name: "20 times", exact: true }).click();
  await expect(
    setup.getByText("3 guided → 5 outline → 12 from memory", { exact: true }),
  ).toBeVisible();
  await setup
    .getByRole("button", { name: "Write from memory", exact: true })
    .click();
  await expect(
    setup.getByText("20 times from memory. Hints are always available.", {
      exact: true,
    }),
  ).toBeVisible();
  await setup.screenshot({
    path: `test-results/repetition-setup-${info.project.name}.png`,
  });
  await setup
    .getByRole("button", { name: "Start writing", exact: true })
    .click();
  await expect(page).toHaveURL(/mode=repeat&count=20&start=memory/);
  await expect(page.locator(".reference-character")).toHaveText("?");
  await expect(page.locator(".practice-stage-tabs > div")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Finish session", exact: true })
    .click();
  await expect(
    page.getByText("0 of 20 writings completed", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to character library", exact: true })
    .click();
  await expect(page).toHaveURL(/\/library\/$/);
  await page.goto("/practice/?lesson=hiragana-0");
  await expect(page.locator("canvas")).toBeVisible();
  await expect(
    page.getByRole("dialog", { name: "Practice setup" }),
  ).toHaveCount(0);
  await expect(page.locator(".practice-stage-tabs .active")).toContainText(
    "Stroke guide",
  );
});

test("five writings fade guidance, persist each round and distinguish assisted recall", async ({
  page,
}, info) => {
  await page.goto(
    `/practice/?lesson=${character.lessonId}&characters=${character.id}&mode=repeat&count=5&start=guided`,
  );
  const expectedStages = [
    "Stroke guide",
    "Trace guide",
    "Trace guide",
    "From memory",
    "From memory",
  ];
  for (let round = 0; round < 5; round++) {
    await expect(page.locator(".practice-heading")).toContainText(
      `${round} of 5 writings completed`,
    );
    await expect(page.locator(".practice-stage-tabs .active")).toContainText(
      expectedStages[round],
    );
    if (round === 3)
      await page.getByRole("button", { name: "Hint", exact: true }).click();
    await writeCharacter(page);
    await expect
      .poll(async () => (await savedAttempts(page)).length)
      .toBe(round + 1);
  }
  await expect(
    page.getByText("5 of 5 writings completed", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".result-stats")).toContainText(
    "1 / 2recalled independently",
  );
  const attempts = await savedAttempts(page);
  expect(attempts.map((a) => a.practiceStage)).toEqual([0, 1, 1, 2, 2]);
  expect(attempts.map((a) => a.independent)).toEqual([
    false,
    false,
    false,
    false,
    true,
  ]);
  expect(new Set(attempts.map((a) => a.sessionId)).size).toBe(1);
  await page.screenshot({
    path: `test-results/repetition-results-${info.project.name}.png`,
    fullPage: true,
    animations: "disabled",
  });
  await page.goto("/progress/");
  await expect(page.locator(".stat-card").nth(0).locator("strong")).toHaveText(
    "1",
  );
  await expect(page.locator(".stat-card").nth(1).locator("strong")).toHaveText(
    "1",
  );
  await page.reload();
  await expect(page.locator(".history-list > div")).toHaveCount(5);
});

test("memory repetitions save before early finish, including offline", async ({
  page,
  context,
}) => {
  await page.goto("/settings/");
  await expect(
    page.getByText("Ready offline: lessons, practice, and progress.", {
      exact: true,
    }),
  ).toBeVisible();
  await context.setOffline(true);
  await page.goto(
    `/practice/?lesson=${character.lessonId}&characters=${character.id}&mode=repeat&count=10&start=memory`,
  );
  for (let round = 0; round < 2; round++) {
    await expect(page.locator(".practice-heading")).toContainText(
      `${round} of 10 writings completed`,
    );
    await writeCharacter(page);
    await expect
      .poll(async () => (await savedAttempts(page)).length)
      .toBe(round + 1);
  }
  await page
    .getByRole("button", { name: "Finish session", exact: true })
    .click();
  await expect(
    page.getByText("2 of 10 writings completed", { exact: true }),
  ).toBeVisible();
  await page.reload();
  expect(await savedAttempts(page)).toHaveLength(2);
});

test("Bangla setup and writing progress fit mobile and desktop", async ({
  page,
}, info) => {
  await page.goto("/library/");
  await page.evaluate(() => localStorage.setItem("kana-studio-language", "bn"));
  await page.reload();
  await page.locator(".character-tile").first().click();
  await page
    .getByRole("button", { name: "এই অক্ষর অনুশীলন করো", exact: true })
    .click();
  await page.getByRole("radio", { name: /বারবার লিখি/ }).check();
  await expect(
    page.getByText("১ বার স্ট্রোক → ২ বার আউটলাইন → ২ বার মনে করে", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("dialog")
    .screenshot({
      path: `test-results/repetition-bangla-${info.project.name}.png`,
    });
  await page
    .getByRole("button", { name: "লেখা শুরু করো", exact: true })
    .click();
  await expect(page.locator(".practice-heading")).toContainText(
    "৫ বারের মধ্যে ০ বার লেখা সম্পূর্ণ",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
