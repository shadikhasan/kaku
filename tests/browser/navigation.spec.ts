import { expect, test } from "@playwright/test";

test("phone tabs navigate, indicate the current page, and leave practice unobstructed", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "mobile",
    "Exercise phone navigation on the mobile project.",
  );
  await page.goto("/");
  const tabs = page.getByRole("navigation", { name: "Main navigation" });
  await expect(tabs.getByRole("link")).toHaveCount(5);
  for (const [name, url] of [
    ["Lessons", "/lessons/"],
    ["Library", "/library/"],
    ["Review", "/review/"],
    ["Progress", "/progress/"],
    ["Home", "/"],
  ]) {
    await tabs.getByRole("link", { name, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${url}$`));
    await expect(tabs.getByRole("link", { name, exact: true })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(tabs.locator('[aria-current="page"]')).toHaveCount(1);
  }
  await page.getByRole("button", { name: "Start your first lesson" }).click();
  await expect(page.locator("canvas")).toBeVisible();
  await expect(tabs).toHaveCount(0);
  await page.getByRole("button", { name: "Back to lessons" }).click();
  await expect(
    tabs.getByRole("link", { name: "Lessons", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("phone More dialog supports keyboard dismissal, settings, help, and installation instructions", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "mobile",
    "Exercise phone menu on the mobile project.",
  );
  await page.goto("/");
  const trigger = page.getByRole("button", { name: "More options" });
  const menu = page.getByRole("dialog", { name: "More", exact: true });
  await trigger.click();
  await expect(menu).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(menu).not.toBeVisible();
  await expect(trigger).toBeFocused();
  await trigger.click();
  await menu.getByRole("link", { name: "Settings", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your practice, your way." }),
  ).toBeVisible();
  await expect(menu).not.toBeVisible();
  await trigger.click();
  await menu.getByRole("button", { name: "Help", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "How to practice" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await trigger.click();
  await menu.getByRole("button", { name: "Install Kaku", exact: true }).click();
  await expect(page.getByText(/On iPhone or iPad:/)).toBeVisible();
  await expect(page).toHaveURL(/install=1#pwa-heading$/);
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    Object.assign(event, {
      prompt: async () => {
        Reflect.set(window, "__menuInstallRequested", true);
      },
      userChoice: Promise.resolve({ outcome: "accepted" }),
    });
    window.dispatchEvent(event);
  });
  await trigger.click();
  await menu.getByRole("button", { name: "Install Kaku", exact: true }).click();
  expect(
    await page.evaluate(() => Reflect.get(window, "__menuInstallRequested")),
  ).toBe(true);
  await page.evaluate(() => window.dispatchEvent(new Event("appinstalled")));
  await trigger.click();
  await expect(
    menu.getByRole("button", { name: "Install Kaku", exact: true }),
  ).toHaveCount(0);
});

test("navigation fits phone widths in both languages and switches to the sidebar on larger screens", async ({
  page,
}, info) => {
  test.skip(
    info.project.name !== "desktop",
    "Check all viewport breakpoints once.",
  );
  await page.goto("/");
  for (const language of ["en", "bn"]) {
    if (language === "bn") {
      await page.goto("/settings/");
      await page.locator('.language-switch button[lang="bn"]').click();
      await page.goto("/");
    }
    for (const width of [320, 375, 480, 600, 760, 761, 980, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const tabs = page.locator(".mobile-bottom-nav");
      if (width <= 760) {
        await expect(tabs).toBeVisible();
        await expect(page.locator(".sidebar")).toBeHidden();
        expect(
          await tabs.getByRole("link").evaluateAll((links) =>
            links.every((link) => {
              const rect = link.getBoundingClientRect();
              return (
                rect.width >= 44 &&
                rect.height >= 44 &&
                link.scrollWidth <= link.clientWidth
              );
            }),
          ),
        ).toBe(true);
        await page.evaluate(() =>
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: "instant",
          }),
        );
        expect(
          await page.evaluate(
            () =>
              document.querySelector("footer")!.getBoundingClientRect()
                .bottom <=
              document
                .querySelector(".mobile-bottom-nav")!
                .getBoundingClientRect().top +
                1,
          ),
        ).toBe(true);
        if (width === 375) {
          await page.evaluate(() =>
            window.scrollTo({ top: 0, behavior: "instant" }),
          );
          await page.screenshot({
            path: `test-results/navigation-${language}.png`,
          });
        }
      } else {
        await expect(tabs).toBeHidden();
        await expect(page.locator(".sidebar")).toBeVisible();
        await expect(page.locator(".mobile-more-button")).toBeHidden();
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  }
});
