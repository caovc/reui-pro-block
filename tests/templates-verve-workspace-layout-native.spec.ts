import { expect, test, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light" });

async function stableSurface(page: Page) {
  await page.evaluate(async () => document.fonts.ready);
  await expect
    .poll(() =>
      page.locator(".verve-workspace-settings").evaluate((root) => {
        const style = getComputedStyle(root);
        return {
          opacity: style.opacity,
          identity: style.transform === "none" || style.transform === "matrix(1, 0, 0, 1, 0, 0)",
          animations: root
            .getAnimations({ subtree: true })
            .filter((animation) => animation.playState === "running" || animation.pending).length,
        };
      }),
    )
    .toEqual({ opacity: "1", identity: true, animations: 0 });
}

async function geometry(page: Page, info: TestInfo) {
  await stableSurface(page);
  const result = await page.locator(".verve-workspace-settings").evaluate((root) => {
    const metric = (element: Element) => {
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        opacity: style.opacity,
        transform: style.transform,
      };
    };
    const scrollport = root.closest<HTMLElement>('[data-slot="sidebar-inset"]')!;
    const contentStyle = getComputedStyle(root.parentElement!);
    return {
      availableWidth: scrollport.clientWidth,
      scrollbarWidth: scrollport.offsetWidth - scrollport.clientWidth,
      paddingLeft: Number.parseFloat(contentStyle.paddingLeft),
      paddingRight: Number.parseFloat(contentStyle.paddingRight),
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      fontFamily: getComputedStyle(root).fontFamily,
      loadedFonts: Array.from(document.fonts)
        .filter((font) => font.status === "loaded")
        .map((font) => ({ family: font.family, weight: font.weight })),
      cards: Array.from(root.querySelectorAll(".ds-card")).map((card) => ({
        frame: metric(card),
        header: metric(card.querySelector('[data-slot="frame-panel-header"]')!),
        panel: metric(card.querySelector('[data-slot="frame-panel"]')!),
      })),
    };
  });
  await writeFile(info.outputPath("workspace-layout.json"), JSON.stringify(result, null, 2) + "\n");
  await page.screenshot({ path: info.outputPath("workspace-layout.png"), fullPage: false });
  return result;
}

for (const width of [1440, 390]) {
  test(`Verve workspace layout ${width}: reference page header, real Frame spacing and native preview focus`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const writes: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
      if (message.type() === "warning") warnings.push(message.text());
    });
    page.on("request", (request) => {
      if (/^https?:/.test(request.url()) && !["GET", "HEAD"].includes(request.method())) {
        writes.push(`${request.method()} ${request.url()}`);
      }
    });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("/#/template-preview/verve/settings?native=workspace-layout");
    const workspace = page.getByRole("region", { name: "Workspace", exact: true });
    const name = workspace.getByRole("textbox", { name: "Workspace name", exact: true });
    await expect(name).toBeVisible();
    await expect(workspace.getByRole("heading", { name: "Settings", exact: true })).toHaveCount(1);
    const measured = await geometry(page, info);
    expect(measured.viewport.width).toBe(width);
    expect(measured.documentWidth).toBe(width);
    expect(measured.cards).toHaveLength(3);
    const first = measured.cards[0];
    expect(first.frame.x).toBeCloseTo(width === 390 ? 17 : 280, 1);
    expect(first.frame.y).toBeCloseTo(width === 390 ? 119 : 127, 1);
    // Both references use the available scrollport minus 16px on each side.
    // Headless Chromium may use overlay scrollbars; CUA captured a 15px gutter.
    expect(measured.paddingLeft).toBe(16);
    expect(measured.paddingRight).toBe(16);
    expect(first.frame.width).toBeCloseTo(
      measured.availableWidth - measured.paddingLeft - measured.paddingRight,
      1,
    );
    for (const card of measured.cards) {
      expect(card.header.x - card.frame.x).toBeCloseTo(4, 1);
      expect(card.header.y - card.frame.y).toBeCloseTo(4, 1);
      expect(card.panel.x - card.frame.x).toBeCloseTo(4, 1);
      expect(card.frame.width - card.panel.width).toBeCloseTo(8, 1);
      expect(card.panel.y - card.header.y - card.header.height).toBeCloseTo(3, 1);
    }
    for (let index = 1; index < measured.cards.length; index += 1) {
      const previous = measured.cards[index - 1].frame;
      expect(measured.cards[index].frame.y - previous.y - previous.height).toBeCloseTo(20, 1);
    }
    const save = workspace.getByRole("button", { name: "Save workspace", exact: true });
    await expect(save).toBeDisabled();
    const draftName = `Layout Preview ${width}`;
    await name.fill(draftName);
    await expect(save).toBeEnabled();
    const preview = workspace.getByRole("button", { name: "Preview brand", exact: true });
    await preview.click();
    const dialog = page.getByRole("dialog", { name: "Preview brand", exact: true });
    await expect(dialog.locator(".vs-brand-preview-title")).toContainText(draftName);
    await dialog.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(preview).toBeFocused();
    await expect(name).toHaveValue(draftName);
    expect(errors).toEqual([]);
    expect(warnings).toEqual([]);
    expect(writes).toEqual([]);
    await writeFile(
      info.outputPath("console-and-writes.json"),
      JSON.stringify({ errors, warnings, writes }, null, 2) + "\n",
    );
  });
}
