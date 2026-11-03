import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const policyTitles = [
  "Enforce two-factor authentication",
  "Session timeout",
  "Single active session",
  "Password authentication",
  "Magic link login",
  "SAML single sign-on",
  "Member invitations",
  "Service creation",
  "Custom roles",
  "Audit log access",
];
const frameTitles = ["Session Policy", "Login Methods", "Access Restrictions"];

async function navigate(page: Page, name: "Security" | "Integrations", mobile: boolean) {
  if (mobile) await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await page.getByRole("button", { name, exact: true }).click();
  if (mobile) await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("heading", { name, exact: true, level: 1 })).toBeVisible();
}

function present<T>(value: T | null): T {
  expect(value).not.toBeNull();
  if (value === null) throw new Error("Required native Item or Frame slot is absent");
  return value;
}

async function recordAndCheck(page: Page, region: Locator, mobile: boolean, info: TestInfo) {
  await expect(region.locator('[data-slot="item"]')).toHaveCount(10);
  await expect(region.locator('[data-slot="frame"]')).toHaveCount(3);
  await expect(region.locator('[data-slot="separator"]')).toHaveCount(7);
  await expect(region.locator('[data-slot="field"]')).toHaveCount(0);
  await expect(region.locator("label")).toHaveCount(0);
  await expect(region.locator('[data-slot="item-title"]')).toHaveText(policyTitles);
  await expect(region.locator('[data-slot="frame-panel-title"]')).toHaveText(frameTitles);
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return { status: document.fonts.status, family: getComputedStyle(document.body).fontFamily };
  });
  const evidence = await region.evaluate((root) => {
    const snapshot = (element: Element | null) => {
      if (!element) return null;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName,
        slot: element.getAttribute("data-slot"),
        text: element.textContent?.trim() ?? "",
        display: style.display,
        flexWrap: style.flexWrap,
        gap: Number.parseFloat(style.gap),
        fontFamily: style.fontFamily,
        fontSize: Number.parseFloat(style.fontSize),
        fontWeight: Number.parseFloat(style.fontWeight),
        lineHeight: Number.parseFloat(style.lineHeight),
        padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(
          Number.parseFloat,
        ),
        margin: style.margin,
        radius: Number.parseFloat(style.borderRadius),
        borderWidth: Number.parseFloat(style.borderTopWidth),
        borderColor: style.borderTopColor,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom,
        },
      };
    };
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      region: snapshot(root),
      rows: [...root.querySelectorAll('[data-slot="item"]')].map((row) => ({
        row: snapshot(row),
        content: snapshot(row.querySelector('[data-slot="item-content"]')),
        title: snapshot(row.querySelector('[data-slot="item-title"]')),
        description: snapshot(row.querySelector('[data-slot="item-description"]')),
        actions: snapshot(row.querySelector('[data-slot="item-actions"]')),
      })),
      frames: [...root.querySelectorAll('[data-slot="frame"]')].map((frame) => ({
        frame: snapshot(frame),
        header: snapshot(frame.querySelector('[data-slot="frame-panel-header"]')),
        title: snapshot(frame.querySelector('[data-slot="frame-panel-title"]')),
        description: snapshot(frame.querySelector('[data-slot="frame-panel-description"]')),
        panel: snapshot(frame.querySelector('[data-slot="frame-panel"]')),
      })),
      timeout: snapshot(root.querySelector('[data-slot="select-trigger"]')),
      switches: [...root.querySelectorAll('[role="switch"]')].map(snapshot),
    };
  });
  await writeFile(
    info.outputPath("security-actual-styles.json"),
    JSON.stringify({ fonts, ...evidence }, null, 2) + "\n",
  );
  await page.screenshot({ path: info.outputPath("security-native.png"), fullPage: true });
  expect(fonts.status).toBe("loaded");
  expect(evidence.documentWidth).toBeLessThanOrEqual(evidence.viewport.width);
  for (const item of evidence.rows) {
    const row = present(item.row);
    const content = present(item.content);
    const title = present(item.title);
    const description = present(item.description);
    const actions = present(item.actions);
    expect(row.display).toBe("flex");
    expect(row.flexWrap).toBe("wrap");
    expect(row.gap).toBe(10);
    expect(row.padding).toEqual([10, 16, 10, 16]);
    expect(row.borderWidth).toBe(1);
    expect(row.borderColor).toBe("rgba(0, 0, 0, 0)");
    expect(row.radius).toBeCloseTo(10, 1);
    expect(content.gap).toBe(4);
    expect(actions.gap).toBe(8);
    expect([title.fontSize, title.lineHeight, title.fontWeight]).toEqual([14, 19.25, 500]);
    expect([description.fontSize, description.lineHeight, description.fontWeight]).toEqual([
      14, 21, 400,
    ]);
    expect(description.margin).toBe("0px");
    for (const box of [row, content, title, description, actions]) {
      expect(box.rect.width).toBeGreaterThan(0);
      expect(box.rect.height).toBeGreaterThan(0);
    }
    expect(content.rect.right).toBeLessThanOrEqual(actions.rect.x - 9);
    expect(actions.rect.right).toBeLessThanOrEqual(row.rect.right);
    expect(description.rect.y).toBeGreaterThanOrEqual(title.rect.bottom + 3);
  }
  for (const item of evidence.frames) {
    const frame = present(item.frame);
    const header = present(item.header);
    const title = present(item.title);
    const description = present(item.description);
    const panel = present(item.panel);
    expect(frame.radius).toBeCloseTo(14, 1);
    expect(frame.margin).toBe("0px 0px 20px");
    expect(header.padding).toEqual([8, 16, 8, 16]);
    expect(header.gap).toBe(0);
    expect([title.fontSize, title.lineHeight, title.fontWeight]).toEqual([14, 20, 600]);
    expect([description.fontSize, description.lineHeight, description.fontWeight]).toEqual([
      14, 20, 400,
    ]);
    expect(panel.padding).toEqual([0, 0, 0, 0]);
  }
  const timeout = present(evidence.timeout);
  expect(Math.abs(timeout.rect.width - 160)).toBeLessThanOrEqual(1);
  expect(Math.abs(timeout.rect.height - 32)).toBeLessThanOrEqual(1);
  expect(evidence.switches).toHaveLength(4);
  for (const value of evidence.switches) {
    const control = present(value);
    expect(Math.abs(control.rect.width - 32)).toBeLessThanOrEqual(0.1);
    expect(Math.abs(control.rect.height - 18.3984)).toBeLessThanOrEqual(0.1);
  }
  const timeoutDescription = present(evidence.rows[1].description);
  if (mobile) {
    expect(timeoutDescription.rect.height).toBeGreaterThan(timeoutDescription.lineHeight);
    expect(
      Math.abs(timeoutDescription.rect.height - 2 * timeoutDescription.lineHeight),
    ).toBeLessThanOrEqual(1);
  } else {
    expect(
      Math.abs(timeoutDescription.rect.height - timeoutDescription.lineHeight),
    ).toBeLessThanOrEqual(1);
  }
}

for (const width of [1440, 390]) {
  test(`Lucent Security Item native ${width}: measured free composition, keyboard focus and retained local state`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        faults.push(`${message.type()}: ${message.text()}`);
    });
    const mobile = width === 390;
    await page.setViewportSize({ width, height: mobile ? 844 : 1000 });
    await page.goto("./#/template-preview/lucent");
    await navigate(page, "Security", mobile);
    const region = page
      .locator(".wf-lucent-settings")
      .filter({ has: page.getByRole("heading", { name: "Security", exact: true, level: 1 }) });
    await expect(region).toHaveCount(1);
    await recordAndCheck(page, region, mobile, info);

    const twoFactor = region.getByRole("switch", {
      name: "Enforce two-factor authentication",
      exact: true,
    });
    await expect(twoFactor).not.toBeChecked();
    await expect(
      region.getByRole("switch", { name: "Password authentication", exact: true }),
    ).toBeChecked();
    await expect(
      region.getByRole("switch", { name: "Magic link login", exact: true }),
    ).toBeChecked();
    await expect(
      region.getByRole("switch", { name: "Single active session", exact: true }),
    ).not.toBeChecked();
    await twoFactor.click();
    await expect(twoFactor).toBeFocused();
    await expect(twoFactor).toBeChecked();
    await page.keyboard.press("Space");
    await expect(twoFactor).not.toBeChecked();
    await page.keyboard.press("Space");
    await expect(twoFactor).toBeChecked();

    const timeout = region.getByRole("combobox", { name: "Session timeout", exact: true });
    await expect(timeout).toHaveText("4 hours");
    await timeout.click();
    const listbox = page.getByRole("listbox");
    await expect(listbox).toBeVisible();
    // This proposal deliberately preserves the local four-item menu; official five-item parity remains a separate gap.
    await expect(listbox.getByRole("option")).toHaveText([
      "1 hour",
      "4 hours",
      "8 hours",
      "24 hours",
    ]);
    await expect(listbox.getByRole("option", { name: "4 hours", exact: true })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(listbox.getByRole("option", { name: "1 hour", exact: true })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(listbox.getByRole("option", { name: "4 hours", exact: true })).toBeFocused();
    await page.keyboard.press("End");
    await expect(listbox.getByRole("option", { name: "24 hours", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(timeout).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(timeout).toBeFocused();
    await expect(timeout).toHaveText("4 hours");
    await timeout.press("Enter");
    await expect(listbox).toBeVisible();
    await page.keyboard.press("End");
    await expect(listbox.getByRole("option", { name: "24 hours", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(timeout).toHaveText("24 hours");
    await expect(timeout).toBeFocused();
    await navigate(page, "Integrations", mobile);
    await navigate(page, "Security", mobile);
    await expect(
      region.getByRole("switch", { name: "Enforce two-factor authentication", exact: true }),
    ).toBeChecked();
    await expect(region.getByRole("combobox", { name: "Session timeout", exact: true })).toHaveText(
      "24 hours",
    );
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect(faults).toEqual([]);
  });
}
