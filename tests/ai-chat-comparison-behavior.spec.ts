import { test, expect, type Locator, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import {
  comparisonEvidence,
  openComparison,
  comparisonModelControls,
} from "./ai-chat-comparison-native-helpers";
test.describe.configure({ timeout: 30000, retries: 0 });
async function choose(page: Page, shell: Locator, index: number, name: RegExp) {
  const trigger = shell.getByRole("combobox").nth(index);
  await trigger.click();
  const controls = await comparisonModelControls(page, shell, index);
  expect(controls).toBeTruthy();
  const list = page.getByRole("listbox").and(page.locator(`[id="${controls}"]`));
  await expect(list).toBeVisible();
  await list.getByRole("option", { name }).click();
  await expect(list).toHaveCount(0);
}
for (const primitive of ["radix", "base"] as const) {
  test(`${primitive} desktop: actual keyboard divider, coupled wheel scroll and numeric reply sorting`, async ({
    page,
    baseURL,
  }, info) => {
    const { shell, faults } = await openComparison(page, baseURL, primitive);
    const divider = shell.getByRole("separator", {
      name: "Resize model comparison panes",
      exact: true,
    });
    await shell.getByRole("button", { name: "New comparison", exact: true }).focus();
    let reached = false;
    for (let i = 0; i < 45; i++) {
      await page.keyboard.press("Tab");
      if (await divider.evaluate((node) => document.activeElement === node)) {
        reached = true;
        break;
      }
    }
    expect(reached, "The genuine divider must be reachable by Tab").toBe(true);
    const before = await shell
      .locator('[data-slot="resizable-panel"]')
      .first()
      .evaluate((node) => node.getBoundingClientRect().width);
    await page.keyboard.press("ArrowRight");
    await expect
      .poll(() =>
        shell
          .locator('[data-slot="resizable-panel"]')
          .first()
          .evaluate((node) => node.getBoundingClientRect().width),
      )
      .toBeGreaterThan(before);
    const views = shell.locator('[data-slot="message-scroller-viewport"]');
    const left = views.nth(0);
    const right = views.nth(1);
    const box = await left.boundingBox();
    if (!box) throw new Error("Actual transcript has no viewport");
    await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2);
    const leftBefore = await left.evaluate((node) => node.scrollTop);
    await page.mouse.wheel(0, -300);
    await expect.poll(() => left.evaluate((node) => node.scrollTop)).toBeLessThan(leftBefore);
    await expect
      .poll(async () => {
        const ratios = await views.evaluateAll((nodes) =>
          nodes.map((node) => node.scrollTop / Math.max(1, node.scrollHeight - node.clientHeight)),
        );
        return Math.abs(ratios[0] - ratios[1]);
      })
      .toBeLessThan(0.02);
    const lock = shell.getByRole("button", {
      name: "Lock both transcripts to one scroll position",
      exact: true,
    });
    await lock.click();
    await expect(lock).toHaveAttribute("aria-pressed", "false");
    const rightBefore = await right.evaluate((node) => node.scrollTop);
    const unlockedLeftBefore = await left.evaluate((node) => node.scrollTop);
    await page.mouse.move(box.x + box.width - 8, box.y + box.height / 2);
    await page.mouse.wheel(0, 180);
    await expect
      .poll(() => left.evaluate((node) => node.scrollTop))
      .toBeGreaterThan(unlockedLeftBefore);
    expect(await right.evaluate((node) => node.scrollTop)).toBe(rightBefore);
    const table = shell.getByRole("table", {
      name: "August team cancellations by driver",
      exact: true,
    });
    await table.getByRole("button", { name: "Sort by Accounts", exact: true }).click();
    await expect(
      table.getByRole("columnheader", { name: "Sort by Accounts", exact: true }),
    ).toHaveAttribute("aria-sort", "ascending");
    await expect(table.locator("tbody tr").first().locator("td")).toHaveText([
      "No signal",
      "2",
      "21",
    ]);
    await table.getByRole("button", { name: "Sort by Accounts", exact: true }).click();
    await expect(table.locator("tbody tr").first().locator("td")).toHaveText([
      "Renewal discount",
      "8",
      "5",
    ]);
    await comparisonEvidence(page, info, "keyboard-scroll-sort");
    expect(faults).toEqual([]);
  });
  test(`${primitive} desktop: models, regeneration, ratings, preference and exact visible answer copy stay independent`, async ({
    page,
    context,
    baseURL,
  }, info) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const { shell, faults } = await openComparison(page, baseURL, primitive);
    const right = shell.getByRole("group", { name: "GPT-5.1 answer 2", exact: true });
    const rightOriginal = await right.innerText();
    await choose(page, shell, 0, /Claude Haiku 4\.5/);
    await expect(shell.getByRole("button", { name: /^Prefer A, Claude Haiku/ })).toBeVisible();
    expect(await right.innerText()).toBe(rightOriginal);
    const answer = shell.getByRole("group", { name: "Claude Haiku 4.5 answer 2", exact: true });
    const original = await answer.locator(".comparison-answer-body").innerText();
    await shell
      .getByRole("button", { name: "Regenerate the Claude Haiku 4.5 answer", exact: true })
      .click();
    await expect(shell.getByRole("button", { name: /^Prefer A, Claude Haiku/ })).toBeVisible();
    expect(await answer.locator(".comparison-answer-body").innerText()).not.toBe(original);
    expect(await right.innerText()).toBe(rightOriginal);
    const prefer = shell.getByRole("button", { name: /^Prefer A, Claude Haiku/ });
    await prefer.click();
    await expect(prefer).toHaveAttribute("aria-pressed", "true");
    await expect(answer.getByText("Preferred", { exact: true })).toBeVisible();
    await answer.hover();
    const like = answer.getByRole("button", { name: "Like answer", exact: true });
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", "true");
    await like.click();
    await expect(like).toHaveAttribute("aria-pressed", "false");
    const first = await answer.locator(".comparison-answer-body > p").first().innerText();
    const last = await answer.locator(".comparison-answer-body > p").last().innerText();
    await answer.getByRole("button", { name: "Copy answer", exact: true }).click();
    await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toContain(first);
    const copied = await page.evaluate(() => navigator.clipboard.readText());
    expect(copied).toContain(last);
    expect(copied).toContain("from retention_aug");
    expect(copied).toContain("order by accounts desc;");
    await comparisonEvidence(page, info, "independent-model-reply-copy");
    expect(faults).toEqual([]);
  });
  test(`${primitive} phone: native tab keyboard, stopped local streams and model-local retry preserve the other answer`, async ({
    page,
    baseURL,
  }, info) => {
    const { shell, faults } = await openComparison(page, baseURL, primitive, 390);
    const first = shell.getByRole("tab", { name: "Claude Sonnet 5", exact: true });
    await first.focus();
    await page.keyboard.press("End");
    await expect(shell.getByRole("tab", { name: "GPT-5.1", exact: true })).toBeFocused();
    await expect(shell.getByRole("tabpanel", { name: "GPT-5.1", exact: true })).toBeVisible();
    await shell.getByRole("button", { name: "New comparison", exact: true }).click();
    const field = shell.getByRole("textbox", { name: "Prompt both models", exact: true });
    await field.fill("Rank the cancellation drivers for our review");
    await field.press("Enter");
    await expect(field).toHaveValue("");
    await shell.getByRole("button", { name: "Stop generating", exact: true }).click();
    await expect(
      shell.getByText("Stopped by you · partial answer kept", { exact: true }),
    ).toBeVisible();
    await shell.getByRole("tab", { name: "Claude Sonnet 5", exact: true }).click();
    const stopped = shell.getByRole("group", { name: "Claude Sonnet 5 answer 3", exact: true });
    const leftText = await stopped.innerText();
    await shell.getByRole("tab", { name: "GPT-5.1", exact: true }).click();
    await choose(page, shell, 0, /Gemini 3 Pro/);
    await expect(shell.getByRole("alert")).toContainText("local demo is simulating a rate limit");
    await shell.getByRole("button", { name: "Retry", exact: true }).click();
    await expect(shell.getByRole("button", { name: "Stop generating", exact: true })).toHaveCount(
      0,
    );
    await expect(
      shell.getByRole("group", { name: "Gemini 3 Pro answer 3", exact: true }),
    ).toContainText("Validation checks:");
    await shell.getByRole("tab", { name: "Claude Sonnet 5", exact: true }).click();
    expect(await stopped.innerText()).toBe(leftText);
    await comparisonEvidence(page, info, "phone-stop-retry");
    expect(faults).toEqual([]);
  });
  test(`${primitive} phone: quote, actual file metadata and transcript download remain local`, async ({
    page,
    context,
    baseURL,
  }, info) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const { shell, faults } = await openComparison(page, baseURL, primitive, 390);
    const answer = shell.getByRole("group", { name: "Claude Sonnet 5 answer 2", exact: true });
    const quote = await answer.locator(".comparison-answer-body > p").first().innerText();
    const quoteButton = answer.getByRole("button", { name: "Quote answer", exact: true });
    await quoteButton.focus();
    await page.keyboard.press("Enter");
    const field = shell.getByRole("textbox", { name: "Prompt both models", exact: true });
    await expect(field).toBeFocused();
    await expect(field).toHaveValue("Explain this part of the answer.");
    await expect(shell.locator(".comparison-quote")).toContainText(quote);
    const chooser = page.waitForEvent("filechooser");
    await shell.getByRole("button", { name: "Attach a file", exact: true }).click();
    await (
      await chooser
    ).setFiles({
      name: "review-notes.md",
      mimeType: "text/markdown",
      buffer: Buffer.from("Independent local review notes\n"),
    });
    await expect(
      shell.getByRole("button", { name: "Remove review-notes.md", exact: true }),
    ).toBeVisible();
    await field.press("Enter");
    await expect(shell.getByRole("button", { name: /^Prefer A,/ })).toBeVisible();
    const trigger = shell.getByRole("button", {
      name: "More actions for Claude Sonnet 5",
      exact: true,
    });
    await trigger.click();
    const download = page.waitForEvent("download");
    await page.getByRole("menuitem", { name: "Download comparison", exact: true }).click();
    const file = await download;
    await file.saveAs(info.outputPath("model-comparison.md"));
    const text = await readFile((await file.path())!, "utf8");
    expect(file.suggestedFilename()).toBe("model-comparison.md");
    expect(text).toContain("# Claude Sonnet 5");
    expect(text).toContain("# GPT-5.1");
    expect(text).toContain(quote);
    expect(text).toContain("Context: retention-aug.csv, review-notes.md");
    await comparisonEvidence(page, info, "phone-quote-file-export");
    expect(faults).toEqual([]);
  });
}
