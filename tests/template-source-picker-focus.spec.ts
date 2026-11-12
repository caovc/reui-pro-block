// Additive source-picker regression. Full raw/Copy/file/ZIP coverage remains separate.
import { expect as baseExpect, test } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 5000 });
const drive = "src/templates/collaboration/drive.tsx";
const auth = "src/templates/collaboration/filebox-auth.tsx";
const css = "src/templates/collaboration/filebox-auth.css";

test.describe.configure({ timeout: 30000, retries: 0 });
test.use({ viewport: { width: 390, height: 844 }, actionTimeout: 5000, trace: "on" });

for (const primitive of ["radix", "base"] as const) {
  for (const style of ["nova", "sera"] as const) {
    test(`${primitive} ${style} 390 source picker restores query, order and native focus`, async ({
      page,
      baseURL,
    }, info) => {
      const errors: string[] = [];
      const consoleErrors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      const root = new URL("./", baseURL!);
      if (root.pathname.endsWith("/base/")) root.pathname = root.pathname.slice(0, -5);
      const entry = new URL(primitive === "base" ? "base/" : "./", root);
      const queryString = new URLSearchParams({
        preset: JSON.stringify({ primitive, style, mode: "light" }),
      });
      await page.goto(`${entry.href}#/templates/filebox?${queryString}`);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
      await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
      const opener = page.getByRole("button", { name: "View template source", exact: true });
      await opener.click();
      const dialog = page.getByRole("dialog", { name: "Filebox source", exact: true });
      const trigger = dialog.getByRole("combobox", { name: "Template source file", exact: true });
      await expect(dialog).toHaveAttribute("data-state", "open");
      if (primitive === "base") {
        await expect(page.locator("#root")).toHaveAttribute("data-base-ui-inert", "");
      } else {
        await expect(page.locator("body")).toHaveAttribute("data-scroll-locked", "1");
        await expect(page.locator("body")).toHaveCSS("pointer-events", "none");
        await expect(dialog).toHaveCSS("pointer-events", "auto");
      }
      await trigger.click();
      const list = page.getByRole("listbox");
      const options = list.getByRole("option");
      const query = page.getByRole("combobox", { name: "Search source files", exact: true });
      await expect(list).toBeVisible();
      await expect(query).toHaveValue("");
      const initialOrder = await options.allTextContents();
      expect(initialOrder[0]).toBe(drive);
      expect(initialOrder).toContain(auth);
      expect(initialOrder).toContain(css);

      await query.fill("filebox-auth.css");
      await expect(options).toHaveCount(1);
      await expect(options).toHaveText(css);
      await query.press("ArrowDown");
      await query.press("Enter");
      await expect(list).toHaveCount(0);
      await expect(trigger).toHaveText(css);
      await expect(trigger).toBeFocused();

      await trigger.click();
      await expect(query).toHaveValue("");
      await expect(options).toHaveCount(initialOrder.length);
      expect(await options.allTextContents()).toEqual(initialOrder);
      await query.fill("filebox-auth.tsx");
      await expect(options).toHaveCount(1);
      await list.getByRole("option", { name: auth, exact: true }).click();
      await expect(list).toHaveCount(0);
      await expect(trigger).toHaveText(auth);
      await expect(trigger).toBeFocused();

      await trigger.click();
      await expect(query).toHaveValue("");
      await query.fill("missing-source-file-no-match");
      await expect(page.getByText("No files found.", { exact: true })).toBeVisible();
      await expect(options).toHaveCount(0);
      await page.keyboard.press("Escape");
      await expect(list).toHaveCount(0);
      await expect(dialog).toBeVisible();
      await expect(trigger).toBeFocused();
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(opener).toBeFocused();
      expect(errors).toEqual([]);
      expect(consoleErrors).toEqual([]);
      await info.attach("source-picker-focus.json", {
        body: JSON.stringify({ primitive, style, initialOrder, errors, consoleErrors }, null, 2),
        contentType: "application/json",
      });
    });
  }
}
