import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const styles = ["nova", "vega", "maia", "lyra", "mira", "luma", "sera", "rhea"] as const;
type Style = (typeof styles)[number];
type Primitive = "radix" | "base";
const actions = ["Hand Over", "Add Company", "My Accounts", "Columns"] as const;
const iconSides: Record<Style, number> = {
  nova: 32,
  vega: 36,
  maia: 36,
  lyra: 32,
  mira: 28,
  luma: 36,
  sera: 40,
  rhea: 32,
};
const route = "#/block/data-grid/advanced/data-grid-advanced-23";
const faultsByPage = new WeakMap<Page, string[]>();

test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light", actionTimeout: 5000 });

const preview = (page: Page) => page.frameLocator('iframe[title="Prospect Database live preview"]');

async function openProspect(
  page: Page,
  baseURL: string | undefined,
  primitive: Primitive,
  style: Style,
  width: number,
) {
  if (!baseURL) throw new Error("Responsive toolbar tests require the configured baseURL");
  const faults: string[] = [];
  faultsByPage.set(page, faults);
  page.on("pageerror", (error) => faults.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      faults.push(`${message.type()}: ${message.text()}`);
    }
  });
  // The host hides its viewport picker below sm. Choose the real mobile iframe
  // while that control is visible, then resize the host to the target viewport.
  await page.setViewportSize({ width: 1440, height: 1000 });
  const entry = new URL(primitive === "base" ? "base/" : "./", new URL("./", baseURL));
  const params = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  await page.goto(`${entry.href}${route}?${params}`);
  await expect(page).toHaveTitle("Prospect Database — Bricklane");
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  if (width === 390) {
    // The host's desktop preview scales a >=1000px iframe. Select the real
    // mobile preview so hidden captions are tested at an actual 390px viewport.
    await page.getByLabel("Mobile viewport", { exact: true }).click();
    await page.setViewportSize({ width, height: 844 });
  }
  const frame = preview(page);
  const documents = [page.locator("html"), frame.locator("html")];
  await Promise.all(
    documents.flatMap((html) => [
      expect(html).toHaveAttribute("data-ui-primitive", primitive),
      expect(html).toHaveAttribute("data-ui-style", style),
    ]),
  );
  await Promise.all(
    documents.map((html) =>
      html.evaluate(async (element) => {
        await element.ownerDocument.fonts.ready;
      }),
    ),
  );
  if (width === 390) {
    await expect.poll(() => frame.locator("html").evaluate(() => innerWidth)).toBe(390);
  }
  if (style !== "nova") {
    await expect
      .poll(() => frame.locator("#preview-preset").textContent())
      .toContain(`Bricklane: ${style} component style`);
  }
  const region = frame.getByRole("region", { name: "Prospect database", exact: true });
  await expect(region).toBeVisible();
  await expect(region.locator("tbody tr")).toHaveCount(10);
  await frame.locator("html").evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
  return { frame, region };
}

async function controlGeometry(button: Locator, name: string) {
  return button.evaluate((element, captionText) => {
    const label = [...element.children].find(
      (child) => child.tagName === "SPAN" && child.textContent?.trim() === captionText,
    );
    if (!(label instanceof HTMLElement)) throw new Error(`Missing toolbar caption ${captionText}`);
    const rectangle = (target: Element) => {
      const box = target.getBoundingClientRect();
      return { x: box.x, y: box.y, width: box.width, height: box.height };
    };
    const box = rectangle(element);
    const caption = rectangle(label);
    const css = getComputedStyle(element);
    const labelVisible = getComputedStyle(label).display !== "none";
    const points = labelVisible
      ? [
          { name: "caption-center", x: caption.x + caption.width / 2 },
          { name: "caption-right", x: caption.x + caption.width - 1 },
        ]
      : [{ name: "button-center", x: box.x + box.width / 2 }];
    return {
      name: captionText,
      box,
      caption,
      labelVisible,
      classes: element.className,
      css: { width: css.width, minWidth: css.minWidth, height: css.height, padding: css.padding },
      hits: points.map((point) => {
        const y = labelVisible ? caption.y + caption.height / 2 : box.y + box.height / 2;
        const hit = element.ownerDocument.elementFromPoint(point.x, y);
        return {
          ...point,
          y,
          belongsToTarget: hit === element || (hit !== null && element.contains(hit)),
          hitTag: hit?.tagName,
          hitLabel: hit?.closest("button")?.getAttribute("aria-label"),
        };
      }),
    };
  }, name);
}

async function evidence(page: Page, info: TestInfo, name: string, details: object) {
  await writeFile(
    info.outputPath(`${name}.json`),
    JSON.stringify(
      { url: page.url(), title: await page.title(), faults: faultsByPage.get(page), ...details },
      null,
      2,
    ),
  );
  await page.screenshot({ path: info.outputPath(`${name}.png`), animations: "allow" });
}

for (const primitive of ["radix", "base"] as const) {
  for (const style of styles) {
    for (const width of [1440, 390]) {
      test(`${primitive} ${style} ${width}: responsive toolbar bounds and native actions`, async ({
        page,
        baseURL,
      }, info) => {
        const { frame, region } = await openProspect(page, baseURL, primitive, style, width);
        const buttons = actions.map((name) => region.locator(`button[aria-label="${name}"]`));
        const measured = await Promise.all(
          buttons.map(async (button, index) => {
            await expect(button).toBeVisible();
            return controlGeometry(button, actions[index]);
          }),
        );
        const settings = region.getByRole("button", { name: "Settings", exact: true });
        const settingsBox = await settings.evaluate((element) => {
          const box = element.getBoundingClientRect();
          return { width: box.width, height: box.height };
        });
        await evidence(page, info, "toolbar-before-actions", {
          primitive,
          style,
          width,
          measured,
          settings: settingsBox,
        });

        for (const item of measured) {
          expect(item.box.height, `${item.name} keeps its style height`).toBe(iconSides[style]);
          if (width === 1440) {
            expect(item.labelVisible, `${item.name} desktop caption is visible`).toBe(true);
            expect(
              item.caption.x,
              `${item.name} caption begins inside its button`,
            ).toBeGreaterThanOrEqual(item.box.x);
            expect(
              item.caption.x + item.caption.width,
              `${item.name} caption ends inside its button`,
            ).toBeLessThanOrEqual(item.box.x + item.box.width);
            expect(item.caption.y).toBeGreaterThanOrEqual(item.box.y);
            expect(item.caption.y + item.caption.height).toBeLessThanOrEqual(
              item.box.y + item.box.height,
            );
          } else {
            expect(item.labelVisible, `${item.name} mobile caption is hidden`).toBe(false);
            expect(item.box.width, `${item.name} remains a square mobile icon`).toBe(
              iconSides[style],
            );
          }
          expect(
            item.hits.every((hit) => hit.belongsToTarget),
            `${item.name} owns its hit points`,
          ).toBe(true);
        }
        for (const [index, item] of measured.entries()) {
          for (const other of measured.slice(index + 1)) {
            const overlap =
              item.box.x < other.box.x + other.box.width &&
              item.box.x + item.box.width > other.box.x &&
              item.box.y < other.box.y + other.box.height &&
              item.box.y + item.box.height > other.box.y;
            expect(overlap, `${item.name} does not overlap ${other.name}`).toBe(false);
          }
        }
        expect(settingsBox, "an ordinary icon button keeps the official square dimensions").toEqual(
          {
            width: iconSides[style],
            height: iconSides[style],
          },
        );

        const clickAction = async (index: number) => {
          const button = buttons[index];
          if (width === 1440) await button.getByText(actions[index], { exact: true }).click();
          else await button.click();
        };
        await clickAction(0);
        const handover = frame.getByRole("dialog", { name: "Hand Over Accounts", exact: true });
        await expect(handover).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(handover).toBeHidden();
        await expect(buttons[0]).toBeFocused();
        await clickAction(1);
        const sheet = frame.getByRole("dialog", { name: "Add Company", exact: true });
        await expect(sheet).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(sheet).toBeHidden();
        await expect(buttons[1]).toBeFocused();
        await clickAction(2);
        await expect(buttons[2]).toHaveAttribute("aria-pressed", "true");
        await expect.poll(() => region.locator("tbody tr").count()).toBeLessThan(10);
        await clickAction(2);
        await expect(buttons[2]).toHaveAttribute("aria-pressed", "false");
        await expect(region.locator("tbody tr")).toHaveCount(10);
        await clickAction(3);
        const columns = frame.getByRole("dialog", { name: "Company columns", exact: true });
        await expect(columns).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(columns).toBeHidden();
        await expect(buttons[3]).toBeFocused();
        expect(
          await frame
            .locator("html")
            .evaluate(() => document.documentElement.scrollWidth <= innerWidth),
          "preview has no document horizontal overflow",
        ).toBe(true);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true,
        );
        expect(faultsByPage.get(page)).toEqual([]);
      });
    }
  }
}
