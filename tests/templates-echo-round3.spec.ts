import { test, expect } from "@playwright/test";

test("Echo projects retain metadata through filtering, renaming and cross-page navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/#/template-preview/echo");
  await page
    .getByRole("button", { name: /^Projects/ })
    .first()
    .click();
  const rows = page.locator(".echo-project-row");
  expect(Math.abs((await rows.first().boundingBox())!.height - 65.25)).toBeLessThan(1);
  await page.getByRole("textbox", { name: "Search projects", exact: true }).fill("Growth");
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("1 chat, last changed 3h");
  await page.getByRole("textbox", { name: "Search projects", exact: true }).clear();
  await page.getByRole("button", { name: "Actions Billing reliability", exact: true }).click();
  await page.getByRole("menuitem", { name: "Rename project", exact: true }).click();
  await page.getByLabel("Project name", { exact: true }).fill("Billing review");
  await page.getByRole("button", { name: "Save project", exact: true }).click();
  await expect(rows.filter({ hasText: "Billing review" })).toContainText("2 chats");
  await page.getByRole("button", { name: "New Chat", exact: true }).click();
  await page
    .getByRole("button", { name: /^Projects/ })
    .first()
    .click();
  await expect(rows.filter({ hasText: "Billing review" })).toContainText("2 chats");
  await page.getByRole("button", { name: "New Project", exact: true }).click();
  await page.getByLabel("Project name", { exact: true }).fill("Launch review");
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(rows.filter({ hasText: "Launch review" })).toContainText("0 chats");
});

test("Echo context menu stages real files and unique scopes, removes them without submitting and sends selected tools", async ({
  page,
}) => {
  await page.goto("/#/template-preview/echo");
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
  await expect(page.locator('.echo-reference-form [data-slot="input-group"]')).toHaveCSS(
    "opacity",
    "1",
  );
  await page.getByLabel("Attach files", { exact: true }).setInputFiles({
    name: "review.csv",
    mimeType: "text/csv",
    buffer: Buffer.from("name,status\nReview,ready"),
  });
  await page.getByRole("button", { name: "Add context", exact: true }).click();
  await page.getByRole("menuitem", { name: /Connect repo/ }).click();
  await page.getByRole("button", { name: "Add context", exact: true }).click();
  await page.getByRole("menuitem", { name: /Connect repo/ }).click();
  await expect(page.locator('[data-slot="attachment"]')).toHaveCount(2);
  await page.getByRole("button", { name: "Remove review.csv", exact: true }).click();
  await expect(page.locator(".echo-message")).toHaveCount(0);
  await page.getByRole("button", { name: "Search", exact: true }).last().click();
  await expect(page.getByText("● 2 tools", { exact: true })).toBeVisible();
  const draft = page.getByRole("textbox", { name: "Message Bricklane Chat", exact: true });
  await draft.fill("Review release");
  await draft.press("Shift+Enter");
  await expect(draft).toHaveValue("Review release\n");
  await draft.press("Enter");
  const reply = page.locator(".echo-message.assistant");
  await expect(reply).toContainText("Context staged: bricklane/platform.");
  await expect(reply).toContainText("Think + Search");
  await expect(reply).not.toContainText("review.csv");
  await expect(page.locator('[data-slot="attachment"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
});

test("Echo narrow composer keeps long attachments inside the free attachment viewport", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/template-preview/echo");
  await page.getByRole("button", { name: "Add context", exact: true }).click();
  await page.getByRole("menuitem", { name: /Add screenshot/ }).click();
  await expect(
    page.getByRole("button", { name: "Remove workspace-snapshot.svg", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Attach files", { exact: true }).setInputFiles({
    name: "a-long-original-workspace-release-notes-file.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Original review notes"),
  });
  await expect(page.locator('[data-slot="attachment"]')).toHaveCount(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  const send = await page.getByRole("button", { name: "Send message", exact: true }).boundingBox();
  expect(send!.x + send!.width).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
});
