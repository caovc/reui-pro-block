import { expect, test } from "@playwright/test";
for (const kind of ["tempo", "mesh"])
  for (const width of [1440, 390])
    test(`${kind} actual Customize UI Default Serif Mono Reset reaches account and Settings portals ${width}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
      const errors: string[] = [];
      const externalAvatarRequests: string[] = [];
      page.on("request", (request) => {
        if (request.url().includes("images.unsplash.com"))
          externalAvatarRequests.push(request.url());
      });
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("console", (e) => {
        if (e.type() === "error" || e.type() === "warning") errors.push(e.text());
      });
      await page.goto(`./#/templates/${kind}`);
      if (kind === "tempo") {
        if (width === 390)
          await page.getByRole("button", { name: "Open navigation", exact: true }).click();
        await page.getByRole("button", { name: "Tasks", exact: true }).click();
        await expect(
          page.getByRole("textbox", { name: "Search tasks", exact: true }),
        ).toBeVisible();
      }
      let name = kind === "tempo" ? "Nick Bold" : "Sienna Wells";
      for (const state of ["Default", "Serif", "Mono", "Reset"]) {
        if (state !== "Default") {
          await page.getByRole("button", { name: "Customize", exact: true }).click();
          if (state === "Reset")
            await page.getByRole("button", { name: "Reset", exact: true }).click();
          else {
            await page.getByRole("combobox", { name: "Body font", exact: true }).click();
            await page.getByRole("option", { name: state, exact: true }).click();
          }
          await page.getByRole("button", { name: "Close customizer", exact: true }).click();
        }
        if (width === 390)
          await page.getByRole("button", { name: "Open navigation", exact: true }).click();
        await page
          .getByRole("button", {
            name: kind === "tempo" ? "Open workspace menu" : `Open profile for ${name}`,
            exact: true,
          })
          .click();
        const expected = state === "Serif" ? /Georgia/ : state === "Mono" ? /monospace/ : /Inter/;
        await expect(page.getByRole("menu")).toHaveCSS("font-family", expected);
        await page.getByRole("menu").screenshot({
          path: `/tmp/bricklane-templates-layout/settings-drive-avatar-font-proof/${kind}-live-font-${state}-${width}-menu.png`,
          animations: "allow",
        });
        await page.getByRole("menuitem", { name: /^Profile/ }).click();
        await expect(page.locator("[data-workflow-account]")).toHaveCSS("font-family", expected);
        await expect(page.getByLabel("Full Name", { exact: true })).toHaveValue(name);
        await page.getByRole("combobox", { name: "Role", exact: true }).click();
        await expect(page.getByRole("listbox")).toHaveCSS("font-family", expected);
        await page.screenshot({
          path: `/tmp/bricklane-templates-layout/settings-drive-avatar-font-proof/${kind}-live-font-${state}-${width}-portal.png`,
          animations: "allow",
        });
        await page.getByRole("listbox").press("Escape");
        await expect(page.getByRole("listbox")).toHaveCount(0);
        await expect(page.getByRole("combobox", { name: "Role", exact: true })).toBeFocused();
        if (state === "Default") {
          name = `${kind} font identity`;
          await page.getByLabel("Full Name", { exact: true }).fill(name);
          await page.getByRole("button", { name: "Save changes", exact: true }).click();
        } else await page.getByRole("button", { name: "Cancel", exact: true }).click();
        await expect(page.locator("[data-workflow-account]")).toHaveCount(0);
        if (width === 390 && kind === "tempo") {
          await page.keyboard.press("Escape");
          await expect(page.locator("[data-mobile=true]")).toHaveCount(0);
        }
      }
      const avatars = page.locator(".wf-person img:visible");
      if (kind === "tempo") {
        await expect(avatars.first()).toBeVisible();
        expect(
          await avatars.evaluateAll((images) =>
            images.every((image) => {
              const avatar = image as HTMLImageElement;
              return (
                avatar.src.startsWith("data:image/svg+xml") &&
                avatar.complete &&
                avatar.naturalWidth > 0
              );
            }),
          ),
        ).toBe(true);
      }
      expect(externalAvatarRequests).toEqual([]);
      expect(errors).toEqual([]);
    });
