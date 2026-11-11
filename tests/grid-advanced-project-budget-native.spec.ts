import { expect, test } from "@playwright/test";

const path = "#/preview/data-grid/advanced/data-grid-advanced-27";

for (const primitive of ["radix", "base"] as const) {
  const style = primitive === "radix" ? "maia" : "sera";
  const preset = new URLSearchParams({ preset: JSON.stringify({ primitive, style }) });
  const route = `${primitive === "base" ? "./base/" : "./"}${path}?${preset}`;

  test(`Project Budget recalculates forecast and preserves native undo in ${primitive}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(route);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    const health = page.getByRole("region", { name: "Budget health" });
    const forecast = health.getByRole("article", { name: /^Forecast:/ });
    await expect(forecast).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
    await page.screenshot({ path: info.outputPath("desktop.png"), animations: "disabled" });
    const initial = await forecast.getAttribute("aria-label");
    const row = page.getByRole("row").filter({
      has: page.getByRole("button", { name: "Operations pattern library", exact: true }),
    });
    const compact = await row.evaluate((element) => element.getBoundingClientRect().height);
    await page.getByLabel("Comfortable rows", { exact: true }).click();
    await expect
      .poll(() => row.evaluate((element) => element.getBoundingClientRect().height))
      .toBeGreaterThan(compact);
    await page.getByLabel("Compact rows", { exact: true }).click();
    await page
      .getByLabel("Show lines", { exact: true })
      .getByText("Over Budget", { exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "Order workspace concepts", exact: true }),
    ).toHaveCount(0);
    const forecastButton = page.getByRole("button", {
      name: /^Update forecast for Operations pattern library/,
    });
    const menuTrigger = row.getByRole("button", { name: "Actions for Operations pattern library" });
    await menuTrigger.press("ArrowDown");
    const menu = page.getByRole("menu");
    await expect(menu).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(menuTrigger).toBeFocused();

    await forecastButton.press("Enter");
    const editor = page.getByRole("dialog", { name: "Update Forecast" });
    await expect(editor).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(editor).toBeHidden();
    await expect(forecastButton).toBeFocused();
    await forecastButton.press("Enter");
    await expect(editor.getByRole("button", { name: "Apply" })).toBeDisabled();
    const numberField = editor.locator('[data-slot="number-field-group"]');
    await expect(numberField).toHaveCSS(
      "border-top-left-radius",
      style === "maia" ? "26px" : "0px",
    );
    const hours = editor.getByLabel("Hours Left", { exact: true });
    const initialHours = Number(await hours.inputValue());
    await hours.press("ArrowUp");
    await expect(hours).toHaveValue(String(initialHours + 1));
    await editor
      .getByRole("textbox", { name: "Reason" })
      .fill("Supplier handoff extended by one hour");
    await editor.getByRole("button", { name: "Apply" }).click();
    await expect(editor).toBeHidden();
    await expect(forecast).not.toHaveAttribute("aria-label", initial!);
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(forecast).toHaveAttribute("aria-label", initial!);

    await menuTrigger.press("ArrowDown");
    await menu.getByRole("menuitem", { name: "Update Forecast" }).press("Enter");
    await expect(editor).toBeVisible();
    await expect(hours).toHaveValue(String(initialHours));
    await expect(editor.getByRole("textbox", { name: "Reason" })).toHaveValue("");
  });

  test(`Project Budget opens phone review, records a decision and adds a real line in ${primitive}`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route);
    const project = page.getByRole("region", { name: "Project budget" });
    await expect(project).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    const rail = project.getByRole("region", { name: "Budget health" });
    expect(await rail.evaluate((node) => node.scrollWidth > node.clientWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath("mobile.png"), animations: "disabled" });

    const searchTrigger = project.getByRole("button", { name: "Search lines, vendors and people" });
    await searchTrigger.press("Enter");
    const search = page.getByRole("searchbox", { name: "Search lines, vendors and people" });
    await search.fill("Operations pattern library");
    await page.keyboard.press("Escape");
    await expect(searchTrigger).toBeFocused();
    const line = project.getByRole("button", { name: "Operations pattern library", exact: true });
    await line.press("Enter");
    const details = page.getByRole("dialog", { name: "Operations pattern library" });
    await expect(
      details.getByRole("img", { name: /planned, actual and forecast spend/ }),
    ).toBeVisible();
    await details.getByRole("tab", { name: "Decision" }).click();
    await details.getByRole("textbox", { name: "Decision note" }).fill("Review scope next week");
    await details.getByRole("button", { name: "Save Decision" }).click();
    await expect(details.getByRole("tabpanel", { name: "Activity" })).toContainText(
      "Review scope next week",
    );
    await details.getByRole("button", { name: "Close", exact: true }).last().click();
    await expect(details).toBeHidden();
    await expect(line).toBeFocused();

    await searchTrigger.click();
    await search.fill("");
    await page.keyboard.press("Escape");
    const add = project.getByRole("button", { name: "Add Line" });
    await add.press("Enter");
    const form = page.getByRole("dialog", { name: "Add Line" });
    await form.getByRole("textbox", { name: "Line name" }).fill("Load-test support");
    await form.getByRole("button", { name: "Add Line" }).click();
    await expect(form).toBeHidden();
    await expect(add).toBeFocused();
    await expect(
      project.getByRole("button", { name: "Load-test support", exact: true }),
    ).toBeVisible();
  });
}
