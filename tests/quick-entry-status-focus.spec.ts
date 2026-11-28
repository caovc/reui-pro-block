// Additive QuickEntry Status return-focus regression; other picker flows remain separate.
import {
  expect as baseExpect,
  test,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import { writeFile } from "node:fs/promises";

const expect = baseExpect.configure({ timeout: 5000 });
const statuses = ["Backlog", "Planned", "In Progress", "Paused", "Completed", "Cancelled"];
const faults = new WeakMap<Page, string[]>();

test.describe.configure({ retries: 0, timeout: 30000 });
test.use({
  viewport: { width: 1440, height: 1000 },
  actionTimeout: 5000,
  navigationTimeout: 5000,
  trace: "on",
  colorScheme: "light",
  reducedMotion: "no-preference",
  deviceScaleFactor: 1,
});

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  faults.set(page, errors);
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type()))
      errors.push(`${message.type()}: ${message.text()}`);
  });
});

async function actualFocus(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement;
    return {
      active:
        active instanceof HTMLElement
          ? {
              tag: active.tagName,
              id: active.id,
              role: active.getAttribute("role"),
              label: active.getAttribute("aria-label"),
              text: active.textContent?.trim().slice(0, 100),
            }
          : null,
      insideOuter: !!active?.closest(".final-entry-dialog"),
      parentOpen: document.querySelectorAll(".final-entry-dialog").length,
      childPopups: document.querySelectorAll('[data-slot="combobox-content"]').length,
      bodyPointerEvents: document.body.style.pointerEvents,
    };
  });
}

test.afterEach(async ({ page }, info) => {
  await info.attach("terminal-focus-health.json", {
    body: JSON.stringify(
      { url: page.url(), faults: faults.get(page) ?? [], focus: await actualFocus(page) },
      null,
      2,
    ),
    contentType: "application/json",
  });
});

function entry(baseURL: string, primitive: "radix" | "base") {
  const root = new URL("./", baseURL);
  if (root.pathname.endsWith("/base/")) root.pathname = root.pathname.slice(0, -5);
  return new URL(primitive === "base" ? "base/" : "./", root);
}

async function stableReturn(page: Page, trigger: Locator, info: TestInfo, cycle: number) {
  await info.attach(`cycle-${cycle}-before-focus.json`, {
    body: JSON.stringify(await actualFocus(page), null, 2),
    contentType: "application/json",
  });
  // Preserve the original5s focus budget, then observe two ordinary paint frames.
  await expect(trigger).toBeFocused();
  const samples = await trigger.evaluate(
    (element) =>
      new Promise<object[]>((resolve) => {
        const capture = () => ({
          focused: document.activeElement === element,
          connected: element.isConnected,
          activeId: document.activeElement?.id,
          activeRole: document.activeElement?.getAttribute("role"),
        });
        const values = [capture()];
        requestAnimationFrame(() => {
          values.push(capture());
          requestAnimationFrame(() => {
            values.push(capture());
            resolve(values);
          });
        });
      }),
  );
  await info.attach(`cycle-${cycle}-native-focus-frames.json`, {
    body: JSON.stringify(samples, null, 2),
    contentType: "application/json",
  });
  for (const sample of samples) expect(sample).toMatchObject({ focused: true, connected: true });
  await page.keyboard.press("Tab");
  const assigneeHelp = page.getByRole("button", { name: "Assignee help", exact: true });
  await expect(assigneeHelp).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.locator("#entry-assignee")).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(assigneeHelp).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(trigger).toBeFocused();
}

for (const primitive of ["radix", "base"] as const) {
  for (const path of ["Escape", "selection"] as const) {
    test(`${primitive} Nova Quick Entry Status: ${path} restores the real nested trigger while the native modal remains open`, async ({
      page,
      baseURL,
    }, info) => {
      if (!baseURL) throw new Error("Preview base URL is required");
      const url = entry(baseURL, primitive);
      url.hash = `/preview/application/dialog/dialog-12?${new URLSearchParams({ preset: JSON.stringify({ primitive, style: "nova", mode: "light" }) })}`;
      await page.goto(url.href);
      await expect(page).toHaveURL(url.href);
      await expect(page).toHaveTitle("Quick Create Entry — Preview");
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(page.locator("html")).toHaveAttribute("data-ui-style", "nova");
      await expect(page.locator("vite-error-overlay")).toHaveCount(0);
      const launcher = page.getByRole("button", { name: "Open quick entry", exact: true });
      await launcher.click();
      const outer = page.getByRole("dialog", { name: "Create entry", exact: true });
      await expect(outer).toBeVisible();
      await expect(outer).toHaveClass(/final-entry-dialog/);
      await expect(outer).toHaveAttribute(
        primitive === "base" ? "data-open" : "data-state",
        primitive === "base" ? "" : "open",
      );
      await expect(page.locator('[data-slot="dialog-overlay"]')).toBeVisible();
      await expect(launcher).toHaveCount(0);
      await page.evaluate(() => document.fonts.ready);
      const trigger = outer.locator("#entry-status");
      await expect(trigger).toContainText("Planned");
      const proof: unknown[] = [];
      for (let cycle = 1; cycle <= 2; cycle++) {
        if (cycle === 1) await trigger.click();
        else await trigger.press("Enter");
        const popup = page.locator('[data-slot="combobox-content"]');
        await expect(popup).toBeVisible();
        await expect(popup.getByRole("listbox")).toBeVisible();
        await expect(popup.getByRole("option")).toHaveText(statuses);
        expect(await popup.evaluate((element) => !!element.closest(".final-entry-dialog"))).toBe(
          true,
        );
        const input = popup.getByRole("combobox", { name: "Change status", exact: true });
        await input.click();
        await expect(input).toBeFocused();
        if (cycle === 1) await page.screenshot({ path: info.outputPath("status-popup-open.png") });
        if (path === "Escape") {
          await page.keyboard.press("Escape");
        } else {
          const selected = cycle === 1 ? "Paused" : "Completed";
          await input.fill(selected);
          await expect(popup.getByRole("option")).toHaveText([selected]);
          if (cycle === 1) await popup.getByRole("option", { name: selected, exact: true }).click();
          else await input.press("Enter");
          await expect(trigger).toContainText(selected);
        }
        await expect(popup).toHaveCount(0);
        await expect(outer).toBeVisible();
        await expect(outer).toHaveAttribute(
          primitive === "base" ? "data-open" : "data-state",
          primitive === "base" ? "" : "open",
        );
        if (path === "Escape") await expect(trigger).toContainText("Planned");
        await stableReturn(page, trigger, info, cycle);
        proof.push({ cycle, path, focus: await actualFocus(page) });
        await page.screenshot({ path: info.outputPath(`status-${cycle}-returned.png`) });
      }
      await page.keyboard.press("Escape");
      await expect(outer).toHaveCount(0);
      await expect(launcher).toBeFocused();
      await page.screenshot({ path: info.outputPath("outer-closed-launcher-focused.png") });
      await writeFile(
        info.outputPath("native-proof.json"),
        JSON.stringify(
          { primitive, path, url: page.url(), proof, faults: faults.get(page) },
          null,
          2,
        ),
      );
      expect(faults.get(page)).toEqual([]);
    });
  }
}
