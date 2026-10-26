import { expect, test, type Page } from "@playwright/test";

async function settings(page: Page, mobile: boolean) {
  await page.goto("./#/template-preview/lucent");
  if (mobile) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  if (mobile) await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByText("General Settings", { exact: true })).toBeVisible();
}

async function navigate(page: Page, name: string, mobile: boolean) {
  if (mobile) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("button", { name, exact: true }).click();
  if (mobile) await expect(page.getByRole("dialog")).toHaveCount(0);
}

for (const width of [1440, 390]) {
  test.describe(`Lucent preferences at ${width}px`, () => {
    test.use({ viewport: { width, height: width === 1440 ? 1000 : 844 }, deviceScaleFactor: 1 });
    const mobile = width === 390;

    test("General Reset and Save remain separate from immediate notification state", async ({
      page,
    }) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await settings(page, mobile);
      const project = page.getByRole("textbox", { name: "Project name", exact: true });
      await project.fill("Delivery audit");
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(
        page.getByText("Local workspace preferences updated.", { exact: true }),
      ).toBeVisible();
      await expect(project).toHaveValue("Delivery audit");
      const critical = page.getByRole("switch", { name: "Page on critical", exact: true });
      await critical.click();
      await expect(critical).not.toBeChecked();
      await project.fill("Unsaved value");
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(project).toHaveValue("Delivery Console");
      await expect(critical).not.toBeChecked();
      await navigate(page, "Security", mobile);
      const twoFactor = page.getByRole("switch", {
        name: "Enforce two-factor authentication",
        exact: true,
      });
      await twoFactor.click();
      await navigate(page, "Settings", mobile);
      await expect(critical).toBeChecked();
      await expect(project).toHaveValue("Delivery Console");
      await navigate(page, "Security", mobile);
      await expect(twoFactor).toBeChecked();
      expect(errors).toEqual([]);
    });

    test("origins use the real Dialog, local validation and truthful file selection", async ({
      page,
    }) => {
      await settings(page, mobile);
      const trigger = page.getByRole("button", { name: "Add origin", exact: true });
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Allowed origins", exact: true });
      await expect(dialog).toBeVisible();
      await dialog.getByRole("textbox", { name: "New origin", exact: true }).fill("invalid");
      await dialog.getByRole("button", { name: "Add origin", exact: true }).click();
      await expect(dialog.getByText(/Enter an HTTP or HTTPS origin/)).toBeVisible();
      await dialog
        .getByRole("textbox", { name: "New origin", exact: true })
        .fill("https://audit.example");
      await dialog.getByRole("textbox", { name: "New origin", exact: true }).press("Enter");
      await expect(dialog.getByText("https://audit.example", { exact: true })).toBeVisible();
      await dialog
        .getByRole("button", { name: "Remove https://audit.example", exact: true })
        .click();
      await expect(dialog.getByText("https://audit.example", { exact: true })).toHaveCount(0);
      await dialog.getByRole("button", { name: "Done", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      const fileChooser = page.waitForEvent("filechooser");
      await page.getByRole("button", { name: "Import from file", exact: true }).click();
      await (
        await fileChooser
      ).setFiles({
        name: "origins.txt",
        mimeType: "text/plain",
        buffer: Buffer.from("https://file.example"),
      });
      await expect(page.getByText(/File import is not available in this local demo/)).toBeVisible();
      await trigger.click();
      await expect(dialog.getByText("https://file.example", { exact: true })).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    });

    test("notification Select and independent groups retain native keyboard interaction", async ({
      page,
    }) => {
      await settings(page, mobile);
      const digest = page.getByRole("combobox", { name: "Digest cadence", exact: true });
      await digest.click();
      await expect(page.getByRole("option", { name: "Hourly", exact: true })).toBeVisible();
      await page.keyboard.press("End");
      await expect(page.getByRole("option", { name: "Twice daily", exact: true })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(digest).toHaveText("Twice daily");
      const flag = page.getByRole("switch", { name: "Feature flag changes", exact: true });
      await flag.click();
      await expect(flag).toBeChecked();
      const delivery = page.getByRole("button", { name: "Alert delivery", exact: true });
      await delivery.focus();
      await delivery.press("Space");
      await expect(delivery).toHaveAttribute("aria-expanded", "false");
      await expect(digest).toHaveCount(0);
      await expect(flag).toBeVisible();
      const subscriptions = page.getByRole("button", { name: "Subscriptions", exact: true });
      await subscriptions.press("Enter");
      await expect(subscriptions).toHaveAttribute("aria-expanded", "false");
      await delivery.press("Enter");
      await expect(digest).toHaveText("Twice daily");
      await subscriptions.press("Space");
      await expect(flag).toBeChecked();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    });

    test("free ColorPicker, compound region and date controls update real draft", async ({
      page,
    }) => {
      await settings(page, mobile);
      const general = page.locator("form.wf-lucent-general");
      const swatches = general.locator('[data-slot="color-picker-swatches"]');
      await swatches.focus();
      await swatches.press("End");
      await swatches.press("Enter");
      await expect(swatches.getByRole("option", { name: "Sky", exact: true })).toHaveAttribute(
        "aria-selected",
        "true",
      );
      await page.getByRole("combobox", { name: "Region", exact: true }).click();
      await page.getByRole("option", { name: "Japan", exact: true }).click();
      await expect(page.getByRole("combobox", { name: "Region", exact: true })).toHaveText("Japan");
      const firstDate = page.getByRole("radio", { name: "MM/DD/YYYY", exact: true });
      await page.evaluate(() => window.scrollTo(0, 0));
      await firstDate.focus();
      await firstDate.press("End");
      const lastDate = page.getByRole("radio", { name: "YYYY/MM/DD", exact: true });
      await expect(lastDate).toBeFocused();
      await expect(lastDate).toBeInViewport({ ratio: 1 });
      await expect
        .poll(() =>
          lastDate.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            return bounds.top >= 0 && bounds.bottom <= innerHeight;
          }),
        )
        .toBe(true);
      await lastDate.press("Enter");
      await expect(page.getByRole("radio", { name: "YYYY/MM/DD", exact: true })).toBeChecked();
      await page.getByRole("button", { name: "Reset", exact: true }).click();
      await expect(page.getByRole("combobox", { name: "Region", exact: true })).toHaveText(
        "United States",
      );
      await expect(swatches.getByRole("option", { name: "Slate", exact: true })).toHaveAttribute(
        "aria-selected",
        "true",
      );
    });
  });
}

for (const width of [1440, 390]) {
  test(`Lucent actual Customize font reaches Select and origin Dialog portals at ${width}px`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) errors.push(message.text());
    });
    await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
    await page.goto("./#/templates/lucent");
    if (width === 390)
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await page.getByRole("button", { name: "Settings", exact: true }).click();
    if (width === 390) await expect(page.getByRole("dialog")).toHaveCount(0);
    const control = page.getByRole("combobox", { name: "Start of week", exact: true });
    const trigger = page.getByRole("button", { name: "Add origin", exact: true });
    for (const font of ["Default", "Serif", "Mono", "Reset"]) {
      if (font !== "Default") {
        await page.getByRole("button", { name: "Customize", exact: true }).click();
        const customizer = page.getByRole("complementary", {
          name: "Preview customization",
          exact: true,
        });
        if (font === "Reset")
          await customizer.getByRole("button", { name: "Reset", exact: true }).click();
        else {
          await customizer.getByRole("combobox", { name: "Body font", exact: true }).click();
          await page.getByRole("option", { name: font, exact: true }).click();
        }
        await customizer.getByRole("button", { name: "Close customizer", exact: true }).click();
      }
      const family = font === "Serif" ? /Georgia/ : font === "Mono" ? /monospace/ : /Inter/;
      await expect(control).toHaveCSS("font-family", family);
      await control.click();
      const popup = page.locator('[data-slot="select-content"]');
      await expect(popup).toBeVisible();
      await expect(popup).toHaveCSS("font-family", family);
      await page.screenshot({ path: info.outputPath(`${font}-select-${width}.png`) });
      await popup.press("Escape");
      await expect(popup).toHaveCount(0);
      await expect(control).toBeFocused();
      await trigger.click();
      const dialog = page.getByRole("dialog", { name: "Allowed origins", exact: true });
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveCSS("font-family", family);
      await expect(dialog.getByRole("textbox", { name: "New origin", exact: true })).toHaveCSS(
        "font-family",
        family,
      );
      await page.screenshot({ path: info.outputPath(`${font}-origins-${width}.png`) });
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    expect(errors).toEqual([]);
  });
}
