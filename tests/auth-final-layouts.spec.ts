import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

test("grid review uses actual carousel navigation and retains the magic-link state", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#/preview/application/auth/auth-9");
  const carousel = page.getByRole("region", { name: "Team stories", exact: true });
  await expect(carousel.locator('[data-slot="carousel-item"]')).toHaveCount(6);
  await expect(page.locator('.auth-grid-review [data-slot="icon-tile"]')).toHaveCount(18);
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    carousel.getByRole("button", { name: "Show team story 2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await carousel.getByRole("button", { name: "Show team story 3", exact: true }).click();
  await expect(carousel.locator('figure[aria-hidden="false"]')).toContainText("Ari Lane");
  await page.getByLabel("Work email", { exact: true }).fill("member@bricklane.test");
  await page.getByRole("button", { name: "Send magic link", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("member@bricklane.test");
  await expect(carousel.locator('figure[aria-hidden="false"]')).toContainText("Ari Lane");
});

test("method picker preserves the review and provides separate email, SSO, backup and signup flows", async ({
  page,
}) => {
  await page.goto("./#/preview/application/auth/auth-12");
  await expect(page.locator(".auth-method-buttons > button")).toHaveCount(5);
  await page.getByRole("button", { name: "Learn more", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Choose a sign-in method");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Continue with email", exact: true }).click();
  await page.getByLabel("Email address", { exact: true }).fill("member@bricklane.test");
  await page.getByRole("button", { name: "Continue with email", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("member@bricklane.test");
  await page.getByRole("button", { name: "Back to login", exact: true }).click();
  await page.getByRole("button", { name: "Continue with SAML SSO", exact: true }).click();
  await page.getByLabel("Email address", { exact: true }).fill("member@northline.test");
  await page.getByRole("button", { name: "Continue with SSO", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("northline.test");
  await page.getByRole("button", { name: "Back to login", exact: true }).click();
  await page.getByRole("button", { name: "Use backup code", exact: true }).click();
  const code = page.getByLabel("Backup code", { exact: true });
  await code.fill("1234");
  expect(await code.evaluate((input: HTMLInputElement) => input.validity.patternMismatch)).toBe(
    true,
  );
  await code.fill("12345678");
  await page.getByRole("button", { name: "Verify backup code", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("No account was verified");
  await page.getByRole("button", { name: "Back to login", exact: true }).click();
  await page.getByRole("button", { name: "Log in with passkey", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("No credential has been requested");
  await page.getByRole("button", { name: "Try another method", exact: true }).click();
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page.getByLabel("Full name", { exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Team stories", exact: true })).toBeVisible();
});

test("cyan artwork login uses the real free frame and a functional email form", async ({
  page,
}) => {
  await page.goto("./#/preview/application/auth/auth-13");
  await expect(
    page.getByRole("img", { name: "Original cyan ribbon study", exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-slot="frame"]')).toHaveCount(1);
  await page.getByLabel("Work email", { exact: true }).fill("member@bricklane.test");
  await page.getByRole("button", { name: "Send magic link", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("member@bricklane.test");
});

test("access login retains password/reset and prepares a separate local invite request", async ({
  page,
}) => {
  await page.goto("./#/preview/application/auth/auth-14");
  await expect(page.getByLabel("Work email", { exact: true })).toHaveAttribute("type", "email");
  await page.getByRole("button", { name: "Show password", exact: true }).click();
  await expect(page.getByLabel("Password", { exact: true })).toHaveAttribute("type", "text");
  await page.getByRole("button", { name: "Forgot password?", exact: true }).click();
  await page.getByLabel("Work email", { exact: true }).fill("member@bricklane.test");
  await page.getByRole("button", { name: "Send reset link", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("member@bricklane.test");
  await page.getByRole("button", { name: "Back to sign in", exact: true }).click();
  await page.getByRole("button", { name: "Request an invite", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Full name", { exact: true }).fill("Mila Stone");
  await dialog.getByLabel("Work email", { exact: true }).fill("mila@bricklane.test");
  await dialog.getByRole("button", { name: "Prepare request", exact: true }).click();
  await expect(dialog.getByRole("status")).toContainText("mila@bricklane.test");
  await dialog.getByRole("button", { name: "Back to sign in", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await page.getByRole("button", { name: "Request an invite", exact: true }).click();
  await expect(dialog.getByLabel("Full name", { exact: true })).toHaveValue("");
  await page.keyboard.press("Escape");
  const carousel = page.getByRole("region", { name: "Original artwork studies", exact: true });
  await carousel.getByRole("button", { name: "Show artwork 1", exact: true }).click();
  await carousel.focus();
  await page.keyboard.press("ArrowRight");
  await expect(
    carousel.getByRole("button", { name: "Show artwork 2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
});

for (const theme of ["light", "dark"])
  for (const width of [1280, 390])
    test(`last four auth layouts fit ${width}px in ${theme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      for (const id of [9, 12, 13, 14]) {
        await page.goto(`./#/preview/application/auth/auth-${id}?theme=${theme}`);
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
        if (width === 390) {
          if (id === 14) await expect(page.locator(".auth-access-art")).toBeHidden();
          else if (id === 13) {
            const artwork = page.locator(".auth-cyan-frame");
            await expect(artwork).toBeVisible();
            expect(
              (await artwork.boundingBox())!.y + (await artwork.boundingBox())!.height,
            ).toBeLessThanOrEqual((await page.locator(".auth-cyan-form").boundingBox())!.y);
          } else {
            const review = page.locator(".auth-grid-review");
            await expect(review).toBeVisible();
            const form = page.locator(id === 9 ? ".auth-grid-form" : ".auth-method-form");
            const formBox = (await form.boundingBox())!;
            expect((await review.boundingBox())!.y).toBeGreaterThanOrEqual(
              formBox.y + formBox.height,
            );
          }
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
      }
      expect(errors).toEqual([]);
    });

test("actual method-login ZIP and code drawer contain the implementation and original artwork dependencies", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("./#/block/application/auth/auth-12");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  const dialog = page.getByRole("dialog");
  const filename = "src/blocks/application/auth-methods.tsx";
  await expect(dialog.getByRole("combobox", { name: "Source file" })).toHaveText(filename);
  await dialog.locator(".source-code").getByRole("button", { name: "Copy", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toBe(await readFile(filename, "utf8"));
  const waiting = page.waitForEvent("download");
  await dialog.getByRole("button", { name: "Download starter", exact: true }).click();
  const downloaded = await waiting;
  const entries = unzipSync(new Uint8Array(await readFile((await downloaded.path())!)));
  for (const path of [
    filename,
    "src/blocks/application/auth-grid-review.tsx",
    "src/blocks/application/auth-sculpture.tsx",
    "src/lib/demo-artwork.ts",
    "src/components/reui/rating.tsx",
    "src/components/reui/icon-tile.tsx",
    "src/components/reui/REUI-LICENSE.txt",
  ])
    expect(strFromU8(entries[path]), path).toBe(await readFile(path, "utf8"));
});
