import { test, expect } from "@playwright/test";
const route = "/#/preview/application/app-shell/app-shell-22";

test("fleet hero uses an original local cover and preserves reference card geometry", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route);
  const photos = page.locator("[data-hero-slide]");
  await expect(photos).toHaveCount(1);
  await expect
    .poll(() =>
      photos.evaluateAll((es) =>
        es.every(
          (e) => (e as HTMLImageElement).complete && (e as HTMLImageElement).naturalWidth > 0,
        ),
      ),
    )
    .toBe(true);
  const first = await page.locator(".fleet-hero-summary").first().boundingBox();
  expect(first).toMatchObject({ x: 84, y: 312, width: 275, height: 154 });
  const body = await page.locator(".fleet-hero-body-grid>[data-slot=frame]").last().boundingBox();
  expect(body).toMatchObject({ x: 383, y: 490, width: 873, height: 336 });
  await expect.poll(() => photos.first().evaluate((e) => getComputedStyle(e).opacity)).toBe("1");
  await expect
    .poll(() => photos.first().evaluate((e) => getComputedStyle(e).animationName))
    .toBe("none");
});

test("fleet rail, section pills and theme preserve their independent local state", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(route);
  await page.getByRole("radio", { name: "Stations", exact: true }).click();
  await expect(page.getByRole("radio", { name: "Stations", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Robots", exact: true }).click();
  await page.getByRole("menuitem", { name: "Billing", exact: true }).click();
  await expect(page.getByRole("button", { name: "Billing", exact: true })).toHaveAttribute(
    "aria-current",
    "true",
  );
  await expect(page.getByRole("radio", { name: "Stations", exact: true })).toBeChecked();
  await page.getByRole("button", { name: "Evil Rabbit account", exact: true }).click();
  await expect(page.getByRole("radio", { name: "System", exact: true })).toBeChecked();
  await page.getByRole("radio", { name: "Dark", exact: true }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("radio", { name: "Light", exact: true }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.keyboard.press("Escape");
  const notice = page.getByRole("status", { name: "Fleet access request", exact: true });
  await notice.getByRole("button", { name: "Allow", exact: true }).click();
  await expect(notice).toHaveCount(0);
  await expect(page.getByText("Access allowed", { exact: true })).toHaveCount(0);
});

test("mobile fleet navigation uses a modal glass rail and the original section menu", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const trigger = page.getByRole("button", { name: "Open workspace navigation", exact: true });
  const firstCard = page.locator(".fleet-hero-summary").first();
  expect(await firstCard.boundingBox()).toMatchObject({ x: 12, y: 252, width: 366, height: 154 });
  await trigger.click();
  // Pointer automation may scroll a sticky trigger into view before dispatching
  // pointerdown. Focus return must preserve that scroll position.
  const openedAt = await page.locator(".fleet-photo-shell").evaluate((e) => e.scrollTop);
  const dialog = page.getByRole("dialog", { name: "Workspace", exact: true });
  await expect(dialog.getByRole("button", { name: "Routes", exact: true })).toBeVisible();
  await page.keyboard.press("Tab");
  expect(await dialog.evaluate((e) => e.contains(document.activeElement))).toBe(true);
  await dialog.getByRole("button", { name: "Routes", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  expect(await page.locator(".fleet-photo-shell").evaluate((e) => e.scrollTop)).toBe(openedAt);
  await page.getByRole("button", { name: "Open sections menu", exact: true }).click();
  await page.getByRole("menuitem", { name: "Missions", exact: true }).click();
  await expect(page.getByRole("menu")).toHaveCount(0);
  await expect
    .poll(async () => {
      const box = await page.locator(".fleet-hero-summary").first().boundingBox();
      const scroll = await page.locator(".fleet-photo-shell").evaluate((e) => e.scrollTop);
      return box ? { x: box.x, y: box.y + scroll, width: box.width, height: box.height } : null;
    })
    .toEqual({ x: 12, y: 252, width: 366, height: 154 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const shell = page.locator(".fleet-photo-shell");
  await shell.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  const lastCard = await page
    .locator(".fleet-hero-body-grid>[data-slot=frame]")
    .last()
    .boundingBox();
  expect(lastCard!.y).toBeGreaterThan(0);
  expect(lastCard!.y + lastCard!.height).toBeLessThanOrEqual(844);
  const notice = page.getByRole("status", { name: "Fleet access request", exact: true });
  await notice.getByRole("button", { name: "Dismiss", exact: true }).click();
  await expect(notice).toHaveCount(0);
});

test("fleet source viewer defaults to the complete photo shell implementation", async ({
  page,
}) => {
  await page.goto("/#/block/application/app-shell/app-shell-22");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
    "src/blocks/application/shells/fleet-hero.tsx",
  );
  await expect(dialog.locator(".source-code")).toContainText("function FleetHeroShell");
  await expect(dialog.locator(".source-code")).toContainText("function HeroScenes");
});
