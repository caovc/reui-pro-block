import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test.setTimeout(30_000);
test.describe.configure({ retries: 0 });
test.use({ deviceScaleFactor: 1, colorScheme: "light" });

const faults = new WeakMap<Page, { errors: string[]; warnings: string[]; writes: string[] }>();

test.beforeEach(async ({ page }) => {
  const log = { errors: [] as string[], warnings: [] as string[], writes: [] as string[] };
  faults.set(page, log);
  page.on("pageerror", (error) => log.errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") log.errors.push(message.text());
    if (message.type() === "warning") log.warnings.push(message.text());
  });
  page.on("request", (request) => {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      log.writes.push(`${request.method()} ${request.url()}`);
    }
  });
});

test.afterEach(async ({ page }, info) => {
  const log = faults.get(page);
  await writeFile(info.outputPath("console-and-writes.json"), JSON.stringify(log, null, 2) + "\n");
  expect(log?.errors).toEqual([]);
  expect(log?.warnings).toEqual([]);
  expect(log?.writes).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

async function enterSettings(page: Page, section: string, width: number) {
  await expect(page.locator(".wf-header > span").first()).toHaveText("Dashboard");
  if (width === 390) {
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  }
  await page.getByRole("button", { name: "Settings", exact: true }).click();
  if (width === 390) {
    if (!(await page.getByRole("dialog").count())) {
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    }
    await page.getByRole("dialog").getByRole("button", { name: section, exact: true }).click();
    await page.keyboard.press("Escape");
  } else {
    await page.locator(".fs-secondary").getByRole("button", { name: section, exact: true }).click();
  }
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".fs-workspace")).toHaveAttribute(
    "data-settings-section",
    section.toLowerCase(),
  );
  await expect(
    page.getByRole("heading", { name: `${section} Settings`, exact: true }),
  ).toBeVisible();
  await page.evaluate(async () => document.fonts.ready);
}

async function open(page: Page, section: string, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/flowly");
  await enterSettings(page, section, width);
}

async function settledDialog(dialog: Locator) {
  await expect(dialog).toBeVisible();
  // Observe the real entrance animation; no motion, focus or style override.
  await expect
    .poll(() =>
      dialog.evaluate(
        (root) => root.getAnimations().filter((a) => a.playState === "running" || a.pending).length,
      ),
    )
    .toBe(0);
}

async function sheetGeometry(dialog: Locator, info: TestInfo, name: string) {
  const measured = await dialog.evaluate((root) => {
    const metric = (e: Element | null) => {
      if (!e) return null;
      const b = e.getBoundingClientRect(),
        s = getComputedStyle(e);
      return {
        tag: e.tagName,
        text: e.textContent,
        x: b.x,
        y: b.y,
        width: b.width,
        height: b.height,
        font: s.fontSize,
        line: s.lineHeight,
        weight: s.fontWeight,
        gap: s.gap,
        padding: s.padding,
        border: s.borderWidth,
        radius: s.borderRadius,
        outline: s.outline,
        outlineStyle: s.outlineStyle,
        boxShadow: s.boxShadow,
        wrap: s.flexWrap,
        marginLeft: s.marginLeft,
        marginRight: s.marginRight,
      };
    };
    const header = root.querySelector('[data-slot="sheet-header"]');
    const footer = root.querySelector('[data-slot="sheet-footer"]');
    return {
      root: metric(root),
      header: metric(header),
      footer: metric(footer),
      title: metric(header?.querySelector('[data-slot="sheet-title"]') ?? null),
      description: metric(header?.querySelector('[data-slot="sheet-description"]') ?? null),
      avatar: metric(header?.querySelector('[data-slot="avatar"]') ?? null),
      badge: metric(header?.querySelector('[data-slot="badge"]') ?? null),
      footerChildren: Array.from(footer?.children ?? []).map(metric),
      footerButtons: Array.from(footer?.querySelectorAll("button") ?? []).map(metric),
      copy: metric(header?.querySelector('button[aria-label="Copy email"]') ?? null),
      close: metric(root.querySelector('button[data-slot="sheet-close"]')),
      firstBodyField: metric(root.querySelector(".fs-drawer-body fieldset")),
    };
  });
  await writeFile(info.outputPath(`${name}.json`), JSON.stringify(measured, null, 2) + "\n");
  await dialog.page().screenshot({ path: info.outputPath(`${name}.png`), fullPage: false });
  return measured;
}

async function memberAccess(page: Page) {
  const trigger = page.getByRole("button", { name: "Open Hanna Berg actions", exact: true });
  await trigger.click();
  await page.getByRole("menuitem", { name: "Change access", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Hanna Berg", exact: true });
  await settledDialog(dialog);
  return { trigger, dialog };
}

for (const width of [1440, 390]) {
  test(`Flowly sheet ${width}: member identity, native surface focus, copied feedback and fixed actions preserve real callbacks`, async ({
    page,
    context,
  }, info) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await open(page, "Members", width);
    const { trigger, dialog } = await memberAccess(page);
    await expect(dialog).toBeFocused();
    expect(await dialog.evaluate((root) => getComputedStyle(root).outlineStyle)).toBe("none");
    const header = dialog.locator(".fs-drawer-header-member");
    await expect(header.getByRole("heading", { name: "Hanna Berg", exact: true })).toBeVisible();
    await expect(header.getByRole("img", { name: "Hanna Berg", exact: true })).toBeVisible();
    await expect(header.locator('[data-slot="badge"]')).toHaveCount(1);
    await expect(header.locator('[data-slot="badge"]')).toHaveText("Editor");
    await expect(dialog.locator('.fs-drawer-body > [data-slot="badge"]')).toHaveCount(0);
    const m = await sheetGeometry(dialog, info, "member-access-sheet");
    expect(m.header?.height).toBeCloseTo(116, 1);
    expect(m.header?.padding).toBe("14px 20px 12px");
    expect(m.avatar?.width).toBeCloseTo(36, 1);
    expect(m.avatar?.height).toBeCloseTo(36, 1);
    expect(m.title?.font).toBe("18px");
    expect(m.title?.line).toBe("28px");
    expect(m.description?.font).toBe("14px");
    expect(m.description?.line).toBe("20px");
    expect(m.badge?.height).toBeCloseTo(20, 1);
    expect(m.badge?.radius).toBe("6px");
    expect(m.badge?.font).toBe("12px");
    expect(m.badge?.weight).toBe("500");
    expect(m.firstBodyField?.y).toBeCloseTo(154, 1);
    expect(m.footer?.height).toBeCloseTo(width === 1440 ? 57 : 97, 1);
    expect(m.footer?.padding).toBe("12px 20px");
    expect(m.footer?.gap).toBe("8px");
    expect(m.footerChildren).toHaveLength(2);
    expect(m.footerChildren[1]?.tag).toBe("DIV");
    expect(m.footerChildren[1]?.wrap).toBe("nowrap");
    for (const b of m.footerButtons) expect(b?.height).toBeCloseTo(32, 1);
    expect(m.copy?.width).toBeCloseTo(32, 1);
    expect(m.close?.width).toBeCloseTo(32, 1);
    const copy = header.getByRole("button", { name: "Copy email", exact: true });
    await page.keyboard.press("Tab");
    await expect(copy).toBeFocused();
    await copy.press("Space");
    const copied = header.getByRole("button", { name: "email copied", exact: true });
    await expect(copied).toBeFocused();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("hanna@brick.test");
    await expect(page.locator("[data-sonner-toast]")).toHaveCount(0);
    await copied.press("Tab");
    await expect(header.getByRole("button", { name: "Close", exact: true })).toBeFocused();
    // Copy feedback stays inline: a normal footer Cancel must remain reachable.
    await expect(copied).toBeVisible();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog.getByRole("tab", { name: "Details", exact: true })).toBeVisible();
    const footer = dialog.locator(".fs-drawer-footer-member");
    await expect(footer.getByRole("button", { name: "Reset Session", exact: true })).toBeVisible();
    await expect(footer.getByRole("button", { name: "Change Access", exact: true })).toBeVisible();
    const details = await sheetGeometry(dialog, info, "member-details-sheet");
    expect(details.footer?.height).toBeCloseTo(57, 1);
    await dialog.getByRole("tab", { name: "Access", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Change Access", exact: true })).toHaveCount(1);
    await expect(dialog.getByRole("button", { name: "Reset Session", exact: true })).toHaveCount(0);
    const copyAgain = dialog
      .locator(".fs-drawer-header-member")
      .getByRole("button", { name: /^(Copy email|email copied)$/ });
    await copyAgain.click();
    await expect(
      dialog
        .locator(".fs-drawer-header-member")
        .getByRole("button", { name: "email copied", exact: true }),
    ).toBeVisible();
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test(`Flowly sheet ${width}: Invite header lines, direct footer wrapping and native Name focus retain dismiss and submit association`, async ({
    page,
  }, info) => {
    await open(page, "Members", width);
    const trigger = page.getByRole("button", { name: "Invite member", exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: "Invite Member", exact: true });
    await settledDialog(dialog);
    const name = dialog.getByRole("textbox", { name: "Name", exact: true });
    await expect(name).toBeFocused();
    const m = await sheetGeometry(dialog, info, "invite-header-footer");
    expect(m.header?.height).toBeCloseTo(width === 1440 ? 85 : 105, 1);
    expect(m.header?.padding).toBe("14px 20px");
    expect(m.title?.font).toBe("18px");
    expect(m.title?.line).toBe("28px");
    expect(m.description?.height).toBeCloseTo(width === 1440 ? 20 : 40, 1);
    expect(m.description?.text).toContain("Bricklane");
    expect(m.description?.text).toContain("no email");
    expect(m.firstBodyField?.y).toBeCloseTo(width === 1440 ? 122 : 142, 1);
    expect(m.footer?.height).toBeCloseTo(width === 1440 ? 57 : 97, 1);
    expect(m.footer?.padding).toBe("12px 20px");
    expect(m.footerChildren).toHaveLength(3);
    const [caption, cancel, send] = m.footerChildren;
    expect(caption?.tag).toBe("P");
    expect(caption?.font).toBe("12px");
    expect(caption?.line).toBe("16px");
    expect(cancel?.height).toBeCloseTo(32, 1);
    expect(send?.height).toBeCloseTo(32, 1);
    expect(send?.width).toBeCloseTo(118.5078125, 1);
    expect(caption!.y + caption!.height / 2 - (cancel!.y + cancel!.height / 2)).toBeCloseTo(0, 1);
    expect(send!.y - cancel!.y).toBeCloseTo(width === 1440 ? 0 : 40, 1);
    if (width === 390) expect(send!.x - caption!.x).toBeCloseTo(0, 1);
    expect(m.close?.width).toBeCloseTo(32, 1);
    await expect(dialog.getByRole("button", { name: "Send Invite", exact: true })).toHaveAttribute(
      "form",
      "flowly-invite-form",
    );
    await name.press("Shift+Tab");
    const close = dialog.getByRole("button", { name: "Close", exact: true });
    await expect(close).toBeFocused();
    await close.press("Tab");
    await expect(name).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}

for (const [section, action, title] of [
  ["Integrations", "Add Integration", "New Integration"],
  ["Webhooks", "Add Endpoint", "Add Endpoint"],
]) {
  test(`Flowly sheet default ${section}: creation drawer keeps existing native header, footer and focus restoration`, async ({
    page,
  }, info) => {
    await open(page, section, 1440);
    const trigger = page.getByRole("button", { name: action, exact: true });
    await trigger.click();
    const dialog = page.getByRole("dialog", { name: title, exact: true });
    await settledDialog(dialog);
    await expect(dialog).not.toHaveClass(/fs-drawer-(member|invite)/);
    await expect(dialog.locator('[data-slot="sheet-header"]')).not.toHaveClass(
      /fs-drawer-header-(member|invite)/,
    );
    await expect(dialog.locator(".fs-drawer-footer")).not.toHaveClass(
      /fs-drawer-footer-(member|invite)/,
    );
    const m = await sheetGeometry(dialog, info, `default-${section.toLowerCase()}`);
    expect(m.header?.padding).toBe("16px 20px 20px");
    expect(m.header?.gap).toBe("8px");
    expect(m.title?.font).toBe("16px");
    expect(m.description?.font).toBe("13px");
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
