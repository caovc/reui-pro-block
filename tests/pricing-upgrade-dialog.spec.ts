import { expect, test } from "@playwright/test";

const route = "./#/preview/marketing/pricing/pricing-7";
const observed = [
  {
    name: "Basic",
    id: "basic",
    monthly: "$18",
    yearly: "$15",
    annual: "$180",
    saving: "$36",
    count: 13,
    included: "2 agent seats",
    excluded: "Routing and assignment rules",
    action: "Start Trial",
  },
  {
    name: "Team",
    id: "team",
    monthly: "$54",
    yearly: "$45",
    annual: "$540",
    saving: "$108",
    count: 14,
    included: "10 agent seats",
    excluded: "SAML single sign-on",
    action: "Start Trial",
  },
  {
    name: "Enterprise",
    id: "enterprise",
    monthly: "$168",
    yearly: "$140",
    annual: "$1,680",
    saving: "$336",
    count: 11,
    included: "50 agent seats",
    excluded: null,
    action: "Contact Sales",
  },
];

async function expectNoBillingOverflow(dialog: import("@playwright/test").Locator) {
  const list = dialog.getByRole("tablist", { name: "Billing period", exact: true });
  const dimensions = await list.evaluate((el) => ({
    width: el.clientWidth,
    scrollWidth: el.scrollWidth,
    height: el.clientHeight,
    scrollHeight: el.scrollHeight,
    overflowX: getComputedStyle(el).overflowX,
    overflowY: getComputedStyle(el).overflowY,
    pseudoDisplay: [...el.querySelectorAll('[role="tab"]')].map(
      (tab) => getComputedStyle(tab, "::after").display,
    ),
  }));
  expect(dimensions.scrollWidth).toBe(dimensions.width);
  expect(dimensions.scrollHeight).toBe(dimensions.height);
  expect(dimensions.overflowX).toBe("visible");
  expect(dimensions.overflowY).toBe("visible");
  expect(dimensions.pseudoDisplay).toEqual(["none", "none"]);
}

// Dialog focus can precede native opening animation and outside-listener setup.
// Wait for the rendered opening contract before sending a raw outside pointer.
async function expectNativeOpeningReady(
  page: import("@playwright/test").Page,
  dialog: import("@playwright/test").Locator,
) {
  const overlay = page.locator('[data-slot="dialog-overlay"]');
  await expect(overlay).toBeVisible();
  await dialog.evaluate(async (content) => {
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    const animations = [
      ...content.getAnimations({ subtree: true }),
      ...(overlay?.getAnimations({ subtree: true }) ?? []),
    ];
    await Promise.all(animations.map((animation) => animation.finished.catch(() => {})));
  });
  await expect
    .poll(() =>
      overlay.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const hit = element.ownerDocument.elementFromPoint(5, 5);
        return (
          bounds.x === 0 &&
          bounds.y === 0 &&
          bounds.width === innerWidth &&
          bounds.height === innerHeight &&
          (hit === element || element.contains(hit))
        );
      }),
    )
    .toBe(true);
}

test("upgrade dialog opens on Team yearly and all six selections update the real rail, detail and bill", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(route);
  const dialog = page.getByRole("dialog", { name: "Choose Your Plan", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("radio", { name: "Team", exact: true })).toBeChecked();
  await expect(dialog.getByRole("tab", { name: /^Yearly/ })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  expect(await dialog.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Inter");
  await expect(dialog).toBeFocused();
  await page.evaluate(() => document.fonts.ready);
  await expectNoBillingOverflow(dialog);
  const initial = { x: 240, y: 236.5, width: 960, height: 627 };
  await expect.poll(() => dialog.boundingBox()).toEqual(initial);
  await page.screenshot({
    path: "/tmp/bricklane-pricing-upgrade/local-final-1440.png",
    fullPage: true,
  });
  const originalUrl = page.url();
  for (const billing of ["monthly", "yearly"] as const) {
    await dialog.getByRole("tab", { name: billing === "monthly" ? "Monthly" : /^Yearly/ }).click();
    for (const state of observed) {
      await dialog
        .locator('[data-slot="item"]')
        .filter({ hasText: new RegExp(`^${state.name}`) })
        .click();
      await expect(dialog.getByRole("radio", { name: state.name, exact: true })).toBeChecked();
      const panel = dialog.locator('.pud-plan-panel[data-active="true"]');
      await expect(panel).toHaveAttribute("data-plan", state.id);
      await expect(panel.locator("[data-upgrade-price]")).toHaveText(state[billing]);
      await expect(panel.locator(".pud-savings")).toHaveText(
        `Yearly billing saves ${state.saving} a year`,
      );
      await expect(panel.getByRole("listitem")).toHaveCount(state.count);
      await expect(panel.getByText(state.included, { exact: true })).toBeVisible();
      if (state.excluded)
        await expect(panel.getByRole("listitem").filter({ hasText: state.excluded })).toContainText(
          `Not included: ${state.excluded}`,
        );
      else await expect(panel.getByText("Not included:", { exact: false })).toHaveCount(0);
      const summary = dialog.locator(".pud-summary");
      await expect(summary).toContainText(state.name);
      await expect(summary).toContainText(
        `${billing === "yearly" ? state.annual : state.monthly} billed ${billing}`,
      );
      for (const railPlan of observed)
        await expect(
          dialog
            .locator('[data-slot="item"]')
            .filter({ hasText: new RegExp(`^${railPlan.name}`) })
            .locator(".pud-rail-price"),
        ).toContainText(railPlan[billing]);
      expect(await dialog.boundingBox()).toEqual(initial);
      const action = dialog.getByRole("link", {
        name: `${state.action} for ${state.name}`,
        exact: true,
      });
      await expect(action).toHaveAttribute("href", "#");
      await action.click();
      expect(page.url()).toBe(originalUrl);
      await expect(dialog).toBeVisible();
      await expect(panel.locator("[data-upgrade-price]")).toHaveText(state[billing]);
      await expect(page.getByRole("dialog")).toHaveCount(1);
      await expect(page.getByText(/all set|upgraded successfully|payment processed/i)).toHaveCount(
        0,
      );
    }
  }
  expect(errors).toEqual([]);
});

test("native dialog dismisses and restores focus, reopens with state, and keeps keyboard focus contained", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.goto(route);
  const dialog = page.getByRole("dialog", { name: "Choose Your Plan", exact: true });
  const trigger = page.getByRole("button", { name: "View Plans", exact: true });
  await dialog.getByRole("tab", { name: "Monthly", exact: true }).click();
  await dialog
    .locator('[data-slot="item"]')
    .filter({ hasText: /^Enterprise/ })
    .click();
  await dialog.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  const empty = page.locator('.pud-entry [data-slot="empty"]');
  await expect(empty).toContainText("Upgrade Your Plan");
  expect(await empty.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Inter");
  await page.screenshot({
    path: "/tmp/bricklane-pricing-upgrade/local-final-closed.png",
    fullPage: true,
  });
  await trigger.click();
  await expect(dialog.getByRole("radio", { name: "Enterprise", exact: true })).toBeChecked();
  await expect(dialog.getByRole("tab", { name: "Monthly", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(dialog).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeFocused();
  await expectNativeOpeningReady(page, dialog);
  await page.mouse.click(5, 5);
  await expect(dialog).toHaveCount(0);
  await trigger.click();
  const team = dialog.getByRole("radio", { name: "Team", exact: true });
  await team.focus();
  await page.keyboard.down("ArrowDown");
  await expect(dialog.getByRole("radio", { name: "Enterprise", exact: true })).toBeChecked();
  await expect(dialog.getByRole("radio", { name: "Enterprise", exact: true })).toBeFocused();
  await page.keyboard.up("ArrowDown");
  await expect(
    dialog.locator('.pud-plan-panel[data-active="true"] [data-upgrade-price]'),
  ).toHaveText("$168");
  await page.keyboard.down("ArrowUp");
  await expect(team).toBeChecked();
  await expect(team).toBeFocused();
  await page.keyboard.up("ArrowUp");
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  }
  await expect(dialog.locator('.pud-plan-panel[data-active="false"]')).toHaveCount(2);
  for (const panel of await dialog.locator('.pud-plan-panel[data-active="false"]').all()) {
    await expect(panel).toHaveAttribute("inert", "");
    await expect(panel).toHaveAttribute("aria-hidden", "true");
  }
});

test("390px uses a scrolling native viewport while the header/footer stay fixed and every plan remains reachable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const dialog = page.getByRole("dialog", { name: "Choose Your Plan", exact: true });
  await page.evaluate(() => document.fonts.ready);
  await expectNoBillingOverflow(dialog);
  await expect.poll(() => dialog.boundingBox()).toEqual({ x: 16, y: 70, width: 358, height: 704 });
  const footer = dialog.locator('[data-slot="dialog-footer"]');
  const footerRect = await footer.boundingBox();
  await page.screenshot({
    path: "/tmp/bricklane-pricing-upgrade/local-final-390.png",
    fullPage: true,
  });
  const viewport = dialog.locator('.pud-outer-scroll > [data-slot="scroll-area-viewport"]');
  await viewport.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect.poll(() => viewport.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await expect(dialog.locator(".pud-outer-scroll")).toHaveAttribute("data-scroll-end", "true");
  const lastFeature = dialog
    .locator('.pud-plan-panel[data-active="true"]')
    .getByRole("listitem")
    .last();
  await expect(lastFeature).toContainText("Dedicated success manager");
  const lastRect = await lastFeature.boundingBox();
  expect(lastRect!.y + lastRect!.height).toBeLessThanOrEqual(footerRect!.y);
  expect(await footer.boundingBox()).toEqual(footerRect);
  await page.screenshot({
    path: "/tmp/bricklane-pricing-upgrade/local-final-390-scrolled.png",
    fullPage: true,
  });
  for (const billing of ["monthly", "yearly"] as const) {
    await dialog.getByRole("tab", { name: billing === "monthly" ? "Monthly" : /^Yearly/ }).click();
    for (const state of observed) {
      await dialog
        .locator('[data-slot="item"]')
        .filter({ hasText: new RegExp(`^${state.name}`) })
        .click();
      await expect(
        dialog.locator('.pud-plan-panel[data-active="true"] [data-upgrade-price]'),
      ).toHaveText(state[billing]);
      await expect(footer).toContainText(
        `${billing === "yearly" ? state.annual : state.monthly} billed ${billing}`,
      );
      expect(await dialog.boundingBox()).toEqual({ x: 16, y: 70, width: 358, height: 704 });
      expect(await footer.boundingBox()).toEqual(footerRect);
    }
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
