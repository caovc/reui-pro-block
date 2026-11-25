import { expect, test } from "@playwright/test";

export function registerInvitationCase(primitive: "radix" | "base", style = "sera", width = 320) {
  test(`${primitive} ${style} ${width}px Quick Entry keeps invitation actions inside their card`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width, height: 844 });
    const entry = primitive === "base" ? "./base/" : "./";
    const preset = new URLSearchParams({
      preset: JSON.stringify({ primitive, style, mode: "light" }),
    });
    await page.goto(`${entry}#/preview/application/dialog/dialog-12?${preset}`);
    await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
    await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
    await expect(page).toHaveURL(/#\/preview\/application\/dialog\/dialog-12\?/);
    await expect(page).toHaveTitle("Quick Create Entry — Preview");
    const launcher = page.getByRole("button", { name: "Open quick entry", exact: true });
    await launcher.click();
    const dialog = page.getByRole("dialog", { name: "Create entry", exact: true });
    const email = dialog.getByLabel("Invite email", { exact: true });
    const dismiss = dialog.getByRole("button", { name: "Dismiss invitation", exact: true });
    const save = dialog.getByRole("button", { name: "Save invitation draft", exact: true });

    async function openInvitation() {
      await dialog.locator("#entry-assignee").click();
      await page.getByPlaceholder("Select assignee").fill("Invite");
      await page.getByRole("option", { name: "Invite...", exact: true }).click();
      await email.fill("qa@example.com");
      await save.scrollIntoViewIfNeeded();
      await page.evaluate(() => document.fonts.ready.then(() => undefined));
    }

    await openInvitation();
    const bounds = await dismiss.evaluate((button) => {
      const card = button.closest('[data-slot="field-group"]')!;
      const outer = card.getBoundingClientRect();
      return Array.from(card.querySelectorAll("button")).map((action) => {
        const box = action.getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(action);
        const label = range.getBoundingClientRect();
        const hit = document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2);
        return {
          text: action.textContent,
          cardLeft: outer.left,
          cardRight: outer.right,
          left: box.left,
          right: box.right,
          top: box.top,
          bottom: box.bottom,
          labelLeft: label.left,
          labelRight: label.right,
          labelTop: label.top,
          labelBottom: label.bottom,
          hit: action.contains(hit),
        };
      });
    });
    await info.attach("invitation-action-bounds", {
      body: JSON.stringify(bounds, null, 2),
      contentType: "application/json",
    });
    await page.screenshot({
      path: info.outputPath("phone-invitation.png"),
      animations: "disabled",
    });
    for (const action of bounds) {
      expect(action.left).toBeGreaterThanOrEqual(action.cardLeft);
      expect(action.right).toBeLessThanOrEqual(action.cardRight);
      expect(action.labelLeft).toBeGreaterThanOrEqual(action.left);
      expect(action.labelRight).toBeLessThanOrEqual(action.right);
      expect(action.labelTop).toBeGreaterThanOrEqual(action.top);
      expect(action.labelBottom).toBeLessThanOrEqual(action.bottom);
      expect(action.hit).toBe(true);
    }
    expect(
      await dialog
        .locator(".final-entry-body")
        .evaluate((body) => body.scrollWidth > body.clientWidth),
    ).toBe(false);
    if (width >= 640 && style === "nova") {
      await expect(dismiss).toHaveCSS("height", "32px");
      await expect(save).toHaveCSS("height", "32px");
    }
    await save.click();
    await expect(email).toHaveCount(0);
    await expect(dialog.getByRole("alert")).toContainText("qa@example.com");
    await expect(dialog.getByRole("alert")).toContainText("No email was sent");
    await openInvitation();
    await dismiss.click();
    await expect(email).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(launcher).toBeFocused();
    expect(errors).toEqual([]);
  });
}

for (const primitive of ["radix", "base"] as const) registerInvitationCase(primitive);
