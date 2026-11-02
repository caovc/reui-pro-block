// Private four-case presentation candidate. Not run or discovered here.
// Preserve native 30s/5s, W1R0 and the existing Profile file lifecycle oracle.
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

type Merchant = "surge" | "manifest";
const merchants = ["surge", "manifest"] as const;
const widths = [1440, 390] as const;
const query = "?qa=account-profile&raw=a%20b&raw=a+b";
const portrait = "src/blocks/application/shells/assets/portrait-0.jpg";

const account = (page: Page) => page.locator(".commerce-account-settings");
const profile = (page: Page) =>
  account(page).getByRole("region", { name: "Profile details", exact: true });
const save = (page: Page) =>
  profile(page).getByRole("button", { name: "Save changes", exact: true });
const cancel = (page: Page) => profile(page).getByRole("button", { name: "Cancel", exact: true });
const avatar = (page: Page) => profile(page).getByRole("img", { name: "Avatar", exact: true });

async function open(page: Page, id: Merchant, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(`/#/template-preview/${id}/account/profile${query}`);
  if (id === "manifest") {
    const auth = page.locator(".bt-auth");
    await expect(auth).toBeVisible();
    await auth.getByRole("button", { name: "Log in", exact: true }).click();
    await expect(auth).toBeHidden();
  }
  await expect(profile(page)).toBeVisible();
  await expect(account(page).getByRole("tab", { name: "Profile", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page).toHaveURL(
    new RegExp(
      `#/template-preview/${id}/account/profile\\?qa=account-profile&raw=a%20b&raw=a\\+b$`,
    ),
  );
  await expect(save(page)).toBeDisabled();
}

async function leaveAndReturn(page: Page) {
  await account(page).getByRole("tab", { name: "Preferences", exact: true }).click();
  await expect(
    account(page).getByRole("tab", { name: "Preferences", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await account(page).getByRole("tab", { name: "Profile", exact: true }).click();
  await expect(profile(page)).toBeVisible();
}

async function saved(page: Page) {
  await expect(save(page)).toBeEnabled();
  await save(page).click();
  await expect(save(page)).toBeDisabled();
  await expect(profile(page).locator(".aas-save-status")).toHaveText(
    "Profile saved in this preview.",
  );
}

async function identityButton(page: Page, width: number, name: string) {
  if (width === 390) {
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
    await expect(page.locator(".bt-layout-mobile")).toBeVisible();
  }
  const navigation =
    width === 390
      ? page.locator(".bt-layout-mobile")
      : page.locator('.bt-sidebar[data-slot="sidebar-container"]');
  const button = navigation.getByRole("button", {
    name: `Open account menu for ${name}`,
    exact: true,
  });
  await expect(button).toBeVisible();
  return button;
}

async function closePhoneNavigation(page: Page, width: number) {
  if (width !== 390) return;
  await page.keyboard.press("Escape");
  await expect(page.locator(".bt-layout-mobile")).toBeHidden();
  await expect(page.getByRole("button", { name: "Open menu", exact: true })).toBeFocused();
}

async function changePortrait(page: Page) {
  const input = profile(page).getByLabel("Profile photo", { exact: true });
  await expect(input).toHaveAttribute("type", "file");
  await expect(input).toHaveAttribute("accept", "image/*");
  const pending = page.waitForEvent("filechooser");
  await profile(page).getByRole("button", { name: "Change", exact: true }).click();
  const chooser = await pending;
  expect(chooser.isMultiple()).toBe(false);
  await chooser.setFiles(resolve(process.cwd(), portrait));
  await expect(avatar(page)).toHaveAttribute("src", /^blob:/);
  await expect(save(page)).toBeEnabled();
}

async function presentation(page: Page, info: TestInfo, phase: string) {
  const upload = profile(page).locator(".commerce-account-avatar");
  const remove = upload.getByRole("button", { name: "Remove", exact: true });
  await expect(upload).toHaveCount(1);
  await expect(remove).toBeVisible();
  await expect(remove).toHaveAccessibleName("Remove");
  // Natural pointer movement removes hover; focus remains under actual native actions.
  await page.mouse.move(0, 0);
  const frame = await avatar(page).evaluate((image: HTMLImageElement) => {
    const element = image.parentElement!;
    const box = element.getBoundingClientRect();
    const css = getComputedStyle(element);
    const radii = [
      css.borderTopLeftRadius,
      css.borderTopRightRadius,
      css.borderBottomRightRadius,
      css.borderBottomLeftRadius,
    ];
    const minimum = Math.min(box.width, box.height);
    return {
      bounds: { x: box.x, y: box.y, width: box.width, height: box.height },
      className: element.className,
      borderRadii: radii,
      resolvedCornerAxes: radii.map((radius) =>
        radius
          .split(/\s+/)
          .map((axis) =>
            axis.endsWith("%") ? (parseFloat(axis) * minimum) / 100 : parseFloat(axis),
          ),
      ),
      overflowX: css.overflowX,
      overflowY: css.overflowY,
    };
  });
  const outline = await remove.evaluate((element: HTMLButtonElement) => {
    const box = element.getBoundingClientRect();
    const css = getComputedStyle(element);
    return {
      bounds: { x: box.x, y: box.y, width: box.width, height: box.height },
      hovered: element.matches(":hover"),
      focused: document.activeElement === element,
      opacity: css.opacity,
      backgroundColor: css.backgroundColor,
      borders: [
        { width: css.borderTopWidth, style: css.borderTopStyle, color: css.borderTopColor },
        { width: css.borderRightWidth, style: css.borderRightStyle, color: css.borderRightColor },
        {
          width: css.borderBottomWidth,
          style: css.borderBottomStyle,
          color: css.borderBottomColor,
        },
        { width: css.borderLeftWidth, style: css.borderLeftStyle, color: css.borderLeftColor },
      ],
    };
  });
  const x = remove.locator("svg.lucide-x");
  const xCount = await x.count();
  const xBounds = xCount === 1 ? await x.boundingBox() : null;
  // Retain actual geometry/styles and screenshot before asserting any target values.
  await info.attach(`avatar-presentation-${phase}`, {
    body: JSON.stringify(
      { viewport: page.viewportSize(), frame, outline, xCount, xBounds },
      null,
      2,
    ),
    contentType: "application/json",
  });
  await profile(page)
    .locator(".aas-photo-row")
    .screenshot({
      path: info.outputPath(`avatar-presentation-${phase}.png`),
    });
  expect(frame.bounds.width).toBeGreaterThan(0);
  expect(frame.bounds.height).toBeGreaterThan(0);
  expect(Math.abs(frame.bounds.width - frame.bounds.height)).toBeLessThanOrEqual(1);
  const half = Math.min(frame.bounds.width, frame.bounds.height) / 2;
  for (const axes of frame.resolvedCornerAxes) {
    for (const radius of axes) expect(radius).toBeGreaterThanOrEqual(half);
  }
  expect(outline.hovered).toBe(false);
  expect(outline.focused).toBe(false);
  expect(parseFloat(outline.opacity)).toBeGreaterThan(0);
  for (const border of outline.borders) {
    expect(parseFloat(border.width)).toBeGreaterThan(0);
    expect(["none", "hidden"]).not.toContain(border.style);
    expect(border.color).not.toBe("transparent");
    expect(border.color).not.toMatch(/^rgba\([^)]*,\s*0(?:\.0+)?\s*\)$/);
    expect(border.color).not.toMatch(/\/\s*0(?:\.0+)?%?\s*\)$/);
  }
  await expect(x).toHaveCount(1);
  await expect(x).toBeVisible();
  await expect(x).toHaveAttribute("aria-hidden", "true");
  expect(xBounds).not.toBeNull();
  expect(xBounds!.width).toBeGreaterThan(0);
  expect(xBounds!.height).toBeGreaterThan(0);
}

for (const id of merchants) {
  for (const width of widths) {
    test(`${id} Commerce avatar remains circular with native outlined Remove/X and file lifecycle ${width}`, async ({
      page,
    }, info) => {
      await open(page, id, width);
      await presentation(page, info, "initial");
      const original = await avatar(page).getAttribute("src");
      expect(original).toBeTruthy();
      await changePortrait(page);
      await cancel(page).click();
      await expect(avatar(page)).toHaveAttribute("src", original!);
      await expect(save(page)).toBeDisabled();
      await changePortrait(page);
      await saved(page);
      const expected = `data:image/jpeg;base64,${(await readFile(resolve(process.cwd(), portrait))).toString("base64")}`;
      await expect(avatar(page)).toHaveAttribute("src", expected);
      await expect
        .poll(() => avatar(page).evaluate((image: HTMLImageElement) => image.naturalWidth))
        .toBeGreaterThan(0);
      const button = await identityButton(page, width, "Nora Bell");
      await expect(button.locator("img")).toHaveAttribute("src", expected);
      await closePhoneNavigation(page, width);
      await leaveAndReturn(page);
      await expect(avatar(page)).toHaveAttribute("src", expected);
      await profile(page).getByRole("button", { name: "Remove", exact: true }).click();
      await expect(avatar(page)).toHaveCount(0);
      await cancel(page).click();
      await expect(avatar(page)).toHaveAttribute("src", expected);
      await presentation(page, info, "saved-after-remove-cancel");
    });
  }
}
