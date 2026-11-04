/** Native settings contracts for the integrated Surge and Manifest templates. */
import { expect, test, type Page, type Locator, type TestInfo } from "@playwright/test";

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
  const surge = (await page.locator(".bt-layout.bt-surge").count()) === 1;
  const leafName =
    surge && label === "Customers"
      ? "All customers"
      : surge && label === "Inventory"
        ? "Stock ledger"
        : label;
  const target = nav.getByRole(surge ? "link" : "button", { name: leafName, exact: true });
  if (!(await target.isVisible())) {
    const parentName = surge && ["Customers", "Inventory"].includes(label) ? label : "Settings";
    await nav.getByRole("button", { name: parentName, exact: true }).first().click();
    if (width === 390) await expect(nav).toBeVisible();
  }
  await target.click();
  if (width === 390) {
    if (surge) {
      await expect(nav).toBeVisible();
      await expect(target).toBeFocused();
      await page.keyboard.press("Escape");
    }
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

const COMMERCE_NOTIFICATION_SOURCE_SHA256 = {
  "src/templates/business/commerce-settings-model.ts":
    "428a63b77cd46ab7290929cdc1c20959876f0b6eac257840acccbff75e9c5ecf",
  "src/templates/business/commerce-settings-notifications.tsx":
    "177d073b8d895864dc5ab9cd263ce667fe8478985ae4a0b88c6e91c8b1b1b4d7",
  "src/templates/business/commerce-settings-header.css":
    "cf40e930ede4286739ef5f612a58e3b568ea6d44e127113ebc9b98b47a9b1310",
  "src/templates/business/commerce-settings-domains.css":
    "bf1388ab10e4ac4adcc9c71de9faf5340272432dd1ffe078b4a1516e8195fdc9",
};

// Native-only incremental acceptance for the existing four notification cases.
const notificationTitles = [
  "New order placed",
  "Payment received",
  "Order fulfilled or shipped",
  "Order cancelled",
  "Refund requested",
  "Chargeback received",
] as const;
const notificationChannels = ["Email", "SMS", "In-app"] as const;
const notificationTabNames = ["Orders", "Inventory", "Customers", "System"] as const;

async function sidebarContract(page: Page, width: number, active: string) {
  const nav = await navigation(page, width);
  const surge = (await page.locator(".bt-layout.bt-surge").count()) === 1;
  const parent = nav.getByRole("button", { name: "Settings", exact: true });
  if ((await parent.getAttribute("aria-expanded")) !== "true") await parent.click();
  await expect(parent).toHaveAttribute("aria-expanded", "true");
  const item = nav.locator(
    '[data-sidebar="menu-item"]:has(> [data-sidebar="menu-button"][aria-label="Settings"])',
  );
  const list = item.locator('[data-slot="sidebar-menu-sub"]');
  await expect(list).toHaveJSProperty("tagName", "UL");
  const leaves = list.locator('[data-slot="sidebar-menu-sub-button"]');
  await expect(leaves).toHaveText([...sections]);
  await expect(
    list.locator('[data-slot="sidebar-menu-sub-button"][aria-current="page"]'),
  ).toHaveCount(1);
  await expect(
    list.getByRole(surge ? "link" : "button", { name: active, exact: true }),
  ).toHaveAttribute("aria-current", "page");
  await expect(
    list.getByRole(surge ? "link" : "button", { name: active, exact: true }),
  ).toHaveAttribute("data-active", "true");
  await page.mouse.move(0, 0);
  await settled(page);
  const measured = await item.evaluate((node) => {
    const parent = node.querySelector<HTMLElement>(
      ':scope > [data-sidebar="menu-button"][aria-label="Settings"]',
    )!;
    const list = node.querySelector<HTMLElement>('[data-slot="sidebar-menu-sub"]')!;
    const style = getComputedStyle(list);
    return {
      itemSlot: node.getAttribute("data-slot"),
      itemSidebar: node.getAttribute("data-sidebar"),
      parentSlot: parent.getAttribute("data-slot"),
      parentSidebar: parent.getAttribute("data-sidebar"),
      oldSelectorCount: node.querySelectorAll(
        ':scope > [data-slot="sidebar-menu-button"][aria-label="Settings"]',
      ).length,
      newSelectorCount: node.querySelectorAll(
        ':scope > [data-sidebar="menu-button"][aria-label="Settings"]',
      ).length,
      trailMatches: node.matches(
        '[data-sidebar="menu-item"]:has([data-slot="sidebar-menu-sub-button"][data-active="true"])',
      ),
      parentBackground: getComputedStyle(parent).backgroundColor,
      marginStart: style.marginBlockStart,
      marginEnd: style.marginBlockEnd,
      leaves: [...list.querySelectorAll<HTMLElement>('[data-slot="sidebar-menu-sub-button"]')].map(
        (leaf) => ({
          height: leaf.getBoundingClientRect().height,
          cssHeight: getComputedStyle(leaf).height,
          fontSize: getComputedStyle(leaf).fontSize,
          lineHeight: getComputedStyle(leaf).lineHeight,
        }),
      ),
    };
  });
  expect(measured.newSelectorCount).toBe(1);
  expect(measured.trailMatches).toBe(true);
  expect(measured.parentBackground).not.toMatch(/^(transparent|rgba\(0, 0, 0, 0\))$/);
  expect(measured.marginStart).toBe("0px");
  expect(measured.marginEnd).toBe("0px");
  for (const leaf of measured.leaves) {
    expect(leaf.cssHeight).toBe("28px");
    expect(leaf.height).toBeCloseTo(28, 1);
    expect(leaf.fontSize).toBe("14px");
    expect(leaf.lineHeight).toBe("20px");
  }
  if (width === 390) {
    await page.keyboard.press("Escape");
    await expect(nav).toBeHidden();
    await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
  }
  return measured;
}

async function nativeClip(locator: Locator, kind: "tab" | "checkbox") {
  const measured = await locator.evaluate((node) => {
    const style = getComputedStyle(node),
      box = node.getBoundingClientRect();
    const pseudo = getComputedStyle(node, "::after");
    const rect = { left: box.left, right: box.right, top: box.top, bottom: box.bottom };
    const clips = [];
    for (let ancestor = node.parentElement; ancestor; ancestor = ancestor.parentElement) {
      const css = getComputedStyle(ancestor),
        bounds = ancestor.getBoundingClientRect();
      const x = /^(hidden|clip|auto|scroll)$/.test(css.overflowX);
      const y = /^(hidden|clip|auto|scroll)$/.test(css.overflowY);
      if (x || y)
        clips.push({
          tag: ancestor.tagName,
          slot: ancestor.getAttribute("data-slot"),
          className: ancestor.className,
          x,
          y,
          left: bounds.left + ancestor.clientLeft,
          top: bounds.top + ancestor.clientTop,
          right: bounds.left + ancestor.clientLeft + ancestor.clientWidth,
          bottom: bounds.top + ancestor.clientTop + ancestor.clientHeight,
        });
    }
    const pseudoHeight = parseFloat(pseudo.height) || 0;
    const pseudoBottom = parseFloat(pseudo.bottom) || 0;
    return {
      rect,
      clips,
      focusVisible: node.matches(":focus-visible"),
      shadow: style.boxShadow,
      outline: style.outlineWidth,
      outlineStyle: style.outlineStyle,
      ringWidth: style.getPropertyValue("--tw-ring-shadow"),
      pseudo: {
        display: pseudo.display,
        opacity: pseudo.opacity,
        bottom: pseudoBottom,
        height: pseudoHeight,
      },
      underline: {
        left: box.left + (parseFloat(pseudo.left) || 0),
        right: box.right - (parseFloat(pseudo.right) || 0),
        bottom: box.bottom - pseudoBottom,
        top: box.bottom - pseudoBottom - pseudoHeight,
      },
    };
  });
  expect(measured.focusVisible).toBe(true);
  expect(measured.shadow).not.toBe("none");
  expect(measured.ringWidth).toMatch(/3px/);
  if (kind === "tab") {
    expect(measured.outline).toBe("1px");
    expect(measured.outlineStyle).not.toBe("none");
    expect(measured.pseudo.display).not.toBe("none");
    expect(Number(measured.pseudo.opacity)).toBe(1);
    expect(measured.pseudo.height).toBe(2);
  }
  for (const clip of measured.clips) {
    if (clip.x) {
      expect(measured.rect.left - 3).toBeGreaterThanOrEqual(clip.left - 1);
      expect(measured.rect.right + 3).toBeLessThanOrEqual(clip.right + 1);
      if (kind === "tab") {
        expect(measured.underline.left).toBeGreaterThanOrEqual(clip.left - 1);
        expect(measured.underline.right).toBeLessThanOrEqual(clip.right + 1);
      }
    }
    if (clip.y) {
      expect(measured.rect.top - 3).toBeGreaterThanOrEqual(clip.top - 1);
      expect(measured.rect.bottom + 3).toBeLessThanOrEqual(clip.bottom + 1);
      if (kind === "tab") expect(measured.underline.bottom).toBeLessThanOrEqual(clip.bottom + 1);
    }
  }
  return measured;
}

async function tabPanel(page: Page, name: string) {
  const scope = page.locator(".commerce-settings-domains");
  const list = scope.getByRole("tablist", { name: "Notification categories", exact: true });
  const tab = list.getByRole("tab", { name, exact: true });
  await expect(tab).toHaveAttribute("aria-selected", "true");
  await expect(list.locator('[role="tab"][aria-selected="true"]')).toHaveCount(1);
  const tabID = await tab.getAttribute("id"),
    panelID = await tab.getAttribute("aria-controls");
  expect(tabID).toBeTruthy();
  expect(panelID).toBeTruthy();
  const panel = scope.getByRole("tabpanel", { name, exact: true });
  await expect(panel).toHaveAttribute("id", panelID!);
  await expect(panel).toHaveAttribute("aria-labelledby", tabID!);
  await expect(panel).toHaveAttribute("data-slot", "tabs-content");
  await expect(panel).toBeVisible();
  for (const other of notificationTabNames.filter((label) => label !== name)) {
    await expect(list.getByRole("tab", { name: other, exact: true })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  }
  return panel;
}

async function notificationTabs(page: Page, info: TestInfo) {
  const scope = page.locator(".commerce-settings-domains");
  const list = scope.getByRole("tablist", { name: "Notification categories", exact: true });
  await expect(list).toHaveAttribute("data-slot", "tabs-list");
  await expect(list.getByRole("tab")).toHaveText([...notificationTabNames]);
  const geometry = await list.evaluate((node) => {
    const css = getComputedStyle(node);
    return {
      height: node.getBoundingClientRect().height,
      padding: [css.paddingTop, css.paddingRight, css.paddingBottom, css.paddingLeft],
      triggers: [...node.querySelectorAll('[role="tab"]')].map(
        (tab) => tab.getBoundingClientRect().height,
      ),
    };
  });
  expect(geometry.padding).toEqual(["0px", "0px", "0px", "0px"]);
  expect(geometry.height).toBeCloseTo(32, 1);
  for (const height of geometry.triggers) expect(height).toBeCloseTo(31, 1);
  await tabPanel(page, "Orders");
  const orders = list.getByRole("tab", { name: "Orders", exact: true });
  await orders.click();
  await expect(orders).toBeFocused();
  const scrollY = await page.evaluate(() => window.scrollY);
  const steps = [
    ["ArrowRight", "Inventory"],
    ["ArrowRight", "Customers"],
    ["ArrowRight", "System"],
    ["ArrowLeft", "Customers"],
    ["Home", "Orders"],
    ["End", "System"],
    ["Home", "Orders"],
  ];
  const evidence = [];
  for (const [key, name] of steps) {
    await page.keyboard.press(key);
    const tab = list.getByRole("tab", { name, exact: true });
    await expect(tab).toBeFocused();
    await tabPanel(page, name);
    await settled(page);
    const clip = await nativeClip(tab, "tab");
    const scrollport = await scope.locator(".csd-tabs-scroll").evaluate((node) => ({
      clientWidth: node.clientWidth,
      scrollWidth: node.scrollWidth,
      clientHeight: node.clientHeight,
      scrollHeight: node.scrollHeight,
      left: node.scrollLeft,
      top: node.scrollTop,
      overflowX: getComputedStyle(node).overflowX,
      overflowY: getComputedStyle(node).overflowY,
    }));
    expect(scrollport.scrollHeight).toBeLessThanOrEqual(scrollport.clientHeight + 1);
    expect(scrollport.top).toBe(0);
    expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);
    evidence.push({ key, name, clip, scrollport });
  }
  await page.screenshot({ path: info.outputPath("Orders-native-tab-focus.png"), fullPage: true });
  return { geometry, evidence };
}

async function notificationSnapshot(page: Page) {
  const panel = await tabPanel(page, "Orders");
  const result: Record<string, boolean> = {};
  for (const title of notificationTitles)
    for (const channel of notificationChannels) {
      const label = `${title} via ${channel}`;
      const checkbox = panel.getByRole("checkbox", { name: label, exact: true });
      await expect(checkbox).toHaveCount(1);
      result[label] = await checkbox.isChecked();
    }
  await expect(panel.getByRole("checkbox")).toHaveCount(18);
  return result;
}

async function notificationGrids(page: Page, width: number) {
  const panel = await tabPanel(page, "Orders");
  const groups = panel.locator(":scope > .csd-notification-grid");
  await expect(groups).toHaveCount(2);
  const result = [];
  for (const [index, title] of ["Order lifecycle", "Payments & disputes"].entries()) {
    const group = groups.nth(index);
    await expect(group.locator('[data-slot="data-grid-table-viewport"]')).toHaveCount(1);
    await expect(group.locator('[data-slot="scroll-area-viewport"]')).toHaveCount(1);
    const table = group.locator('[data-slot="data-grid-table"]');
    await expect(table).toHaveCount(1);
    await expect(table.getByRole("columnheader")).toHaveText([title, ...notificationChannels]);
    await expect(table.getByRole("checkbox")).toHaveCount(index === 0 ? 12 : 6);
    await expect(table.locator("tbody tr")).toHaveCount(index === 0 ? 4 : 2);
    const geometry = await group.evaluate((node) => {
      const table = node.querySelector<HTMLElement>('[data-slot="data-grid-table"]')!;
      const grid = node.querySelector<HTMLElement>('[data-slot="data-grid-table-viewport"]')!;
      const scroll = node.querySelector<HTMLElement>('[data-slot="scroll-area-viewport"]')!;
      const bounds = scroll.getBoundingClientRect();
      const cells = [...table.querySelectorAll<HTMLElement>("th, td")].map((cell) => {
        const css = getComputedStyle(cell),
          box = cell.getBoundingClientRect();
        const checkbox = cell.querySelector<HTMLElement>('[data-slot="checkbox"][role="checkbox"]');
        const checkboxBox = checkbox?.getBoundingClientRect();
        const contentLeft =
          box.left + parseFloat(css.borderLeftWidth) + parseFloat(css.paddingLeft);
        const contentRight =
          box.right - parseFloat(css.borderRightWidth) - parseFloat(css.paddingRight);
        return {
          title: cell.textContent?.trim(),
          first: !cell.previousElementSibling,
          last: !cell.nextElementSibling,
          tag: cell.tagName,
          left: box.left,
          right: box.right,
          height: box.height,
          clientWidth: cell.clientWidth,
          scrollWidth: cell.scrollWidth,
          whiteSpace: css.whiteSpace,
          lineHeight: parseFloat(css.lineHeight),
          ps: css.paddingInlineStart,
          pe: css.paddingInlineEnd,
          pt: css.paddingTop,
          pb: css.paddingBottom,
          checkbox: checkboxBox
            ? {
                label: checkbox!.getAttribute("aria-label"),
                left: checkboxBox.left,
                right: checkboxBox.right,
                top: checkboxBox.top,
                bottom: checkboxBox.bottom,
                centerX: (checkboxBox.left + checkboxBox.right) / 2,
                contentLeft,
                contentRight,
                contentCenterX: (contentLeft + contentRight) / 2,
              }
            : null,
        };
      });
      return {
        available: node.clientWidth,
        tableWidth: table.getBoundingClientRect().width,
        widths: [table, grid, scroll].map((element) => ({
          client: element.clientWidth,
          scroll: element.scrollWidth,
          overflowX: getComputedStyle(element).overflowX,
        })),
        scrollLeft: bounds.left + scroll.clientLeft,
        scrollRight: bounds.left + scroll.clientLeft + scroll.clientWidth,
        top: node.getBoundingClientRect().top,
        bottom: node.getBoundingClientRect().bottom,
        marginTop: getComputedStyle(node).marginTop,
        cells,
      };
    });
    expect(Math.abs(geometry.tableWidth - geometry.available)).toBeLessThanOrEqual(1);
    for (const measured of geometry.widths) {
      expect(measured.scroll).toBeLessThanOrEqual(measured.client + 1);
      expect(measured.overflowX).not.toBe("hidden");
    }
    for (const cell of geometry.cells) {
      expect(cell.scrollWidth).toBeLessThanOrEqual(cell.clientWidth + 1);
      expect(cell.ps).toBe(cell.first ? "0px" : "12px");
      expect(cell.pe).toBe(cell.last ? "0px" : "12px");
      if (cell.first) {
        expect(cell.whiteSpace).toBe("normal");
        expect(cell.left).toBeGreaterThanOrEqual(geometry.scrollLeft - 1);
      }
      if (cell.last) expect(cell.right).toBeLessThanOrEqual(geometry.scrollRight + 1);
      if (cell.tag === "TD") {
        expect(cell.pt).toBe("8px");
        expect(cell.pb).toBe("8px");
        if (!cell.first) {
          expect(cell.checkbox).toBeTruthy();
          expect(
            Math.abs(cell.checkbox!.centerX - cell.checkbox!.contentCenterX),
            `${cell.checkbox!.label}: native Checkbox must center within the channel TD content box`,
          ).toBeLessThanOrEqual(1);
        }
      }
    }
    const long = geometry.cells.find((cell) => cell.title === "Order fulfilled or shipped");
    if (width === 390 && index === 0) {
      expect(long).toBeTruthy();
      expect(
        (long!.height - parseFloat(long!.pt) - parseFloat(long!.pb)) / long!.lineHeight,
      ).toBeGreaterThan(1.5);
    }
    result.push(geometry);
  }
  expect(Math.abs(result[1].top - result[0].bottom - 20)).toBeLessThanOrEqual(1);
  return result;
}

async function notificationNativeToggle(page: Page, info: TestInfo) {
  const before = await notificationSnapshot(page);
  const label = "New order placed via Email";
  const target = page.getByRole("checkbox", { name: label, exact: true });
  const focus = [];
  for (const [index, checked] of [!before[label], before[label], !before[label]].entries()) {
    if (index === 0) await target.click();
    else await page.keyboard.press("Space");
    await expect(target).toBeFocused();
    await expect(target).toBeChecked({ checked });
    await expect(target).toHaveAttribute("aria-checked", String(checked));
    await expect(target.locator('[data-slot="checkbox-indicator"]')).toHaveCount(checked ? 1 : 0);
    if (index > 0) {
      await settled(page);
      focus.push(await nativeClip(target, "checkbox"));
    }
  }
  const after = await notificationSnapshot(page);
  expect(after).toEqual({ ...before, [label]: !before[label] });
  await page.screenshot({
    path: info.outputPath("Orders-native-checkbox-focus.png"),
    fullPage: true,
  });
  await page.getByRole("tab", { name: "Inventory", exact: true }).click();
  await tabPanel(page, "Inventory");
  await page.getByRole("tab", { name: "Orders", exact: true }).click();
  expect(await notificationSnapshot(page)).toEqual(after);
  return { before, after, focus };
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
      if (id === "surge") {
        await expect(page).toHaveURL(/#\/template-preview\/surge\/products\/new\?qa=commerce$/);
        await page.goBack();
        await expect(page).toHaveURL(/#\/template-preview\/surge\/products\?qa=commerce$/);
        await expect(
          page.locator(".bt-content").getByRole("heading", { name: "Products 8", exact: true }),
        ).toBeVisible();
        await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveCount(0);
      }
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
      if (id === "surge") {
        await page.goForward();
        await expect(page).toHaveURL(/#\/template-preview\/surge\/products\/new\?qa=commerce$/);
        await expect(page.getByRole("textbox", { name: "Title", exact: true })).toBeVisible();
        await page.goBack();
        await expect(page).toHaveURL(/#\/template-preview\/surge\/products\?qa=commerce$/);
        await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveCount(0);
      }
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
    }, info) => {
      await open(page, id, width);
      const generalSidebar = await sidebarContract(page, width, "General");
      await select(page, width, "Notifications");
      const notificationSidebar = await sidebarContract(page, width, "Notifications");
      const tabs = await notificationTabs(page, info);
      const grids = await notificationGrids(page, width);
      const initialNotifications = await notificationSnapshot(page);
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
      expect(await notificationSnapshot(page)).toEqual({
        ...initialNotifications,
        "Payment received via SMS": true,
      });
      const interaction = await notificationNativeToggle(page, info);
      await select(page, width, "Dashboard");
      await select(page, width, "General");
      await select(page, width, "Notifications");
      expect(await notificationSnapshot(page)).toEqual(interaction.after);
      await info.attach("commerce-native-geometry", {
        body: JSON.stringify(
          {
            candidateSourceSHA256: COMMERCE_NOTIFICATION_SOURCE_SHA256,
            viewport: page.viewportSize(),
            generalSidebar,
            notificationSidebar,
            tabs,
            grids,
            initialNotifications,
            interaction,
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
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
