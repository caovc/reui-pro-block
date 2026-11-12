import { expect, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

export type Primitive = "radix" | "base";

export async function nativePopup(popup: Locator, primitive: Primitive) {
  await expect(popup).toBeVisible();
  await expect(popup).toHaveAttribute(
    primitive === "base" ? "data-open" : "data-state",
    primitive === "base" ? "" : "open",
  );
}

export async function openPublic(
  page: Page,
  baseURL: string | undefined,
  primitive: Primitive,
  width: number,
) {
  if (!baseURL) throw new Error("Public parent QA requires the exact production baseURL");
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()))
      faults.push(`${message.type()}: ${message.text()}`);
  });
  const root = new URL("./", baseURL);
  if (root.pathname.endsWith("/base/")) root.pathname = root.pathname.slice(0, -"base/".length);
  const entry = new URL(primitive === "base" ? "base/" : "./", root);
  const query = new URLSearchParams({
    preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
  });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`${entry.href}#/templates/strata?${query}`);
  await Promise.all([
    expect(page).toHaveTitle("Strata — Bricklane Templates"),
    expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive),
    expect(page.locator("html")).toHaveAttribute("data-ui-style", "nova"),
    expect(page.locator('.template-surface[data-template="strata"] .strata-main')).toBeVisible(),
    expect(
      page.getByRole("navigation", { name: "Template preview navigation", exact: true }),
    ).toBeVisible(),
  ]);
  await page.evaluate(() => document.fonts.ready);
  const bounds = await page.evaluate(() => {
    const box = (selector: string) => {
      const rect = document.querySelector(selector)!.getBoundingClientRect();
      return { top: rect.top, bottom: rect.bottom, height: rect.height, width: rect.width };
    };
    return {
      toolbar: box(".template-workspace-toolbar"),
      root: box(".strata-root"),
      main: box(".strata-main"),
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
    };
  });
  expect(bounds.toolbar.height).toBe(36);
  expect(Math.abs(bounds.root.top - 36)).toBeLessThanOrEqual(0.75);
  for (const panel of [bounds.root, bounds.main]) {
    expect(Math.abs(panel.height - (bounds.viewport.height - 36))).toBeLessThanOrEqual(0.75);
    expect(panel.bottom).toBeLessThanOrEqual(bounds.viewport.height + 0.75);
  }
  expect(bounds.documentWidth).toBeLessThanOrEqual(width);
  return { faults, entry, preset: query.get("preset"), bounds };
}

export async function ensureSidebar(page: Page, width: number) {
  const sidebar = page.locator('.strata-sidebar[data-mobile="true"]');
  if (width === 390 && !(await sidebar.isVisible())) {
    await page.getByRole("button", { name: "Toggle navigation", exact: true }).click();
    await expect(sidebar).toBeVisible();
  }
}

export async function accountMenu(page: Page, primitive: Primitive, width: number) {
  await ensureSidebar(page, width);
  const trigger = page.getByRole("button", { name: "Account menu", exact: true });
  await trigger.press("Enter");
  const menu = page.getByRole("menu");
  await nativePopup(menu, primitive);
  return { trigger, menu };
}

export async function evidence(page: Page, info: TestInfo, name: string, details: object = {}) {
  const actual = await page.evaluate(() => {
    const active = document.activeElement;
    return {
      url: location.href,
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      primitive: document.documentElement.dataset.uiPrimitive,
      style: document.documentElement.dataset.uiStyle,
      active:
        active instanceof HTMLElement
          ? {
              tag: active.tagName,
              text: active.textContent,
              aria: active.getAttribute("aria-label"),
            }
          : null,
      overlays: [
        ...document.querySelectorAll('[role="dialog"], [role="alertdialog"], [role="menu"]'),
      ].map((node) => ({
        role: node.getAttribute("role"),
        slot: node.getAttribute("data-slot"),
        open: node.getAttribute("data-open"),
        state: node.getAttribute("data-state"),
      })),
    };
  });
  await writeFile(
    info.outputPath(`${name}.json`),
    JSON.stringify({ ...actual, ...details }, null, 2),
  );
  await page.screenshot({ path: info.outputPath(`${name}.png`) });
}

export async function healthy(page: Page, faults: string[]) {
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  expect(faults).toEqual([]);
}
