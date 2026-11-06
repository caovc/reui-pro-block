import { readFile } from "node:fs/promises";
import { defaultTheme, themeCSS } from "../src/components/site/preview-theme";
import { expect, test, type Page } from "@playwright/test";

async function choose(page: Page, label: string, option: string) {
  const field = page.getByRole("combobox", { name: label, exact: true });
  await field.click();
  await page.getByRole("option", { name: option, exact: true }).click();
  await expect(page.getByRole("listbox")).toHaveCount(0);
  await expect(field).toBeFocused();
}

for (const treatment of [
  { label: "Menu", option: "Solid", color: "rgb(255, 255, 255)", fill: "rgb(4, 120, 87)" },
  { label: "Menu accent", option: "Bold", color: "rgb(255, 255, 255)", fill: "rgb(4, 120, 87)" },
  { label: "Menu", option: "Outline", color: "rgb(10, 10, 10)", fill: "rgba(0, 0, 0, 0)" },
] as const) {
  test(`AppShell2 selected child follows native ${treatment.option} menu customization`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto("./#/block/application/app-shell/app-shell-2");
    const frame = page.frameLocator("iframe");
    const selected = frame.getByRole("button", { name: "Segments", exact: true });
    await selected.click();
    await expect(selected).toHaveAttribute("data-active", "true");
    expect(
      await selected.evaluate((element) => Boolean(element.closest(".app-shell-navigation"))),
    ).toBe(true);
    await page.getByRole("button", { name: "Customize", exact: true }).click();
    await choose(page, "Accent color", "Emerald");
    await choose(page, treatment.label, treatment.option);
    await expect(selected).toHaveCSS("background-color", treatment.fill);
    // Outline retains the existing foreground token rather than the accent.
    if (treatment.option !== "Outline") await expect(selected).toHaveCSS("color", treatment.color);
    if (treatment.option === "Outline") await expect(selected).not.toHaveCSS("box-shadow", "none");
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("complementary", { name: "Preview customization", exact: true }),
    ).toHaveCount(0);
    await expect(selected).toHaveAttribute("data-active", "true");
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    await page.screenshot({ path: info.outputPath(`submenu-${treatment.option}.png`) });
    expect(errors).toEqual([]);
  });
}

test("AppShell2 solid child selection survives desktop folding and native phone navigation", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const preset = encodeURIComponent(
    JSON.stringify({ accent: "emerald", menu: "solid", mode: "dark" }),
  );
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`./#/preview/application/app-shell/app-shell-2?preset=${preset}`);
  const selected = page.getByRole("button", { name: "Segments", exact: true });
  await selected.click();
  await expect(selected).toHaveAttribute("data-active", "true");
  await page.getByRole("button", { name: "Toggle Sidebar", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  const opener = page.getByRole("button", { name: "Open navigation", exact: true });
  await opener.click();
  const sheet = page.getByRole("dialog", { name: "Navigation", exact: true });
  const child = sheet.getByRole("button", { name: "Segments", exact: true });
  await expect(child).toHaveAttribute("data-active", "true");
  expect(await child.evaluate((element) => Boolean(element.closest(".app-shell-navigation")))).toBe(
    true,
  );
  await expect(child).toHaveCSS("background-color", "rgb(4, 120, 87)");
  await expect(child).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect
    .poll(() =>
      sheet.evaluate((element) =>
        element.getAnimations().every((animation) => animation.playState === "finished"),
      ),
    )
    .toBe(true);
  await expect(sheet).toHaveCSS("opacity", "1");
  await expect.poll(async () => Math.round((await sheet.boundingBox())!.x)).toBe(0);
  await page.screenshot({ path: info.outputPath("submenu-solid-dark-phone.png") });
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(errors).toEqual([]);
});

test("AppShell2 actual Theme CSS download retains the selected child menu treatment", async ({
  page,
}, info) => {
  const preset = { ...defaultTheme, accent: "emerald", menu: "solid" };
  await page.goto(
    `./#/block/application/app-shell/app-shell-2?preset=${encodeURIComponent(JSON.stringify(preset))}`,
  );
  await expect(
    page.frameLocator("iframe").getByRole("button", { name: "Overview", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await page.locator("details.preset-source > summary").click();
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download theme CSS", exact: true }).click();
  const download = await pending;
  const path = info.outputPath("preview-theme.css");
  await download.saveAs(path);
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toBe("preview-theme.css");
  expect(await readFile(path)).toEqual(Buffer.from(themeCSS(preset), "utf8"));
  expect(await readFile(path, "utf8")).toContain(
    ".app-shell-navigation [data-sidebar=menu-sub-button][data-active=true]",
  );
});

test("Flux native child navigation retains its template treatment when AppShell menus are solid", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  const preset = { ...defaultTheme, accent: "emerald" };
  await page.goto(`./#/templates/flux?preset=${encodeURIComponent(JSON.stringify(preset))}`);
  const nav = page.locator(".wf-native-navigation");
  await nav.getByRole("button", { name: "Providers", exact: true }).click();
  const connections = nav.getByRole("button", { name: "Connections", exact: true });
  await connections.click();
  await expect(connections).toHaveAttribute("data-active", "true");
  await page.getByRole("button", { name: "Customize", exact: true }).hover();
  const before = await connections.evaluate((element) => ({
    color: getComputedStyle(element).color,
    background: getComputedStyle(element).backgroundColor,
  }));
  await expect(page.locator(".app-shell-navigation")).toHaveCount(0);
  await page.getByRole("button", { name: "Customize", exact: true }).click();
  await choose(page, "Menu", "Solid");
  await expect(connections).toHaveCSS("background-color", before.background);
  await expect(connections).toHaveCSS("color", before.color);
  await expect(connections).toHaveAttribute("data-active", "true");
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("complementary", { name: "Preview customization", exact: true }),
  ).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("flux-child-keeps-template-colors.png") });
  await page.setViewportSize({ width: 390, height: 844 });
  const opener = page.getByRole("button", { name: "Open navigation", exact: true });
  await opener.click();
  const sheet = page.getByRole("dialog", { name: "AgentOps navigation", exact: true });
  const phoneChild = sheet.getByRole("button", { name: "Connections", exact: true });
  await expect(phoneChild).toHaveAttribute("data-active", "true");
  await expect(page.locator(".app-shell-navigation")).toHaveCount(0);
  await expect(phoneChild).toHaveCSS("background-color", before.background);
  await expect(phoneChild).toHaveCSS("color", before.color);
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(opener).toBeFocused();
  expect(errors).toEqual([]);
});
