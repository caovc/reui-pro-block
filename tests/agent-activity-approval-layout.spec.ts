import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

const route = "./#/preview/ai-agents/agent-activity/agent-activity-1";
const leaf = "src/blocks/data/agent-activity-approval.tsx";
async function open(page: Page) {
  await page.goto(route);
  await expect(page.locator("[data-approval-card]")).toBeVisible();
}
async function menu(page: Page) {
  // View and Density choices now retain the original public menu's open state.
  if (!(await page.getByRole("menu").isVisible()))
    await page.getByRole("button", { name: "Approval run actions", exact: true }).click();
}

for (const width of [1440, 390, 393]) {
  test(`Activity1 compact continuous sequence and inline gate fit ${width}px`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width, height: 950 });
    await open(page);
    await expect(page.getByText("Run complete", { exact: true })).not.toBeVisible();
    const card = page.locator("[data-approval-card]");
    const box = (await card.boundingBox())!;
    expect(box.width).toBeCloseTo(Math.min(576, width - 48), 1);
    expect(box.x).toBeCloseTo((width - box.width) / 2, 1);
    expect(box.y).toBe(64);
    expect((await page.locator("[data-approval-header]").boundingBox())!.height).toBeLessThan(60);
    await expect(
      page.getByRole("list", { name: "Visible run steps" }).getByRole("listitem"),
    ).toHaveCount(9);
    for (const row of await page.locator("[data-approval-step]").all())
      await expect(row).toBeVisible();
    const first = page.locator('[data-approval-step="read"]');
    const title = (await first.locator("[data-step-title]").boundingBox())!;
    const path = (await first.locator("[data-step-path]").boundingBox())!;
    const duration = (await first.locator("[data-step-duration]").boundingBox())!;
    expect(duration.x).toBeGreaterThan(title.x + title.width);
    if (width < 640) {
      expect(path.y).toBeGreaterThanOrEqual(title.y + title.height);
      expect(
        await first
          .locator("[data-step-actions]")
          .evaluate((node) => getComputedStyle(node).opacity),
      ).toBe("1");
    }
    // Keep the independent default third approval, then exercise the observed fifth question layout.
    await page.getByRole("button", { name: "Approve", exact: true }).click();
    const answer = page.getByRole("textbox", { name: "Workspace slug", exact: true });
    await expect(answer).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit answer", exact: true })).toBeDisabled();
    expect(await answer.evaluate((node) => node.tagName)).toBe("INPUT");
    const gate = page.locator('[data-approval-step="question"] [data-inline-approval-gate]');
    const gateBox = (await gate.boundingBox())!;
    const inputBox = (await answer.boundingBox())!;
    const sendBox = (await page
      .getByRole("button", { name: "Submit answer", exact: true })
      .boundingBox())!;
    expect(inputBox.x).toBeGreaterThanOrEqual(gateBox.x);
    expect(sendBox.x + sendBox.width).toBeLessThanOrEqual(gateBox.x + gateBox.width + 1);
    expect(Math.abs(inputBox.y - sendBox.y)).toBeLessThan(8);
    for (const row of await page.locator("[data-approval-step]").all())
      await expect(row).toBeVisible();
    const group = gate.locator('[data-slot="input-group"]');
    expect(await group.evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(
      false,
    );
    await page.screenshot({
      path: testInfo.outputPath(`activity1-question-${width}.png`),
      fullPage: true,
    });
  });
}

test("Activity1 actual menu defaults and view controls preserve its gate and restore finished history", async ({
  page,
}) => {
  await open(page);
  const card = page.locator("[data-approval-card]");
  const comfortable = (await card.boundingBox())!.height;
  await menu(page);
  await expect(
    page.getByRole("menuitemcheckbox", { name: "File Paths", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("menuitemcheckbox", { name: "Step Notes", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("menuitemcheckbox", { name: "Fold Finished Steps", exact: true }),
  ).not.toBeChecked();
  await expect(page.getByRole("menuitemradio", { name: "Comfortable", exact: true })).toBeChecked();
  await page.getByRole("menuitemcheckbox", { name: "File Paths", exact: true }).click();
  await expect(page.locator("[data-step-path]")).toHaveCount(0);
  await menu(page);
  await page.getByRole("menuitemradio", { name: "Compact", exact: true }).click();
  await expect(card).toHaveAttribute("data-density", "compact");
  expect((await card.boundingBox())!.height).toBeLessThan(comfortable);
  await menu(page);
  await page.getByRole("menuitemcheckbox", { name: "Step Notes", exact: true }).click();
  await expect(page.locator('[data-approval-step="read"] [data-step-note]')).toContainText(
    "Checked project conventions",
  );
  await menu(page);
  await page.getByRole("menuitemcheckbox", { name: "Fold Finished Steps", exact: true }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator('[data-approval-step="read"]')).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /2 finished steps/ }).click();
  await expect(page.getByRole("list", { name: "Visible run steps" })).toBeFocused();
  await expect(page.locator('[data-approval-step="read"]')).toBeVisible();
});

test("Activity1 question answer and revision stay inside their rows and retain both notes", async ({
  page,
}) => {
  await open(page);
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  const input = page.getByRole("textbox", { name: "Workspace slug", exact: true });
  await input.fill("bricklane-review");
  await input.press("Enter");
  await expect(page.locator('[data-approval-step="question"] [data-recorded-decision]')).toHaveText(
    "bricklane-review",
  );
  await expect(page.getByRole("button", { name: "Revise", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Revise", exact: true }).click();
  const revision = page.getByRole("textbox", { name: "Revision notes", exact: true });
  await expect(revision).toBeFocused();
  await expect(page.getByRole("button", { name: "Send revision", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel revision", exact: true }).click();
  await expect(revision).not.toBeVisible();
  await page.getByRole("button", { name: "Revise", exact: true }).click();
  await revision.fill("Keep this deployment private until review.");
  await revision.press("Enter");
  await expect(
    page.locator('[data-approval-step="publish-gate"] [data-recorded-decision]'),
  ).toHaveText("Keep this deployment private until review.");
  await expect(page.locator('[data-approval-step="publish"]')).toHaveAttribute(
    "data-step-state",
    "skipped",
  );
  await expect(page.locator('[data-approval-step="complete"]')).toHaveAttribute(
    "data-step-state",
    "done",
  );
  await expect(page.locator("[data-approval-footer]")).toContainText("Step 9 of 9");
});

test("Activity1 actual starter carries the refined leaf and its real free dependencies byte for byte", async ({
  page,
}, testInfo) => {
  await page.goto("./#/block/ai-agents/agent-activity/agent-activity-1");
  await page.getByRole("button", { name: "View code", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Source file" })).toHaveText(leaf);
  const downloaded = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const file = await downloaded;
  await file.saveAs(testInfo.outputPath("activity1-refinement-starter.zip"));
  const zip = unzipSync(new Uint8Array(await readFile((await file.path())!)));
  for (const filename of [
    leaf,
    "src/blocks/data/agent-activity-model.ts",
    "src/components/ui/trace.tsx",
    "src/components/ui/marker.tsx",
    "src/components/ui/input-group.tsx",
    "src/components/ui/collapsible.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/badge.tsx",
    "src/components/reui/REUI-LICENSE.txt",
  ]) {
    expect(zip[filename], filename).toBeTruthy();
    expect(strFromU8(zip[filename]), filename).toBe(await readFile(filename, "utf8"));
  }
  expect(strFromU8(zip["src/main.tsx"]).trimStart()).toMatch(/^import ["']\.\/theme\.css["'];/);
});
