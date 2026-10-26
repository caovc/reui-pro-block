import { test, expect } from "@playwright/test";
import { createChatState, type ChatMeta } from "../src/blocks/data/ai-chat-session";
import { sendQuotedMessage } from "../src/blocks/data/ai-chat-quote-model";

const observedErrors = new WeakMap<import("@playwright/test").Page, string[]>();
test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  observedErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
});
test.afterEach(async ({ page }) => expect(observedErrors.get(page)).toEqual([]));

const meta: ChatMeta = {
  model: "Auto",
  effort: "Instant",
  contextIds: ["release"],
  webSearch: false,
  thinking: false,
};

test("quoted message binds its exact sentence and personalization to an immutable local reply", () => {
  const initial = createChatState("release");
  const quote = "Keep the limit label clear.";
  const result = sendQuotedMessage(initial, "Explain this", meta, quote, false);
  const reply = result.threads.find((thread) => thread.id === "release")!.turns.at(-1)!;
  expect(reply.body).toContain(`Regarding “${quote}”`);
  expect(reply.body).toContain("Personalization is off");
  expect(initial.threads[0].turns).toHaveLength(2);
  expect(sendQuotedMessage(result, "second", meta, "", true)).toBe(result);
});

test("quote sidebar captures an actual text selection, stages only its two sources and shapes the next reply", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("./#/preview/ai-agents/ai-chat/ai-chat-4");
  const assistant = page.locator('[data-slot="sidebar-inner"]');
  await expect(assistant).toBeVisible();
  const paragraph = assistant.locator('[data-slot="bubble-content"] p').first();
  const selected = await paragraph.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
    node.dispatchEvent(new PointerEvent("pointerup", { bubbles: true }));
    return selection.toString().trim();
  });
  await assistant.getByRole("button", { name: "Reply to selection", exact: true }).click();
  await expect(assistant.locator("[data-quoted-draft]")).toContainText(selected);
  await assistant
    .getByRole("switch", { name: "Personalize for this workspace", exact: true })
    .uncheck();
  await assistant.getByRole("button", { name: "Attach context", exact: true }).click();
  await expect(page.getByRole("menuitem")).toHaveCount(2);
  await page.getByRole("menuitem", { name: /release-notes-4.2.md/ }).click();
  const field = assistant.getByRole("textbox", { name: "Message the assistant", exact: true });
  await field.fill("Explain this in plain language");
  await field.press("Enter");
  await expect(assistant.getByText("Reply ready", { exact: true })).toHaveCount(2);
  await expect(assistant.locator("[data-replied-quote]")).toHaveText(selected);
  await expect(assistant.getByText(/Personalization is off; this draft uses only/)).toBeVisible();
  await expect(assistant.locator("[data-quoted-draft]")).not.toBeVisible();
  await assistant.getByRole("button", { name: "Copy reply", exact: true }).last().click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(selected);
});

test("real Command suggestions support arrow/enter and floating Sidebar pushes desktop then uses mobile Sheet", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("./#/preview/ai-agents/ai-chat/ai-chat-4");
  const inset = page.locator('[data-slot="sidebar-inset"]');
  const before = await inset.evaluate((node) => node.getBoundingClientRect().width);
  await page.getByRole("button", { name: "Toggle quote assistant", exact: true }).click();
  await expect
    .poll(() => inset.evaluate((node) => node.getBoundingClientRect().width))
    .toBeGreaterThan(before + 300);
  await page.getByRole("button", { name: "Toggle quote assistant", exact: true }).click();
  await page.getByRole("button", { name: "Suggested prompts", exact: true }).click();
  const command = page.getByRole("combobox", { name: "Find a suggested prompt", exact: true });
  await expect(command).toBeFocused();
  await command.press("ArrowDown");
  await command.press("Enter");
  const field = page.getByRole("textbox", { name: "Message the assistant", exact: true });
  await expect(field).toHaveValue("Rewrite this as a shorter sentence");
  await expect(field).toBeFocused();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole("button", { name: "Toggle quote assistant", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Quote reply assistant", exact: true }),
  ).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Toggle quote assistant", exact: true }),
  ).toBeFocused();
});

test("connected apps keep disconnected sources skipped, and explicit Connect replays only that receipt", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("./#/preview/ai-agents/ai-chat/ai-chat-5");
  await page.getByRole("radio", { name: "Catch me up", exact: true }).check();
  await page
    .getByRole("textbox", { name: "Message the assistant", exact: true })
    .fill("Catch me up on the workspace release");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Answer ready", { exact: true })).toBeAttached();
  await expect(page.locator('[data-source-receipt="loom"]')).toContainText("Skipped");
  await expect(page.locator("[data-scoped-answer]")).toContainText(
    "Sources read: Google Drive, Slack, Calendar.",
  );
  await page.getByRole("button", { name: "Connect Loom and read source", exact: true }).click();
  await expect(page.getByText("Answer ready", { exact: true })).toBeAttached();
  await expect(page.locator('[data-source-receipt="loom"]')).toContainText(
    "Read original local demo content",
  );
  await expect(page.locator("[data-scoped-answer]")).toContainText(
    "Sources read: Google Drive, Slack, Calendar, Loom.",
  );
  await page.getByRole("button", { name: "Disconnect Google Drive", exact: true }).click();
  await expect(page.locator('[data-source-receipt="drive"]')).toContainText(
    "Read original local demo content",
  );
  await page.getByRole("radio", { name: "Find an answer", exact: true }).check();
  await expect(
    page.getByRole("textbox", { name: "Message the assistant", exact: true }),
  ).toHaveValue("What do we know about the workspace export?");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Answer ready", { exact: true })).toBeAttached();
  await expect(page.locator("[data-scoped-answer]")).toContainText(
    "No permitted source produced evidence.",
  );
  await expect(page.locator('[data-source-receipt="drive"]')).toContainText("Skipped");
});

test("actual multi-select Combobox scopes apps with keyboard and four job modes produce distinct request plans", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/preview/ai-agents/ai-chat/ai-chat-5");
  await page.getByRole("combobox", { name: "Choose connected apps", exact: true }).click();
  const search = page.getByRole("combobox", { name: "Find an app", exact: true });
  await search.fill("Zoom");
  await expect(page.getByRole("option")).toHaveCount(1);
  await expect(page.getByRole("option")).toContainText("Zoom");
  await search.press("ArrowDown");
  await search.press("Enter");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "Disconnect Zoom", exact: true })).toBeVisible();
  await page.getByRole("radio", { name: "Prepare a meeting", exact: true }).check();
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(page.getByText("Answer ready", { exact: true })).toBeAttached();
  await expect(page.locator("[data-scoped-answer]")).toContainText("Suggested agenda");
  await expect(page.locator('[data-source-receipt="zoom"]')).toContainText(
    "Read original local demo content",
  );
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});

async function confirmTaskBrief(page: import("@playwright/test").Page) {
  await page.getByRole("radio", { name: /^Selected workspace sources/ }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("radio", { name: /^A working checklist/ }).check();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("radio", { name: /^A detailed validation pass/ }).check();
  await page.getByRole("button", { name: "Build task plan", exact: true }).click();
}

test("agentic task runs the edited plan, retries its failure, drops the chosen branch and hands off an actual artifact", async ({
  page,
}) => {
  const { readFile } = await import("node:fs/promises");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 950 });
  await page.goto("./#/preview/ai-agents/ai-chat/ai-chat-6");
  await confirmTaskBrief(page);
  await page
    .getByRole("textbox", { name: "Edit write step", exact: true })
    .fill("Write the final review checklist");
  await page.getByRole("button", { name: "Run selected plan", exact: true }).click();
  await expect(page.getByText(/Demo comparison check failed/)).toBeVisible();
  await expect(
    page.getByRole("status").filter({ hasText: "Comparison step failed" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Retry compare step", exact: true }).click();
  await expect(
    page.locator("p[role=status]").filter({ hasText: /Task running|Your answer is needed/ }),
  ).toBeFocused();
  await page.getByRole("radio", { name: /^Omit the example branch/ }).check();
  await page.getByRole("button", { name: "Continue plan", exact: true }).click();
  await expect(page.locator("[data-task-artifact]")).toBeVisible();
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download artifact", exact: true }).click();
  const artifact = await readFile((await (await downloaded).path())!, "utf8");
  expect(artifact).toContain("# Workspace review checklist");
  expect(artifact).toContain("Write the final review checklist");
  expect(artifact).toContain("Customer example omitted");
  expect(artifact).toContain("Detailed review: verify keyboard access");
  expect(artifact).not.toContain("Illustrative example: a workspace export");
  await page.getByRole("combobox", { name: "Assign the finished work", exact: true }).click();
  await page.getByRole("option", { name: "Sam · Engineering", exact: true }).click();
  await page.getByRole("button", { name: "Create local ticket", exact: true }).click();
  await expect(page.locator("[data-created-task]")).toContainText("Owner: sam");
  await expect(page.locator("[data-created-task]")).toContainText("workspace-checklist.md");
  await page.getByRole("checkbox", { name: "Permit customer-research.md", exact: true }).uncheck();
  await expect(
    page.getByRole("status").filter({ hasText: "Context changed · task rewound to its brief" }),
  ).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Which context may I use?", exact: true }),
  ).toBeVisible();
  await expect(page.locator("[data-task-artifact]")).not.toBeVisible();
});

test("task pause cancels its timer, then mobile Sidebar and explicitly excluded plan steps stay functional", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("./#/preview/ai-agents/ai-chat/ai-chat-6");
  await page.getByRole("button", { name: "Toggle task assistant", exact: true }).click();
  await expect(
    page.getByRole("dialog", { name: "Agentic task assistant", exact: true }),
  ).toBeVisible();
  await confirmTaskBrief(page);
  await page.getByRole("checkbox", { name: "Include example step", exact: true }).uncheck();
  await page.getByRole("button", { name: "Run selected plan", exact: true }).click();
  await page.getByRole("button", { name: "Pause task", exact: true }).click();
  await page.waitForTimeout(1100);
  await expect(page.getByRole("button", { name: "Resume task", exact: true })).toBeVisible();
  await expect(page.getByText(/Demo comparison check failed/)).not.toBeVisible();
  await page.getByRole("button", { name: "Resume task", exact: true }).click();
  await expect(page.getByText(/Demo comparison check failed/)).toBeVisible();
  await page.getByRole("button", { name: "Skip compare step", exact: true }).click();
  await expect(page.locator("[data-task-artifact]")).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Should the artifact include an example?", exact: true }),
  ).not.toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
});
