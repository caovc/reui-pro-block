import { test, expect } from "@playwright/test";
const route = "./#/preview/ai-agents/ai-chat/ai-chat-9";

test("initial thread preserves the three fork rails and each reply branch keeps its later conversation", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(route);
  await expect(page.locator("[data-chat-node]")).toHaveCount(6);
  await expect(
    page.getByRole("button", { name: "Message version 1 of 2", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Reply version 2 of 3", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  const lastTurn = page.getByText("Remove the usage limit; that figure is still under review.", {
    exact: true,
  });
  await expect(lastTurn).toBeVisible();
  await page.getByRole("button", { name: "Reply version 1 of 3", exact: true }).click();
  await expect(lastTurn).toHaveCount(0);
  await page.getByRole("button", { name: "Reply version 2 of 3", exact: true }).click();
  await expect(lastTurn).toBeVisible();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Keep this branch follow-up");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop response", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Send message", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reply version 2 of 2", exact: true }).click();
  await expect(page.getByText("Keep this branch follow-up", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Reply version 1 of 2", exact: true }).click();
  await expect(page.getByText("Keep this branch follow-up", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Regenerate reply", exact: true }).last().click();
  await expect(page.getByRole("button", { name: "Reply version 2 of 2", exact: true })).toHaveCount(
    2,
  );
  expect(errors).toEqual([]);
});

test("editing creates a recoverable user fork and sources toggle in place", async ({ page }) => {
  await page.goto(route);
  const turn = page.locator('[data-chat-node="release-u2"]');
  await turn.hover();
  await turn.getByRole("button", { name: "Edit message", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Edit message", exact: true })
    .fill("Create a review checklist as JSON");
  await page.getByRole("button", { name: "Send", exact: true }).click();
  await expect(page.getByText("Create a review checklist as JSON", { exact: true })).toBeVisible();
  await expect(page.locator("pre").last()).toContainText("reviewRequired");
  await page.getByRole("button", { name: "Message version 1 of 2", exact: true }).last().click();
  await expect(
    page.getByText("Remove the usage limit; that figure is still under review.", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Message version 2 of 2", exact: true }).last().click();
  await expect(page.getByText("Create a review checklist as JSON", { exact: true })).toBeVisible();
  const source = page
    .getByRole("button", {
      name: "Source 2, release-notes-3.3.md",
      exact: true,
    })
    .last();
  await source.click();
  await expect(source).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("complementary", { name: "Source details" })).toHaveCount(0);
  await source.click();
  await expect(source).toHaveAttribute("aria-pressed", "false");
});

test("thread history groups, twelve models, skills and source attachments follow the public controls", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  await page.getByRole("button", { name: "Skills", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(3);
  await page.getByRole("menuitem", { name: "Verify the numbers", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Message", exact: true })).toHaveValue(
    "list every number I need to verify",
  );
  await page.getByRole("button", { name: "Attach source", exact: true }).click();
  await page.getByRole("menuitem", { name: /Previous release/ }).click();
  await expect(
    page.getByRole("button", {
      name: "Remove release-notes-3.3.md",
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Model, Claude Sonnet 5", exact: true }).click();
  await expect(page.getByRole("menuitemcheckbox")).toHaveCount(12);
  await page.getByRole("menuitemcheckbox", { name: /Gemini 3 Flash/ }).click();
  await expect(
    page.getByRole("button", { name: "Model, Gemini 3 Flash", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Threads,/ }).click();
  await expect(page.getByRole("tab")).toHaveCount(4);
  await page.getByRole("tab", { name: "Pinned", exact: true }).click();
  await expect(page.locator(".bc-thread-row")).toHaveCount(2);
  await page.getByRole("button", { name: "New chat", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Start a conversation", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Write a weekly activity SQL query");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator("pre")).toContainText("SELECT");
  await page.getByRole("button", { name: "Pin this thread", exact: true }).click();
  await page.getByRole("button", { name: /Threads,/ }).click();
  await page.getByRole("tab", { name: "Pinned", exact: true }).click();
  await expect(page.locator(".bc-thread-row")).toHaveCount(3);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("measured type and primary frames remain aligned with the public desktop preview", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(route);
  await expect(page.locator(".bc-composer")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  expect(
    await page
      .locator(".bc-answer-body")
      .last()
      .evaluate((element) => element.getBoundingClientRect().width),
  ).toBe(720);
  await expect(page.locator(".bc-answer-body > p").first()).toHaveCSS("font-size", "15px");
  await expect(page.locator(".bc-answer-body > p").first()).toHaveCSS("line-height", "24px");
  await expect(page.locator("pre").first()).toHaveCSS("font-size", "13px");
  await expect(page.locator(".bc-header")).toHaveCSS("height", "48px");
  await expect(page.locator(".bc-composer")).toHaveCSS("width", "720px");
  await expect(page.locator(".bc-composer")).toHaveCSS("height", "88px");
});

test("reasoning and regeneration preserve the reference's activity and stopped states", async ({
  page,
  context,
}) => {
  await page.goto(route);
  const reasoning = page
    .getByRole("button", { name: "Reasoning, thought for 6 seconds", exact: true })
    .last();
  await reasoning.click();
  const list = page.locator(".bc-reason-list").last();
  await expect(list.locator("li")).toHaveCount(3);
  expect(await list.evaluate((element) => element.getBoundingClientRect().height)).toBe(72);
  await reasoning.click();
  const previous = await page.locator("[data-chat-node]").last().getAttribute("data-chat-node");
  await page.getByRole("button", { name: "Regenerate reply", exact: true }).last().click();
  await expect(page.getByRole("status").filter({ hasText: "Trimming the figure" })).toBeVisible();
  await expect(page.locator("[data-chat-node]").last()).toHaveAttribute(
    "data-chat-node",
    previous!,
  );
  await page.getByRole("button", { name: "Stop response", exact: true }).click();
  await expect(page.locator("[data-chat-node]").last()).toContainText("Stopped by you");
  await expect(page.getByText("0 Documents Read", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Follow ups" })).toHaveCount(0);
  await page.getByRole("button", { name: "Reply version 1 of 3", exact: true }).last().click();
  await expect(page.locator("[data-chat-node]").last()).toHaveAttribute(
    "data-chat-node",
    previous!,
  );
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByRole("button", { name: "Copy code", exact: true }).last().click();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("## Highlights");
});
