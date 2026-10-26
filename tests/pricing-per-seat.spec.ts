import { expect, test } from "@playwright/test";

const route = "./#/preview/marketing/pricing/pricing-3";
const observed = [
  {
    tab: "Solo",
    seats: "1 seat",
    pro: "$28",
    ultimate: "$48",
    proRate: "$28",
    ultimateRate: "$48",
    proList: null,
    ultimateList: null,
  },
  {
    tab: "Startup",
    seats: "5 seats",
    pro: "$130",
    ultimate: "$225",
    proRate: "$26",
    ultimateRate: "$45",
    proList: "$140",
    ultimateList: "$240",
  },
  {
    tab: "Growth",
    seats: "15 seats",
    pro: "$360",
    ultimate: "$630",
    proRate: "$24",
    ultimateRate: "$42",
    proList: "$420",
    ultimateList: "$720",
  },
  {
    tab: "Enterprise",
    seats: "40 seats",
    pro: "$880",
    ultimate: "$1,560",
    proRate: "$22",
    ultimateRate: "$39",
    proList: "$1,120",
    ultimateList: "$1,920",
  },
];

test("team-size tabs reprice actual plans, list prices, seats and teammate entitlements", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  await page.goto(route);
  const root = page.locator('[data-pricing-variant="3"]');
  const table = root.getByRole("table", { name: "Compare pricing plans" });
  await expect(table.locator("tbody tr")).toHaveCount(13);
  await expect(root.getByRole("tab", { name: "Startup", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  for (const state of observed) {
    await root.getByRole("tab", { name: state.tab, exact: true }).click();
    for (const plan of ["pro", "ultimate"] as const) {
      const price = table.locator(`[data-plan-price="${plan}"]`);
      await expect(price.locator(".psp-price-number")).toHaveText(state[plan]);
      await expect(price.locator(".psp-price-note")).toHaveText(
        `${state[`${plan}Rate`]} a seat, billed yearly`,
      );
      const listPrice = state[`${plan}List`];
      if (listPrice) await expect(price.locator("s")).toHaveText(listPrice);
      else await expect(price.locator("s")).toHaveCount(0);
    }
    const seatCells = table.getByRole("row", { name: /^Analyst seats/ }).locator("td");
    await expect(seatCells).toHaveText(["1 seat", state.seats, state.seats]);
    for (const label of ["Shared workspaces", "Seat management"]) {
      const cells = table.getByRole("row", { name: new RegExp(`^${label}`) }).locator("td");
      await expect(cells).toHaveText([
        "Not included",
        state.tab === "Solo" ? "Not included" : "Included",
        state.tab === "Solo" ? "Not included" : "Included",
      ]);
    }
    await expect(
      root.getByRole("button", { name: "Included in your package", exact: true }),
    ).toBeDisabled();
    await expect(root.getByRole("button", { name: "Current Package", exact: true })).toBeDisabled();
  }
  await root.getByRole("tab", { name: "Startup", exact: true }).click();
  await page.keyboard.press("ArrowRight");
  await expect(root.getByRole("tab", { name: "Growth", exact: true })).toBeFocused();
  await expect(root.getByRole("tab", { name: "Growth", exact: true })).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(table.locator('[data-plan-price="pro"] .psp-price-number')).toHaveText("$360");
  await page.keyboard.press("Enter");
  await expect(table.locator('[data-plan-price="pro"] .psp-price-number')).toHaveText("$360");
});

test("feature help uses real tooltips and every placeholder preserves the preview route", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1100 });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(route);
  const root = page.locator('[data-pricing-variant="3"]');
  const originalUrl = page.url();
  await root.getByRole("button", { name: "About Analyst seats", exact: true }).hover();
  const tooltip = page.locator('[data-slot="tooltip-content"]:not([data-state="closed"])');
  await expect(tooltip).toHaveText(/Viewers who only read shared dashboards never take a seat\./);
  expect(await tooltip.evaluate((el) => getComputedStyle(el).fontFamily)).toContain("Inter");
  await page.keyboard.press("Escape");
  await root.getByRole("button", { name: "About Shared workspaces", exact: true }).focus();
  await expect(tooltip).toHaveText(/Needs two or more seats\. Everyone edits the same boards\./);
  await page.keyboard.press("Escape");
  const links = root.locator("a:visible");
  expect(await links.count()).toBe(10);
  for (let i = 0; i < (await links.count()); i++) {
    await page.evaluate(() => scrollTo(0, 700));
    await links.nth(i).click();
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
    expect(page.url()).toBe(originalUrl);
    await expect(page.getByRole("dialog")).toHaveCount(0);
  }
  const avatar = root.getByRole("img", { name: "Nora Vale", exact: true });
  await expect(avatar).toHaveAttribute("src", /^data:image\/svg\+xml,/);
  expect(await avatar.evaluate((el) => (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
  await page.mouse.click(1, 1);
  await page.screenshot({ path: "/tmp/bricklane-pricing-per-seat/local-1280.png", fullPage: true });
});

test("mobile plan cards keep all rates, owned states and features consistent with team size", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(route);
  const root = page.locator('[data-pricing-variant="3"]');
  const cards = root.locator(".psp-mobile-card");
  await expect(cards).toHaveCount(3);
  for (const state of observed) {
    await root.getByRole("tab", { name: state.tab, exact: true }).click();
    await expect(cards.nth(0).locator(".psp-price-number")).toHaveText("$0");
    for (const [index, plan] of [
      [1, "pro"],
      [2, "ultimate"],
    ] as const) {
      const card = cards.nth(index);
      await expect(card.locator(".psp-price-number")).toHaveText(state[plan]);
      await expect(card.locator(".psp-price-note")).toHaveText(
        `${state[`${plan}Rate`]} a seat, billed yearly`,
      );
      await expect(card.locator("li").first()).toContainText(state.seats);
      await expect(card.getByRole("button")).toBeDisabled();
      await expect(card.getByRole("listitem")).toHaveCount(13);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await root.getByRole("tab", { name: "Startup", exact: true }).click();
  await page.mouse.click(1, 1);
  await page.screenshot({ path: "/tmp/bricklane-pricing-per-seat/local-390.png", fullPage: true });
  await cards.first().getByRole("link", { name: "Data retention, policy", exact: true }).click();
  expect(page.url()).toContain("#/preview/marketing/pricing/pricing-3");
  expect(await page.evaluate(() => scrollY)).toBe(0);
});
