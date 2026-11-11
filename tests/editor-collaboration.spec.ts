import { expect, test } from "@playwright/test";

for (const { library, prefix, width } of [
  { library: "radix", prefix: "./", width: 1440 },
  { library: "base", prefix: "./base/", width: 390 },
]) {
  test(`${library} collaboration merges concurrent offline edits and anchored discussion`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.clock.install();
    await page.goto(`${prefix}#/preview/application/rich-text-editor/rich-text-editor-4`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", library);

    const editor = page.getByRole("textbox", { name: "Rich text document", exact: true });
    const online = page.getByRole("switch", { name: "Online mode", exact: true });
    const comments = page.getByRole("complementary", { name: "Document comments" });
    const paragraph = editor.locator(":scope > p").first();
    await expect(paragraph).toContainText("Shared reply drafts let");
    await expect(online).toBeChecked();
    await expect(comments.getByRole("heading", { name: "Comments", exact: true })).toBeVisible();
    await online.click();
    await expect(online).not.toBeChecked();
    await expect(page.getByRole("button", { name: "Mira Stone, Not synced" })).toBeVisible();

    await paragraph.click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+ArrowUp" : "Control+Home");
    await page.keyboard.insertText("Local offline note. ");
    await expect(paragraph).toContainText("Local offline note.");
    await page.clock.runFor(3200);
    await expect(paragraph).not.toContainText("Confirm the handoff in the activity log.");
    await expect(editor.locator(".rich-text-peer-caret")).toHaveCount(0);

    await online.click();
    await expect(paragraph).toContainText("Confirm the handoff in the activity log.");
    await expect(paragraph).toContainText("Local offline note.");
    await expect(editor.locator(".rich-text-peer-caret").first()).toBeVisible();
    await comments.getByRole("button", { name: "Leo Grant Sep 25", exact: true }).click();
    await expect(
      comments.getByText("I added a note to track the handoff in the activity log."),
    ).toBeVisible();

    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(paragraph).not.toContainText("Local offline note.");
    await expect(paragraph).toContainText("Confirm the handoff in the activity log.");

    await paragraph.click();
    await page.keyboard.press(process.platform === "darwin" ? "Meta+ArrowUp" : "Control+Home");
    await page.keyboard.press("Shift+ArrowRight");
    await page.keyboard.press("Shift+ArrowRight");
    await page.getByRole("button", { name: "Comment", exact: true }).click();
    const composer = comments.getByRole("textbox", { name: "Write a comment", exact: true });
    await expect(composer).toBeFocused();
    await composer.fill("Clarify the first line");
    await comments.getByRole("button", { name: "Add comment", exact: true }).click();
    await expect(paragraph.locator("[data-comment]")).toHaveText("Sh");
    await expect(comments.getByText("Clarify the first line")).toBeVisible();

    const reply = comments.getByRole("textbox", { name: "Write a reply", exact: true });
    await reply.fill("The scope is clear now.");
    await comments.getByRole("button", { name: "Reply", exact: true }).click();
    await expect(comments.getByText("The scope is clear now.")).toBeVisible();
    await comments.getByRole("button", { name: "Resolve thread from Alex Morgan" }).click();
    await expect(comments.getByText("Clarify the first line")).toBeHidden();
    await comments.getByRole("switch", { name: "Resolved" }).click();
    await comments.getByRole("button", { name: "Reopen thread from Alex Morgan" }).click();
    await expect(comments.getByText("Clarify the first line")).toBeVisible();
    await page.reload();
    await expect(paragraph).toContainText("Confirm the handoff in the activity log.");
    await expect(paragraph.locator("[data-comment]")).toHaveText("Sh");
    await expect(comments.getByText("Clarify the first line")).toBeVisible();
    expect(errors).toEqual([]);
  });
}
