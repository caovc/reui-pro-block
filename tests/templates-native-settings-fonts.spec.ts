import { expect, test } from "@playwright/test";

for (const kind of ["echo", "flowly"])
  for (const width of [1440, 390])
    test(`${kind} actual Customize font reaches native settings and free Select portal ${width}`, async ({
      page,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (["error", "warning"].includes(message.type())) errors.push(message.text());
      });
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      await page.goto(`/#/templates/${kind}`);
      if (width === 390)
        await page
          .getByRole("button", {
            name: kind === "echo" ? "Open chats" : "Open navigation",
            exact: true,
          })
          .click();
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      if (kind === "echo") await page.getByRole("tab", { name: "My Profile", exact: true }).click();
      else {
        const navigation = width === 390 ? page.getByRole("dialog") : page.locator(".fs-secondary");
        await navigation.getByRole("button", { name: "General", exact: true }).click();
        if (width === 390) {
          await page.keyboard.press("Escape");
          await expect(page.getByRole("dialog")).toHaveCount(0);
        }
      }
      const control = page.getByRole("combobox", {
        name: kind === "echo" ? "Role" : "Language",
        exact: true,
      });
      for (const font of ["Default", "Serif", "Mono", "Reset"]) {
        if (font !== "Default") {
          await page.getByRole("button", { name: "Customize", exact: true }).click();
          if (font === "Reset")
            await page.getByRole("button", { name: "Reset", exact: true }).click();
          else {
            await page.getByRole("combobox", { name: "Body font", exact: true }).click();
            await page.getByRole("option", { name: font, exact: true }).click();
          }
          await page.getByRole("button", { name: "Close customizer", exact: true }).click();
        }
        const family = font === "Serif" ? /Georgia/ : font === "Mono" ? /monospace/ : /Inter/;
        await expect(control).toHaveCSS("font-family", family);
        await control.click();
        const listbox = page.getByRole("listbox");
        await expect(listbox).toHaveCSS("font-family", family);
        await page.screenshot({ path: info.outputPath(`${font}-portal.png`) });
        await listbox.press("Escape");
        await expect(listbox).toHaveCount(0);
        await expect(control).toBeFocused();
      }
      expect(errors).toEqual([]);
    });
