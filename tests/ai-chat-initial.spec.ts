import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
async function open(page: Page, id: number) {
  await page.goto(`./#/preview/ai-agents/ai-chat/ai-chat-${id}`);
  await expect(page.locator("[data-ai-chat]")).toBeVisible();
}
const observed = new WeakMap<Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  observed.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 950 });
});
test.afterEach(async ({ page }) => expect(observed.get(page)).toEqual([]));

test("copilot starter binds context, real model controls affect the reply and export matches clipboard", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, 1);
  await page
    .getByRole("button", { name: "Draft a customer note for release 4.2", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Message the assistant", exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Remove release-notes-4.2.md", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Choose model", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Claude Sonnet", exact: true }).click();
  await page.getByRole("button", { name: "Extended thinking", exact: true }).click();
  await page.getByRole("button", { name: "Web search", exact: true }).click();
  await page.getByRole("textbox", { name: "Message the assistant", exact: true }).press("Enter");
  await expect(page.getByText("Reply ready", { exact: true })).toBeAttached();
  await expect(page.getByText(/Context used: release-notes-4.2.md/)).toBeVisible();
  await expect(page.getByText(/Web search is staged for this demo/)).toBeVisible();
  await expect(page.getByText(/I separated the proposed change/)).toBeVisible();
  await page.getByRole("button", { name: "Copy reply", exact: true }).click();
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain("Release 4.2");
  await page.getByRole("button", { name: "Conversation actions", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export transcript", exact: true }).click();
  expect(await readFile((await (await download).path())!, "utf8")).toContain(copied);
  await page.getByRole("button", { name: "Good reply", exact: true }).click();
  await expect(page.getByRole("button", { name: "Good reply", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.getByRole("button", { name: "Regenerate reply", exact: true }).click();
  await expect(page.getByRole("button", { name: "Good reply", exact: true })).toHaveAttribute(
    "aria-pressed",
    "false",
  );
  await page.getByRole("button", { name: "Copy reply", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).not.toBe(copied);
});

test("copilot preserves a stopped partial answer and history restores the same local thread", async ({
  page,
}) => {
  await open(page, 1);
  const field = page.getByRole("textbox", { name: "Message the assistant", exact: true });
  await field.fill("Explain the next workspace review step");
  await field.press("Enter");
  await expect(page.getByText(/Here is a practical/)).toBeVisible();
  await page.getByRole("button", { name: "Stop response", exact: true }).click();
  await expect(
    page.getByText("Stopped by you · partial draft kept", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Start new conversation", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "What would you like to work on?", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Chat history", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search conversations", exact: true })
    .fill("next workspace review");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Explain the next workspace review step", exact: true })
    .click();
  await expect(
    page.getByText("Stopped by you · partial draft kept", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Context window", exact: true }).click();
  await expect(page.getByText(/64,000 estimated tokens/)).toBeVisible();
});

test("docked assistant inserts the exact reply into its document and both undo paths work", async ({
  page,
}) => {
  await open(page, 2);
  await page.getByRole("button", { name: "Insert into draft", exact: true }).click();
  await expect(page.locator("[data-inserted-draft]")).toContainText("Release 4.2 focuses");
  await expect(page.getByText("Inserted locally", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Undo insert", exact: true }).click();
  await expect(page.locator("[data-inserted-draft]")).not.toBeVisible();
  await page.getByRole("button", { name: "Insert into draft", exact: true }).click();
  await page.getByRole("button", { name: "Undo insertion", exact: true }).click();
  await expect(page.locator("[data-inserted-draft]")).not.toBeVisible();
  await page.getByRole("button", { name: "Close assistant", exact: true }).click();
  await expect(
    page.getByRole("complementary", { name: "Docked assistant", exact: true }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "Open assistant", exact: true }).click();
  await expect(page.getByRole("button", { name: "Insert into draft", exact: true })).toBeVisible();
});

test("welcome starter attaches context and the actual Questionnaire validates, advances and builds the chosen plan", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, 3);
  await page.getByRole("button", { name: /Plan a project Answer a short brief/ }).click();
  await expect(
    page.getByRole("button", { name: "Remove workspace-roadmap.md", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Thinking effort", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Deep", exact: true }).click();
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.locator('[data-slot="questionnaire"]')).toBeVisible();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(
    page.getByRole("group", { name: "What are we planning?", exact: true }),
  ).toBeVisible();
  await page.getByRole("radio", { name: /^A product launch/ }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("radio", { name: /^Customers/ }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("radio", { name: /^One month/ }).check();
  await page.getByRole("button", { name: "Build plan", exact: true }).click();
  await expect(page.locator('[data-slot="questionnaire"]')).not.toBeVisible();
  await expect(page.getByText(/Audience: customers. Working window: one month./)).toBeVisible();
  await expect(page.getByText(/Week 4: validate/)).toBeVisible();
  await expect(page.getByText("Plan built from your answers", { exact: true })).toBeAttached();
});

test("three chat layouts stay within a narrow viewport and mobile document chat uses its real Sheet", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const id of [1, 2, 3]) {
    await open(page, id);
    if (id === 2) {
      await expect(
        page.getByRole("dialog", { name: "Document assistant", exact: true }),
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("dialog")).not.toBeVisible();
      await page.getByRole("button", { name: "Open assistant", exact: true }).click();
      await expect(page.getByRole("dialog")).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
  }
});

test("Code starter uses the actual REUI CodeBlock and copies only the rendered code", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, 1);
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await page
    .getByRole("button", { name: "Write a TypeScript helper for workspace limits", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Remove workspace-settings.ts", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Reply ready", { exact: true })).toBeAttached();
  await page.getByRole("button", { name: "Copy code", exact: true }).click();
  const code = await page.evaluate(() => navigator.clipboard.readText());
  expect(code).toContain("export function withinLimit");
  expect(code).toContain("return count >= 0 && count <= limit;");
  expect(code).not.toContain("Context used");
  await expect(page.getByText(/Context used: workspace-settings.ts/)).toBeVisible();
});

test("actual Questionnaire supports letter choices and submit shortcuts, then focuses the generated plan", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await open(page, 3);
  await page.getByRole("button", { name: /Plan a project Answer a short brief/ }).click();
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  const next = page.getByRole("button", { name: "Next", exact: true });
  const advance = process.platform === "darwin" ? "Meta+Enter" : "Control+Enter";
  await next.focus();
  await page.keyboard.press("b");
  await expect(page.getByRole("radio", { name: /^A workspace improvement/ })).toBeChecked();
  await page.keyboard.press(advance);
  await expect(
    page.getByRole("group", { name: "Who is this plan for?", exact: true }),
  ).toBeVisible();
  await next.focus();
  await page.keyboard.press("a");
  await expect(page.getByRole("radio", { name: /^The internal team/ })).toBeChecked();
  await page.keyboard.press(advance);
  const submit = page.getByRole("button", { name: "Build plan", exact: true });
  await submit.focus();
  await page.keyboard.press("a");
  await expect(page.getByRole("radio", { name: /^One week/ })).toBeChecked();
  await page.keyboard.press(advance);
  const result = page
    .locator('[data-slot="bubble-content"]')
    .filter({ hasText: "Plan for a workspace improvement" });
  await expect(result).toBeFocused();
  await expect(result).toContainText("Audience: the internal team. Working window: one week.");
  await expect(result).toContainText("Day 5: validate");
});

test("actual MessageScroller lets the reader leave the live edge and jump back after long replies", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 620 });
  await open(page, 1);
  const field = page.getByRole("textbox", { name: "Message the assistant", exact: true });
  for (const [index, prompt] of [
    "Draft release one",
    "Draft release two",
    "Draft release three",
  ].entries()) {
    await field.fill(prompt);
    await field.press("Enter");
    await expect(page.getByText("Reply ready", { exact: true })).toHaveCount(index + 1);
  }
  const viewport = page.locator('[data-slot="message-scroller-viewport"]');
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await viewport.hover();
  await page.mouse.wheel(0, -1400);
  const jump = page.getByRole("button", { name: "Scroll to end", exact: true });
  await expect(jump).toHaveAttribute("data-active", "true");
  const previous = await viewport.evaluate((node) => node.scrollTop);
  await jump.click();
  await expect.poll(() => viewport.evaluate((node) => node.scrollTop)).toBeGreaterThan(previous);
  await expect(jump).toHaveAttribute("data-active", "false");
});

test("removing a context chip never submits the form and Shift Enter keeps a multiline draft", async ({
  page,
}) => {
  await open(page, 1);
  await page
    .getByRole("button", { name: "Draft a customer note for release 4.2", exact: true })
    .click();
  await page.getByRole("button", { name: "Remove release-notes-4.2.md", exact: true }).click();
  await expect(page.getByRole("button", { name: "Stop response", exact: true })).not.toBeVisible();
  const field = page.getByRole("textbox", { name: "Message the assistant", exact: true });
  await field.fill("A first line");
  await field.press("End");
  await field.press("Shift+Enter");
  await field.pressSequentially("A second line");
  await expect(field).toHaveValue("A first line\nA second line");
  await expect(page.getByText("Reply ready", { exact: true })).not.toBeAttached();
});
