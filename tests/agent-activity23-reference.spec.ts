import { test, expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

// Public UI evidence: reference2-menu-desktop/summary-desktop,
// reference2-detailed-phone-settled and reference3-row-detail in this batch.
// Original Bricklane fixture text and real clipboard payloads remain independent.
const SOURCE_URL = "https://www.w3.org/WAI/tutorials/forms/labels/";
const FILE_PATH = "src/workspace/settings.tsx";
const STEP_TARGET = "docs/release.md";
const STEP_OUTPUT = "read_file docs/release.md → 86 lines";
const INTER = /^"?Inter"?(?:,|$)/;
const viewports = [
  { width: 1440, height: 1000 },
  { width: 390, height: 844 },
];

async function openActivity(page: Page, entry: 2 | 3) {
  await page.goto(`./#/preview/ai-agents/agent-activity/agent-activity-${entry}`);
  const root = page.locator(`[data-agent-activity="${entry === 2 ? "live-feed" : "research"}"]`);
  await expect(root).toBeVisible();
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  return root;
}

async function completedFeed(page: Page) {
  const root = await openActivity(page, 2);
  // Preserve the existing streaming completion budget; do not replace it with sleep.
  await expect(root.locator("footer [role=status]")).toHaveText("All steps completed", {
    timeout: 15000,
  });
  await expect(root.getByRole("button", { name: "Rerun", exact: true })).toBeVisible();
  return root;
}

async function completedResearch(page: Page) {
  const root = await openActivity(page, 3);
  await expect(root.getByText("High confidence", { exact: true })).toBeVisible();
  await expect(root.locator('[data-slot="timeline-item"][data-completed]')).toHaveCount(4);
  return root;
}

async function tabTo(page: Page, target: Locator) {
  await expect(target).toBeAttached();
  // Traverse native focus order. Never set DOM focus or click an invisible control.
  for (let step = 0; step < 40; step += 1) {
    if (await target.evaluate((node) => node === node.ownerDocument.activeElement)) return;
    await page.keyboard.press("Tab");
  }
  await expect(target).toBeFocused();
}

async function expectSquare(control: Locator, size: number) {
  const box = await control.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBe(size);
  expect(box!.height).toBe(size);
}

async function expectNoPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
}

async function capture(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: true });
  const geometry = await page
    .locator("[data-agent-activity] [data-slot], [role=menu]")
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const bounds = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          slot: node.getAttribute("data-slot"),
          label: node.getAttribute("aria-label"),
          text: node.textContent?.trim().slice(0, 100),
          x: bounds.x,
          y: bounds.y,
          width: bounds.width,
          height: bounds.height,
          fontFamily: style.fontFamily,
          radius: style.borderRadius,
          opacity: style.opacity,
        };
      }),
    );
  await writeFile(info.outputPath(`${name}.json`), JSON.stringify(geometry, null, 2) + "\n");
}

for (const viewport of viewports) {
  test.describe(`Activity23 public-reference native contract ${viewport.width}px`, () => {
    test.use({ viewport, deviceScaleFactor: 1, colorScheme: "light" });

    test("feed native radio menu retains selection until Escape restores its real trigger", async ({
      page,
    }, info) => {
      const root = await completedFeed(page);
      await capture(page, info, "feed-default-detailed");
      const card = root.locator('[data-slot="card"]').first();
      const cardBox = await card.boundingBox();
      expect(cardBox).not.toBeNull();
      expect(cardBox!.width).toBe(viewport.width === 390 ? 342 : 576);
      expect(cardBox!.x).toBe(viewport.width === 390 ? 24 : 432);
      expect(cardBox!.y).toBe(64);
      expect(cardBox!.height).toBe(454);
      await expect(card).toHaveCSS("font-family", INTER);
      const runBadge = root.locator('[data-slot="card-header"] [data-slot="badge"]');
      await expect(runBadge).toHaveCSS("height", "20px");
      await expect(runBadge).toHaveCSS("font-size", "12px");
      await expect(root.locator('[aria-label="Run steps"] > [data-slot="marker"]')).toHaveCount(8);
      await expect(root.locator("[data-duration]").first()).toHaveText("3.0s");

      const trigger = root.getByRole("button", { name: "Run options", exact: true });
      await expectSquare(trigger, 28);
      const triggerBox = await trigger.boundingBox();
      expect(triggerBox).not.toBeNull();
      await trigger.click();
      const menu = page.getByRole("menu", { name: "Run options", exact: true });
      await expect(menu).toBeVisible();
      // Visibility precedes the native zoom-in animation's settled geometry.
      // Keep the original 5s assertion budget and require the exact target width.
      await expect.poll(async () => (await menu.boundingBox())?.width).toBe(208);
      const menuBox = await menu.boundingBox();
      expect(menuBox).not.toBeNull();
      expect(menuBox!.width).toBe(208);
      expect(menuBox!.height).toBe(205);
      expect(menuBox!.y).toBe(triggerBox!.y + triggerBox!.height + 8);
      expect(menuBox!.x).toBeGreaterThanOrEqual(0);
      expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(viewport.width);
      await expect(menu).toHaveCSS("font-family", INTER);
      await capture(page, info, "feed-menu");
      const detail = menu.getByRole("group", { name: "Detail", exact: true });
      const exports = menu.getByRole("group", { name: "Export", exact: true });
      await expect(detail.getByRole("menuitemradio")).toHaveText(["Summary", "Detailed", "Raw"]);
      await expect(exports.getByRole("menuitem")).toHaveText(["Copy Transcript", "Download Log"]);
      await expect(menu.getByRole("separator")).toHaveCount(1);
      await expect(
        menu.getByRole("menuitem", { name: "Replay all steps", exact: true }),
      ).toHaveCount(0);
      await expect(menu.getByRole("menuitem", { name: "Rerun", exact: true })).toHaveCount(0);
      await expect(
        detail.getByRole("menuitemradio", { name: "Detailed", exact: true }),
      ).toHaveAttribute("aria-checked", "true");
      await expect(detail.getByRole("menuitemradio").first()).toHaveCSS("font-size", "14px");

      const summary = detail.getByRole("menuitemradio", { name: "Summary", exact: true });
      await summary.click();
      await expect(menu).toBeVisible();
      await expect(summary).toHaveAttribute("aria-checked", "true");
      await capture(page, info, "feed-summary");
      await expect(root.locator("[data-duration]").filter({ visible: true })).toHaveCount(0);
      await expect(root.locator('[aria-label="Run steps"] > [data-slot="marker"]')).toHaveCount(8);
      await page.keyboard.press("ArrowDown");
      await expect(
        detail.getByRole("menuitemradio", { name: "Detailed", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(detail.getByRole("menuitemradio", { name: "Raw", exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(menu).toBeVisible();
      await expect(detail.getByRole("menuitemradio", { name: "Raw", exact: true })).toHaveAttribute(
        "aria-checked",
        "true",
      );
      await expect(root.locator('[data-slot="code-block"]')).toContainText("[done] read_file");
      await page.keyboard.press("Escape");
      await expect(menu).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await capture(page, info, "feed-raw");

      await page.keyboard.press("Enter");
      await expect(menu).toBeVisible();
      await page.keyboard.press("Home");
      await expect(summary).toBeFocused();
      await page.keyboard.press("ArrowDown");
      await expect(
        detail.getByRole("menuitemradio", { name: "Detailed", exact: true }),
      ).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(menu).toBeVisible();
      await expect(
        detail.getByRole("menuitemradio", { name: "Detailed", exact: true }),
      ).toHaveAttribute("aria-checked", "true");
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      await expect(root.locator("[data-duration]").first()).toHaveText("3.0s");
      await expectNoPageOverflow(page);
    });

    test("feed native row actions copy the actual target and export the same complete transcript", async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const root = await completedFeed(page);
      const copy = root.getByRole("button", {
        name: "Copy Read the release checklist",
        exact: true,
      });
      await page.mouse.move(0, 0);
      await tabTo(page, copy);
      await expect(copy).toBeFocused();
      await expectSquare(copy, 24);
      await expect(page.getByRole("tooltip", { name: "Copy path", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await expect(copy).toBeFocused();
      await page.evaluate(() => navigator.clipboard.writeText("Before native row target Copy"));
      await page.keyboard.press("Enter");
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe(STEP_TARGET);

      const open = root.getByRole("button", {
        name: "Open file: Read the release checklist",
        exact: true,
      });
      await page.keyboard.press("Tab");
      await expect(open).toBeFocused();
      await expectSquare(open, 24);
      await page.keyboard.press("Enter");
      await expect(page.getByText("docs/release.md · local demo", { exact: true })).toBeVisible();
      await root.getByRole("button", { name: "Run options", exact: true }).click();
      await page.getByRole("menuitem", { name: "Copy Transcript", exact: true }).click();
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toContain(`[done] ${STEP_OUTPUT}`);
      const transcript = await page.evaluate(() => navigator.clipboard.readText());
      expect(transcript).toContain("Bricklane · Workspace release run");
      expect(transcript).toContain(`[done] ${STEP_OUTPUT}`);
      expect(transcript.match(/\[done\]/g)).toHaveLength(8);
      expect(transcript).not.toMatch(/\[(running|queued|cancelled)\]/);
      await root.getByRole("button", { name: "Run options", exact: true }).click();
      const downloading = page.waitForEvent("download");
      await page.getByRole("menuitem", { name: "Download Log", exact: true }).click();
      const download = await downloading;
      expect(download.suggestedFilename()).toBe("run-log.txt");
      expect(await readFile((await download.path())!, "utf8")).toBe(transcript);
      await expectNoPageOverflow(page);
    });

    test("research uses compact native Timeline groups with keyboard-revealed row tooltips", async ({
      page,
    }, info) => {
      const root = await completedResearch(page);
      await page.mouse.move(0, 0);
      await capture(page, info, "research-default");
      const sourceCard = root.locator('[data-slot="card"][aria-label="Cited sources"]');
      const filesCard = root.locator('[data-slot="card"][aria-label="Checked repository files"]');
      const rows = sourceCard.locator('[data-slot="item"]');
      await expect(rows).toHaveCount(3);
      await expect(filesCard.locator('[data-slot="item"]')).toHaveCount(2);
      for (const card of [sourceCard, filesCard]) {
        await expect(card).toHaveCSS("font-family", INTER);
        await expect(card).toHaveCSS("border-radius", "14px");
        const box = await card.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.x).toBe(viewport.width === 390 ? 56 : 464);
        expect(box!.width).toBe(viewport.width === 390 ? 310 : 544);
      }
      const firstRow = rows.first();
      await expect(firstRow.locator('[data-slot="badge"]')).toHaveCSS("font-size", "12px");
      await expect(root.getByText("High confidence", { exact: true })).toHaveCSS(
        "font-size",
        "12px",
      );
      expect((await firstRow.boundingBox())!.height).toBe(34);
      await expect(firstRow).toHaveCSS("font-size", "14px");
      const nodes = root.locator('[data-slot="timeline-indicator"]');
      await expect(nodes).toHaveCount(4);
      for (const node of await nodes.all()) await expectSquare(node, 12);

      const copy = firstRow.getByRole("button", { name: "Copy W3C WAI source URL", exact: true });
      const actions = firstRow.locator('[data-slot="item-actions"]');
      await firstRow.hover();
      await expect(actions).toHaveCSS("opacity", "1");
      await expectSquare(copy, 24);
      await page.mouse.move(0, 0);
      await tabTo(page, copy);
      await expect(copy).toBeFocused();
      await expect(actions).toHaveCSS("opacity", "1");
      await expect(page.getByRole("tooltip", { name: "Copy link", exact: true })).toBeVisible();
      await expect(page.locator('[data-slot="tooltip-content"]').last()).toHaveCSS("opacity", "1");
      await capture(page, info, "research-source-focus");
      await expect(page.locator('[data-slot="tooltip-content"]').last()).toHaveCSS(
        "font-family",
        INTER,
      );
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await expect(copy).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(
        firstRow.getByRole("button", { name: "Open W3C WAI source", exact: true }),
      ).toBeFocused();
      await expectNoPageOverflow(page);
    });

    test("research source and repository actions copy their own real values and open local evidence", async ({
      page,
      context,
    }) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const root = await completedResearch(page);
      const sourceRow = root
        .locator('[data-slot="card"][aria-label="Cited sources"] [data-slot="item"]')
        .first();
      await sourceRow.hover();
      await page.evaluate(() => navigator.clipboard.writeText("Before research source Copy"));
      await sourceRow.getByRole("button", { name: "Copy W3C WAI source URL", exact: true }).click();
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(SOURCE_URL);
      await sourceRow.getByRole("button", { name: "Open W3C WAI source", exact: true }).click();
      await expect(page.getByText("Labeling controls · W3C WAI", { exact: true })).toBeVisible();

      const fileRow = root
        .locator('[data-slot="card"][aria-label="Checked repository files"] [data-slot="item"]')
        .first();
      const copyPath = fileRow.getByRole("button", {
        name: `Copy path: ${FILE_PATH}`,
        exact: true,
      });
      await page.mouse.move(0, 0);
      await tabTo(page, copyPath);
      await expect(copyPath).toBeFocused();
      await expectSquare(copyPath, 24);
      await expect(page.getByRole("tooltip", { name: "Copy path", exact: true })).toBeVisible();
      await page.keyboard.press("Enter");
      await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(FILE_PATH);
      await page.keyboard.press("Tab");
      const openFile = fileRow.getByRole("button", { name: "Open file", exact: true });
      await expect(openFile).toBeFocused();
      await expectSquare(openFile, 24);
      await page.keyboard.press("Enter");
      await expect(
        page.getByText(`${FILE_PATH} · local file preview`, { exact: true }),
      ).toBeVisible();
      await expectNoPageOverflow(page);
    });
  });
}
