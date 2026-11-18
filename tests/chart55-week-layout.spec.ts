import { expect, test, type Page } from "@playwright/test";
import { recordErrors } from "./appshell18-account-native-helpers";
import { evidence, healthy, nativePopup, type Primitive } from "./strata-account-popup-helpers";

test.describe.configure({ timeout: 30000, retries: 0 });
test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

async function openMatrix(
  page: Page,
  baseURL: string | undefined,
  primitive: Primitive,
  style: string,
) {
  if (!baseURL) throw new Error("Chart55 QA requires the exact production baseURL");
  const faults = recordErrors(page);
  page.on("console", (message) => {
    if (message.type() === "warning") faults.push(message.text());
  });
  const root = new URL("./", baseURL);
  if (root.pathname.endsWith("/base/")) root.pathname = root.pathname.slice(0, -5);
  const url = new URL(primitive === "base" ? "base/" : "./", root);
  url.hash =
    "/preview/chart/status-tracker/chart-55?" +
    new URLSearchParams({
      preset: JSON.stringify({ primitive, style, mode: "light" }),
    });
  await page.goto(url.href);
  await expect(page).toHaveTitle("Working Agreements — Preview");
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
  await expect
    .poll(() => page.locator("#preview-preset").textContent())
    .toContain(`Bricklane: ${style} component style`);
  await page.evaluate(() => document.fonts.ready);
  const table = page.getByRole("table", {
    name: "Payments working agreements by week",
    exact: true,
  });
  const row = table
    .getByRole("row")
    .filter({ has: page.getByRole("rowheader", { name: /Reviews within a day/ }) });
  await expect(table.getByRole("columnheader", { name: /Week of/ })).toHaveCount(26);
  await expect(row.getByRole("button")).toHaveCount(26);
  return { row, faults };
}

for (const primitive of ["base", "radix"] as const) {
  test(`${primitive} Sera: a week tile edge opens its own physical week`, async ({
    page,
    baseURL,
  }, info) => {
    const { row, faults } = await openMatrix(page, baseURL, primitive, "sera");
    const current = row.locator('[data-agreement-week="25"]');
    await current.tap();
    const popup = page.getByRole("dialog");
    await nativePopup(popup, primitive);
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-slot="popover-content"]')).toHaveCount(0);
    await expect(current).toBeFocused();
    for (let step = 0; step < 25; step++) await page.keyboard.press("ArrowLeft");
    const first = row.locator('[data-agreement-week="0"]');
    await expect(first).toBeFocused();
    const edge = await first.evaluate((button) => {
      const cell = button.closest("td")!;
      const css = getComputedStyle(cell);
      const bounds = cell.getBoundingClientRect();
      const hit = button.getBoundingClientRect();
      const ink = button.querySelector("span")!.getBoundingClientRect();
      const left = bounds.left + parseFloat(css.borderLeftWidth) + parseFloat(css.paddingLeft);
      const right = bounds.right - parseFloat(css.borderRightWidth) - parseFloat(css.paddingRight);
      const x = ink.right - 1;
      const y = ink.y + ink.height / 2;
      return {
        x,
        y,
        cell: { left, right },
        button: { left: hit.left, right: hit.right },
        ink: { left: ink.left, right: ink.right },
        owner: document
          .elementFromPoint(x, y)
          ?.closest("button")
          ?.getAttribute("data-agreement-week"),
      };
    });
    await page.mouse.click(edge.x, edge.y);
    await nativePopup(popup, primitive);
    await evidence(page, info, "sera-week-edge", {
      edge,
      actualPopup: await popup.getAttribute("aria-label"),
    });
    await expect(popup).toHaveAccessibleName("Reviews within a day, week of Apr 6");
    expect(edge.owner).toBe("0");
    for (const box of [edge.button, edge.ink]) {
      expect(box.left).toBeGreaterThanOrEqual(edge.cell.left - 0.5);
      expect(box.right).toBeLessThanOrEqual(edge.cell.right + 0.5);
    }
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-slot="popover-content"]')).toHaveCount(0);
    await expect(first).toBeFocused();
    await healthy(page, faults);
  });

  test(`${primitive} Luma: five complete recent week buttons remain visible`, async ({
    page,
    baseURL,
  }, info) => {
    const { row, faults } = await openMatrix(page, baseURL, primitive, "luma");
    await expect
      .poll(() =>
        row.evaluate((element) => {
          const viewport = element.closest<HTMLElement>('[data-slot="table-container"]')!;
          const label = element.querySelector<HTMLElement>('[scope="row"]')!;
          const left = label.getBoundingClientRect().right;
          const right = viewport.getBoundingClientRect().right;
          return Array.from(element.querySelectorAll<HTMLButtonElement>("[data-agreement-week]"))
            .filter((button) => {
              const box = button.getBoundingClientRect();
              return box.left >= left - 0.5 && box.right <= right + 0.5;
            })
            .map((button) => Number(button.dataset.agreementWeek));
        }),
      )
      .toEqual([21, 22, 23, 24, 25]);
    await evidence(page, info, "luma-five-complete-weeks");
    const august = row.locator('[data-agreement-week="21"]');
    await august.tap();
    const popup = page.getByRole("dialog", {
      name: "Reviews within a day, week of Aug 31",
      exact: true,
    });
    await nativePopup(popup, primitive);
    await page.keyboard.press("Escape");
    await expect(page.locator('[data-slot="popover-content"]')).toHaveCount(0);
    await expect(august).toBeFocused();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
      .toBeLessThanOrEqual(390);
    await healthy(page, faults);
  });
}
