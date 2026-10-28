/** Native settings contracts for the integrated Surge and Manifest templates. */
import { expect, test, type Page, type Locator } from "@playwright/test";

type Merchant = "surge" | "manifest";
const sections = [
  "General",
  "Team",
  "Payments",
  "Notifications",
  "Billing",
  "Locations",
  "Suppliers",
] as const;
const errors = new WeakMap<Page, string[]>();

test.beforeEach(async ({ page }) => {
  const messages: string[] = [];
  errors.set(page, messages);
  page.on("pageerror", (error) => messages.push(error.message));
  page.on("request", (request) => {
    if (/^https?:/.test(request.url()) && !["GET", "HEAD"].includes(request.method())) {
      messages.push(`Unexpected HTTP write: ${request.method()} ${request.url()}`);
    }
  });
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) messages.push(message.text());
  });
});
test.afterEach(async ({ page }) => {
  expect(errors.get(page) ?? []).toEqual([]);
});

async function settled(page: Page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      document
        .getAnimations()
        .filter((animation) => {
          const iterations = animation.effect?.getTiming().iterations;
          return typeof iterations === "number" && Number.isFinite(iterations);
        })
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
}
async function open(page: Page, id: Merchant, width: number, workspace = false) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/#/${workspace ? "templates" : "template-preview"}/${id}/settings?qa=commerce`, {
    waitUntil: "networkidle",
  });
  if (id === "manifest") {
    await page.getByRole("button", { name: "Log in", exact: true }).click();
  }
  await expect(page.locator(".bt-layout")).toBeVisible();
  await expect(
    page.locator(".bt-content").getByRole("heading", { name: "General", exact: true }),
  ).toBeVisible();
  await settled(page);
}
async function navigation(page: Page, width: number) {
  if (width === 390) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    const drawer = page.locator(".bt-layout-mobile");
    await expect(drawer).toBeVisible();
    return drawer;
  }
  return page.locator('.bt-sidebar[data-slot="sidebar-container"]');
}
async function select(page: Page, width: number, label: string) {
  const nav = await navigation(page, width);
  const target = nav.getByRole("button", { name: label, exact: true });
  if (!(await target.isVisible())) {
    await nav.getByRole("button", { name: "Settings", exact: true }).first().click();
    if (width === 390) await expect(nav).toBeVisible();
  }
  await target.click();
  if (width === 390) {
    await expect(nav).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  }
}
async function noDocumentOverflow(page: Page, width: number) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
    width,
  );
}
async function family(locator: Locator) {
  return locator.evaluate((node) => ({
    family: getComputedStyle(node).fontFamily,
    size: getComputedStyle(node).fontSize,
    line: getComputedStyle(node).lineHeight,
  }));
}

for (const id of ["surge", "manifest"] as const)
  for (const width of [1440, 390]) {
    test(`${id} seven native Settings children and General saved/reset/history ${width}`, async ({
      page,
    }, info) => {
      await open(page, id, width);
      for (const label of sections) {
        await select(page, width, label);
        await expect(
          page.locator(".bt-content").getByRole("heading", { name: label, exact: true }),
        ).toBeVisible();
        const section = label === "General" ? "" : `/${label.toLowerCase()}`;
        await expect(page).toHaveURL(
          new RegExp(`#/template-preview/${id}/settings${section}\\?qa=commerce$`),
        );
        await settled(page);
        await noDocumentOverflow(page, width);
        await page.screenshot({ path: info.outputPath(`${label}.png`) });
      }
      await select(page, width, "General");
      const name = page.getByRole("textbox", { name: "Store name", exact: true });
      await name.fill(`Bricklane ${id} saved`);
      await page.getByRole("button", { name: "Save changes", exact: true }).click();
      await expect(page.locator(".bt-topbar")).toContainText(`Bricklane ${id} saved`);
      await select(page, width, "Billing");
      await select(page, width, "General");
      await expect(name).toHaveValue(`Bricklane ${id} saved`);
      await expect(page.locator(".csg-demo-frame")).toHaveCount(id === "surge" ? 1 : 0);
      await page
        .locator(".csg-frame")
        .first()
        .getByRole("button", { name: "Reset", exact: true })
        .click();
      await expect(name).toHaveValue("Bricklane Store");
      await expect(page.locator(".bt-topbar")).toContainText("Bricklane Store");

      // Actual hash history must override and close an old in-page product editor.
      await select(page, width, "Products");
      await page
        .locator(".bt-content")
        .getByRole("button", { name: "New product", exact: true })
        .click();
      await expect(
        page.locator(".bt-content").getByRole("heading", { name: "New product", exact: true }),
      ).toBeVisible();
      await page.goBack();
      await expect(
        page.locator(".bt-content").getByRole("heading", { name: "General", exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Store name", exact: true })).toHaveValue(
        "Bricklane Store",
      );
      await page.goForward();
      await expect(
        page.locator(".bt-content").getByRole("heading", { name: "Products 8", exact: true }),
      ).toBeVisible();
      await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveCount(0);
    });

    test(`${id} Pro invitation commits only local members and computed seat usage ${width}`, async ({
      page,
    }) => {
      await open(page, id, width);
      await select(page, width, "Team");
      await expect(page.locator(".csd-team-heading")).toContainText("12 of 10 seats · 2 pending");
      const invite = page.getByRole("button", { name: "Invite people", exact: true });
      await invite.click();
      const dialog = page.getByRole("dialog", { name: "Invite Collaborators", exact: true });
      await expect(dialog).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Send invitations", exact: true }),
      ).toBeDisabled();
      await dialog
        .getByRole("textbox", { name: "Email address for invite 1", exact: true })
        .fill(`new.${id}.${width}@bricklane.example`);
      await dialog.getByRole("button", { name: "Send invitations", exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(invite).toBeFocused();
      await expect(page.locator(".csd-team-heading")).toContainText("13 of 10 seats · 3 pending");
      await page.getByRole("button", { name: "Go to next page", exact: true }).click();
      await expect(page.locator(".bt-content")).toContainText(
        `new.${id}.${width}@bricklane.example`,
      );
      await select(page, width, "Billing");
      await expect(page.locator(".csd-usage-row").filter({ hasText: "Staff seats" })).toContainText(
        "13 / 10",
      );
      await expect(page.locator(".bt-content")).toContainText("Orders in this preview");
      await select(page, width, "Team");
      await expect(page.locator(".csd-team-heading")).toContainText("13 of 10 seats · 3 pending");
    });

    test(`${id} location local CRUD derives counts and native popup focus ${width}`, async ({
      page,
    }) => {
      await open(page, id, width);
      await select(page, width, "Locations");
      const create = page.getByRole("button", { name: "New location", exact: true });
      await create.click();
      const dialog = page.getByRole("dialog", { name: "New location", exact: true });
      await dialog
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(`Bricklane location ${width}`);
      await dialog.getByRole("textbox", { name: "Address", exact: true }).fill("18 Example Lane");
      await dialog.getByRole("button", { name: "Create location", exact: true }).click();
      await expect(dialog).toBeHidden();
      await expect(create).toBeFocused();
      const list = page.locator(".csd-record-list");
      let row = list.getByRole("listitem").filter({ hasText: `Bricklane location ${width}` });
      await expect(row).toContainText("0 SKUs");
      await row
        .getByRole("button", { name: `Actions for Bricklane location ${width}`, exact: true })
        .click();
      await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
      const edit = page.getByRole("dialog", { name: "Edit location", exact: true });
      await edit
        .getByRole("textbox", { name: "Name", exact: true })
        .fill(`Renamed location ${width}`);
      await edit.getByRole("button", { name: "Save location", exact: true }).click();
      row = list.getByRole("listitem").filter({ hasText: `Renamed location ${width}` });
      const actions = row.getByRole("button", {
        name: `Actions for Renamed location ${width}`,
        exact: true,
      });
      await expect(actions).toBeFocused();
      await expect(row).toContainText("0 SKUs");
      await actions.click();
      await page.getByRole("menuitem", { name: "Deactivate", exact: true }).click();
      await expect(row).toContainText("Inactive");
      await actions.click();
      await page.getByRole("menuitem", { name: "Remove", exact: true }).click();
      const confirmation = page.getByRole("alertdialog", {
        name: `Remove Renamed location ${width}?`,
        exact: true,
      });
      await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(actions).toBeFocused();
      await actions.click();
      await page.getByRole("menuitem", { name: "Remove", exact: true }).click();
      await confirmation.getByRole("button", { name: "Remove location", exact: true }).click();
      await expect(row).toHaveCount(0);
      await expect(create).toBeFocused();
      await select(page, width, "General");
      await select(page, width, "Locations");
      await expect(list).not.toContainText(`Renamed location ${width}`);
    });

    test(`${id} Orders notification matrix is independent and persists locally ${width}`, async ({
      page,
    }) => {
      await open(page, id, width);
      await select(page, width, "Notifications");
      for (const channel of ["Email", "SMS", "In-app"]) {
        await expect(
          page.getByRole("checkbox", { name: `New order placed via ${channel}`, exact: true }),
        ).toBeChecked();
      }
      const sms = page.getByRole("checkbox", { name: "Payment received via SMS", exact: true });
      await expect(sms).not.toBeChecked();
      await sms.click();
      await expect(sms).toBeChecked();
      await expect(
        page.getByRole("checkbox", { name: "Order fulfilled or shipped via In-app", exact: true }),
      ).not.toBeChecked();
      await select(page, width, "Billing");
      await select(page, width, "Notifications");
      await expect(sms).toBeChecked();
      await page.getByRole("tab", { name: "System", exact: true }).click();
      await expect(page.getByRole("tabpanel", { name: "System", exact: true })).toContainText(
        "Original local demo preferences",
      );
      await noDocumentOverflow(page, width);
    });

    test(`${id} actual Customize fonts reach native invite dialog and role popup ${width}`, async ({
      page,
    }, info) => {
      await open(page, id, width, true);
      await select(page, width, "Team");
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
        const expected = font === "Serif" ? /Georgia/ : font === "Mono" ? /monospace/ : /Inter/;
        const trigger = page.getByRole("button", { name: "Invite people", exact: true });
        await expect(trigger).toHaveCSS("font-family", expected);
        await trigger.click();
        const dialog = page.getByRole("dialog", { name: "Invite Collaborators", exact: true });
        const email = dialog.getByRole("textbox", {
          name: "Email address for invite 1",
          exact: true,
        });
        const role = dialog.getByRole("combobox", { name: "Role for invite 1", exact: true });
        await expect(dialog).toHaveCSS("font-family", expected);
        await expect(email).toHaveCSS("font-family", expected);
        await role.click();
        const popup = page.getByRole("listbox");
        await expect(popup).toHaveCSS("font-family", expected);
        await settled(page);
        // The native modal Select hides the surrounding Dialog from the accessibility tree.
        // Include hidden nodes only for computed-style measurements while this popup is open.
        const measuredDialog = page.getByRole("dialog", {
          name: "Invite Collaborators",
          exact: true,
          includeHidden: true,
        });
        const measuredEmail = measuredDialog.getByRole("textbox", {
          name: "Email address for invite 1",
          exact: true,
          includeHidden: true,
        });
        await info.attach(`${font}-computed-font`, {
          body: JSON.stringify(
            {
              dialog: await family(measuredDialog),
              email: await family(measuredEmail),
              popup: await family(popup),
            },
            null,
            2,
          ),
          contentType: "application/json",
        });
        await page.screenshot({ path: info.outputPath(`${font}-invite-role.png`) });
        await popup.press("Escape");
        await expect(role).toBeFocused();
        await page.keyboard.press("Escape");
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
      }
    });
  }

for (const width of [1440, 390]) {
  test(`surge demo actions preserve authored collections and reset real cloned defaults ${width}`, async ({
    page,
  }) => {
    await open(page, "surge", width);
    const demo = page.locator(".csg-demo-frame");
    await demo.getByRole("button", { name: "Clear", exact: true }).click();
    await select(page, width, "Customers");
    await expect(page.locator(".bt-content")).not.toContainText("Maya Thompson");
    await page.getByRole("button", { name: "Add customer", exact: true }).click();
    const customer = page.getByRole("dialog", { name: "Add customer", exact: true });
    await customer
      .getByRole("textbox", { name: "Customer name", exact: true })
      .fill("Bricklane authored customer");
    await customer
      .getByRole("textbox", { name: "Email address", exact: true })
      .fill("authored@bricklane.example");
    await customer.getByRole("button", { name: "Save", exact: true }).click();
    await select(page, width, "Products");
    await page.getByRole("button", { name: "New product", exact: true }).click();
    await page
      .getByRole("textbox", { name: "Title", exact: true })
      .fill("Bricklane authored product");
    await page.getByRole("button", { name: "Create product", exact: true }).click();
    await select(page, width, "General");
    await demo.getByRole("button", { name: "Load demo data", exact: true }).click();
    await select(page, width, "Products");
    await expect(page.locator(".bt-content")).toContainText("Bricklane authored product");
    await expect(page.locator(".bt-content")).not.toContainText("Alpine Down Vest");
    await select(page, width, "Customers");
    await expect(page.locator(".bt-content")).toContainText("Bricklane authored customer");
    await expect(page.locator(".bt-content")).not.toContainText("Maya Thompson");
    await select(page, width, "Inventory");
    await expect(page.locator(".bt-content")).toContainText("AC-1240");
    await select(page, width, "Orders");
    await expect(page.locator(".bt-content")).toContainText("#MF-1038");
    await select(page, width, "General");
    await demo.getByRole("button", { name: "Reset", exact: true }).click();
    await select(page, width, "Products");
    await expect(page.locator(".bt-content")).toContainText("Alpine Down Vest");
    await expect(page.locator(".bt-content")).not.toContainText("Bricklane authored product");
    await select(page, width, "Customers");
    await expect(page.locator(".bt-content")).toContainText("Maya Thompson");
    await expect(page.locator(".bt-content")).not.toContainText("Bricklane authored customer");
  });
}
