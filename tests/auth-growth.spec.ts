import { test, expect } from "@playwright/test";

test("trial signup keeps providers first and validates the trial form", async ({
  page,
}) => {
  await page.goto("./#/preview/application/auth/auth-5");
  const email = page.getByLabel("Work email", { exact: true });
  const password = page.getByLabel("Password", { exact: true });
  const google = page.getByRole("button", {
    name: "Continue with Google",
    exact: true,
  });
  expect((await google.boundingBox())!.y).toBeLessThan(
    (await email.boundingBox())!.y,
  );
  await expect(page.getByLabel("Full name", { exact: true })).toHaveCount(0);
  await page
    .getByRole("button", { name: "Start free trial", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await email.fill("demo@example.com");
  await password.fill("short");
  await page
    .getByRole("button", { name: "Start free trial", exact: true })
    .click();
  await expect(page.getByRole("status")).toHaveCount(0);
  await password.fill("preview-password");
  await page
    .getByRole("button", { name: "Show password", exact: true })
    .click();
  await expect(password).toHaveAttribute("type", "text");
  await page
    .getByRole("button", { name: "Start free trial", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "Demo workspace prepared for demo@example.com",
  );
  await page
    .getByRole("button", { name: "Back to signup", exact: true })
    .click();
  await expect(email).toHaveValue("demo@example.com");
});

test("trial page sign in and policy controls preserve the page", async ({
  page,
}) => {
  await page.goto("./#/preview/application/auth/auth-5");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("dialog").getByLabel("Password", { exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: "Privacy Policy", exact: true })
    .click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("heading", { name: "Privacy Policy", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Done", exact: true }).click();
  await page
    .getByRole("button", { name: "Continue with GitHub", exact: true })
    .click();
  await expect(
    page.getByText("GitHub sign-in selected", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Start your 14-day trial", exact: true }),
  ).toBeVisible();
});

test("blueprint magic link sends, resends and returns without a password", async ({
  page,
}) => {
  await page.goto("./#/preview/application/auth/auth-7");
  await expect(page.getByLabel("Password", { exact: true })).toHaveCount(0);
  await page
    .getByLabel("Email address", { exact: true })
    .fill("demo@example.com");
  await page
    .getByRole("button", { name: "Send sign-in link", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText(
    "sign-in link is ready for demo@example.com",
  );
  await page.getByRole("button", { name: "Resend link", exact: true }).click();
  await expect(
    page.getByText("Demo sign-in link prepared again", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Back to sign in", exact: true })
    .click();
  await expect(page.getByLabel("Email address", { exact: true })).toHaveValue(
    "demo@example.com",
  );
  await page
    .getByRole("button", { name: "Start a free trial", exact: true })
    .click();
  await expect(
    page.getByRole("dialog").getByLabel("Work email", { exact: true }),
  ).toBeVisible();
});

for (const width of [1440, 390])
  test(`trial and blueprint retain their structures at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const id of [5, 7]) {
      await page.goto(`./#/preview/application/auth/auth-${id}`);
      await expect(page.locator("main.auth-growth")).toBeVisible();
      await expect(page.locator('[data-slot="frame"]')).toHaveCount(1);
      await expect(
        page
          .getByRole("list", { name: "Customer brands", exact: true })
          .getByRole("listitem"),
      ).toHaveCount(id === 5 ? 6 : 8);
      await expect(
        page.locator("[data-slot=frame-panel]").first(),
      ).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator("img")
          .evaluateAll((images) =>
            images.every(
              (image) =>
                (image as HTMLImageElement).complete &&
                (image as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      ).toBe(true);
    }
    expect(errors).toEqual([]);
  });
