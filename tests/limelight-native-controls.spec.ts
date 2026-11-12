import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";

type Primitive = "radix" | "base";
const nonNovaStyles = ["vega", "maia", "lyra", "mira", "luma", "sera", "rhea"] as const;
type Style = "nova" | (typeof nonNovaStyles)[number];

const cues = [
  "Wire in the stack",
  "Let the model assemble",
  "Shape it to the team",
  "Promote to production",
] as const;

test.use({ actionTimeout: 5000 });
test.describe.configure({ retries: 0 });

function entryUrl(baseURL: string | undefined, primitive: Primitive) {
  if (!baseURL) throw new Error("Limelight controls require the configured production baseURL");
  const root = new URL("./", baseURL);
  if (root.pathname.endsWith("/base/")) root.pathname = root.pathname.slice(0, -"base/".length);
  return new URL(primitive === "base" ? "base/" : "./", root);
}

async function open(
  page: Page,
  baseURL: string | undefined,
  primitive: Primitive,
  style: Style = "nova",
) {
  const issues: string[] = [];
  page.on("pageerror", (error) => issues.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) issues.push(message.text());
  });
  const preset = new URLSearchParams({
    preset: JSON.stringify({ primitive, style, mode: "light" }),
  });
  const url = new URL(`#/template-preview/limelight?${preset}`, entryUrl(baseURL, primitive));
  await page.goto(url.href);
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
  await expect(page.locator(".ct-limelight")).toBeVisible();
  return issues;
}

function choice(group: Locator, primitive: Primitive, name: string) {
  // Real upstream single-choice contracts: Radix radio, Base Toggle button.
  return group.getByRole(primitive === "radix" ? "radio" : "button", { name, exact: true });
}

async function selected(item: Locator, primitive: Primitive) {
  await expect(item).toHaveAttribute(
    primitive === "radix" ? "aria-checked" : "aria-pressed",
    "true",
  );
  await expect(item).toHaveAttribute(
    primitive === "radix" ? "data-state" : "data-pressed",
    primitive === "radix" ? "on" : "",
  );
}

async function prices(page: Page, values: readonly string[], interval: "month" | "year") {
  const cards = page.locator(".ct-lime-rates article");
  await expect(cards).toHaveCount(3);
  for (const [index, value] of values.entries()) {
    await expect(cards.nth(index).locator("strong")).toHaveText(`$${value}/${interval}`);
  }
}

async function evidence(page: Page, info: TestInfo, name: string, details: object = {}) {
  await page.screenshot({ path: info.outputPath(`${name}.png`) });
  const controls = await page.locator(".ct-limelight").evaluate((root) =>
    [...root.querySelectorAll("[data-slot=toggle-group-item], [data-slot=tabs-trigger]")].map(
      (node) => {
        const rect = node.getBoundingClientRect();
        const css = getComputedStyle(node);
        return {
          text: node.getAttribute("aria-label") || node.textContent?.trim(),
          role: node.getAttribute("role"),
          checked: node.getAttribute("aria-checked"),
          pressed: node.getAttribute("aria-pressed"),
          selected: node.getAttribute("aria-selected"),
          state: node.getAttribute("data-state"),
          nativePressed: node.hasAttribute("data-pressed"),
          bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
          computed: {
            font: css.fontFamily,
            fontSize: css.fontSize,
            lineHeight: css.lineHeight,
            letterSpacing: css.letterSpacing,
            textTransform: css.textTransform,
            radius: css.borderTopLeftRadius,
            padding: css.padding,
          },
        };
      },
    ),
  );
  await info.attach(name, {
    body: JSON.stringify(
      { url: page.url(), viewport: page.viewportSize(), controls, ...details },
      null,
      2,
    ),
    contentType: "application/json",
  });
}

for (const primitive of ["radix", "base"] as const) {
  for (const width of [1440, 390]) {
    test.describe(`${primitive} ${width}px`, () => {
      test.use({ viewport: { width, height: width === 390 ? 844 : 1000 } });

      test("Limelight native period and billing groups preserve required selections and values", async ({
        page,
        baseURL,
      }, info) => {
        const issues = await open(page, baseURL, primitive);
        const console = page.locator("#lime-home .ct-console");
        const period = console.getByRole(primitive === "radix" ? "radiogroup" : "group", {
          name: "Console period",
          exact: true,
        });
        const week = choice(period, primitive, "Week");
        const month = choice(period, primitive, "Month");
        const year = choice(period, primitive, "Year");
        await selected(week, primitive);
        await week.click();
        await selected(week, primitive);
        await week.press("ArrowRight");
        await expect(month).toBeFocused();
        await month.press("Space");
        await selected(month, primitive);
        await expect(console.locator(".ct-console-stats strong")).toContainText([
          "251,580",
          "41",
          "221ms",
          "0.11%",
        ]);
        await year.click();
        await year.click();
        await selected(year, primitive);
        await expect(console.locator(".ct-console-stats strong")).toContainText([
          "2,852,270",
          "44",
          "236ms",
          "0.19%",
        ]);
        await evidence(page, info, "native-period-year");

        const billing = page.getByRole(primitive === "radix" ? "radiogroup" : "group", {
          name: "Billing period",
          exact: true,
        });
        const monthly = choice(billing, primitive, "Monthly");
        const yearly = choice(billing, primitive, "Yearly");
        await selected(monthly, primitive);
        await prices(page, ["29", "99", "299"], "month");
        await yearly.click();
        await yearly.click();
        await selected(yearly, primitive);
        await prices(page, ["290", "990", "2,990"], "year");
        await expect(page.locator(".ct-lime-price-note")).toContainText(
          "Ten months on the invoice",
        );
        await yearly.press("ArrowLeft");
        await expect(monthly).toBeFocused();
        await monthly.press("Space");
        await selected(monthly, primitive);
        await prices(page, ["29", "99", "299"], "month");
        await selected(year, primitive);
        await evidence(page, info, "native-billing-monthly");
        expect(issues).toEqual([]);
      });

      test("Limelight native tour panels and landing control states remain independent", async ({
        page,
        baseURL,
      }, info) => {
        const issues = await open(page, baseURL, primitive);
        const tour = page.locator(".ct-lime-tour[data-slot=tabs]");
        const list = tour.getByRole("tablist", { name: "Production tour", exact: true });
        await expect(list.getByRole("tab")).toHaveCount(4);
        for (const cue of cues) {
          const tab = list.getByRole("tab", { name: cue, exact: true });
          await tab.click();
          await expect(tab).toHaveAttribute("aria-selected", "true");
          await expect(tab).toHaveAttribute("data-state", "active");
          const panel = tour.getByRole("tabpanel", { name: cue, exact: true });
          await expect(panel).toBeVisible();
          const panelId = await tab.getAttribute("aria-controls");
          expect(panelId).toBeTruthy();
          await expect(panel).toHaveAttribute("id", panelId!);
          await expect(panel.locator(".ct-console-bar > b")).toHaveText(cue);
          await expect(tour.getByRole("tabpanel")).toHaveCount(1);
        }
        const last = list.getByRole("tab", { name: cues[3], exact: true });
        const previous = list.getByRole("tab", { name: cues[2], exact: true });
        await last.press("ArrowUp");
        await expect(previous).toBeFocused();
        await expect(previous).toHaveAttribute("aria-selected", "true");
        await previous.press("Home");
        await expect(list.getByRole("tab", { name: cues[0], exact: true })).toBeFocused();
        await expect(list.getByRole("tab", { name: cues[0], exact: true })).toHaveAttribute(
          "aria-selected",
          "true",
        );
        await evidence(page, info, "native-tour-first-cue");

        const header = page.locator(".ct-lime-header");
        const nav = header.locator("nav");
        const menu = header.getByRole("button", {
          name: "Open menu",
          exact: true,
          includeHidden: true,
        });
        const theme = header.getByRole("button", {
          name: "Toggle landing theme",
          exact: true,
          includeHidden: true,
        });
        await expect(menu).toHaveAttribute("aria-expanded", "false");
        const navId = await menu.getAttribute("aria-controls");
        expect(navId).toBeTruthy();
        await expect(nav).toHaveAttribute("id", navId!);
        await expect(theme).toHaveAttribute("aria-pressed", "false");
        if (width === 390) {
          await expect(theme).toBeVisible();
          await theme.press("Space");
          await expect(theme).toHaveAttribute("aria-pressed", "true");
          await expect(page.locator(".ct-limelight")).toHaveClass(/ct-limelight-light/);
          await theme.press("Space");
          await expect(theme).toHaveAttribute("aria-pressed", "false");
          await expect(page.locator(".ct-limelight")).not.toHaveClass(/ct-limelight-light/);
          await menu.click();
          await expect(menu).toHaveAttribute("aria-expanded", "true");
          await expect(nav).toBeVisible();
          await evidence(page, info, "mobile-navigation-open");
          await nav.getByRole("button", { name: "FAQ", exact: true }).click();
          await expect(menu).toHaveAttribute("aria-expanded", "false");
          await expect(nav).toBeHidden();
          await expect(page.locator("#lime-faq")).toBeInViewport();
        } else {
          await expect(menu).toBeHidden();
          await expect(nav).toBeVisible();
          await theme.press("Space");
          await expect(theme).toHaveAttribute("aria-pressed", "true");
          await expect(page.locator(".ct-limelight")).toHaveClass(/ct-limelight-light/);
          await theme.press("Space");
          await expect(theme).toHaveAttribute("aria-pressed", "false");
          await expect(page.locator(".ct-limelight")).not.toHaveClass(/ct-limelight-light/);
        }
        await expect(page).toHaveURL(
          (url) => url.hash.split("?")[0] === "#/template-preview/limelight",
        );

        const opener = page
          .locator(".ct-lime-rates article")
          .first()
          .getByRole("button", { name: /^Start free trial$/i });
        await opener.click();
        const dialog = page.getByRole("dialog", { name: /^Start your free trial$/i });
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute(
          primitive === "base" ? "data-open" : "data-state",
          primitive === "base" ? "" : "open",
        );
        await dialog.getByLabel("Work email", { exact: true }).fill("nova-review@example.test");
        await dialog.getByLabel("Workspace name", { exact: true }).fill("Nova review");
        await evidence(page, info, "native-trial-dialog");
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(opener).toBeFocused();
        expect(issues).toEqual([]);
      });
    });
  }
}

for (const primitive of ["radix", "base"] as const) {
  test.describe(`${primitive} non-Nova phone`, () => {
    test.use({ viewport: { width: 390, height: 844 } });

    for (const style of nonNovaStyles) {
      test(`${style}: native groups, tour, mobile navigation and Trial opener focus`, async ({
        page,
        baseURL,
      }, info) => {
        const issues = await open(page, baseURL, primitive, style);
        await page.evaluate(() => document.fonts.ready);
        const role = primitive === "radix" ? "radio" : "button";
        const console = page.locator("#lime-home .ct-console");
        const period = console.getByRole(primitive === "radix" ? "radiogroup" : "group", {
          name: "Console period",
          exact: true,
        });
        const month = period.getByRole(role, { name: /^Month$/i });
        await month.click();
        await month.click();
        await selected(month, primitive);
        await expect(console.locator(".ct-console-stats strong")).toContainText([
          "251,580",
          "41",
          "221ms",
          "0.11%",
        ]);

        const tour = page.locator(".ct-lime-tour[data-slot=tabs]");
        const tabs = tour.getByRole("tablist", { name: "Production tour", exact: true });
        const team = tabs.getByRole("tab", { name: cues[2], exact: true });
        await team.click();
        await expect(team).toHaveAttribute("aria-selected", "true");
        await expect(team).toHaveAttribute("data-state", "active");
        const teamPanel = tour.getByRole("tabpanel", { name: cues[2], exact: true });
        await expect(teamPanel).toBeVisible();
        const panelId = await team.getAttribute("aria-controls");
        expect(panelId).toBeTruthy();
        await expect(teamPanel).toHaveAttribute("id", panelId!);
        await team.press("ArrowUp");
        const previous = tabs.getByRole("tab", { name: cues[1], exact: true });
        await expect(previous).toBeFocused();
        await expect(previous).toHaveAttribute("aria-selected", "true");
        await expect(tour.getByRole("tabpanel", { name: cues[1], exact: true })).toBeVisible();
        await evidence(page, info, `${primitive}-${style}-selected-tour`);

        const header = page.locator(".ct-lime-header");
        const nav = header.locator("nav");
        const menu = header.getByRole("button", {
          name: "Open menu",
          exact: true,
          includeHidden: true,
        });
        const theme = header.getByRole("button", {
          name: "Toggle landing theme",
          exact: true,
          includeHidden: true,
        });
        await expect(theme).toBeVisible();
        await expect(theme).toHaveAttribute("aria-pressed", "false");
        await theme.press("Space");
        await expect(theme).toHaveAttribute("aria-pressed", "true");
        await expect(page.locator(".ct-limelight")).toHaveClass(/ct-limelight-light/);
        await theme.press("Space");
        await expect(theme).toHaveAttribute("aria-pressed", "false");
        await expect(page.locator(".ct-limelight")).not.toHaveClass(/ct-limelight-light/);
        await expect(menu).toHaveAttribute("aria-expanded", "false");
        const navId = await menu.getAttribute("aria-controls");
        expect(navId).toBeTruthy();
        await expect(nav).toHaveAttribute("id", navId!);
        await menu.click();
        await expect(menu).toHaveAttribute("aria-expanded", "true");
        await expect(nav).toBeVisible();
        await evidence(page, info, `${primitive}-${style}-navigation-open`, {
          navigation: { expanded: await menu.getAttribute("aria-expanded"), controlledId: navId },
        });
        await nav.getByRole("button", { name: "Pricing", exact: true }).click();
        await expect(menu).toHaveAttribute("aria-expanded", "false");
        await expect(nav).toBeHidden();
        await expect(page).toHaveURL(
          (url) => url.hash.split("?")[0] === "#/template-preview/limelight",
        );

        const billing = page.getByRole(primitive === "radix" ? "radiogroup" : "group", {
          name: "Billing period",
          exact: true,
        });
        const yearly = billing.getByRole(role, { name: /^Yearly$/i });
        await yearly.click();
        await selected(yearly, primitive);
        const starter = page.locator(".ct-lime-rates article").first();
        await expect(starter.locator("strong")).toHaveText("$290/year");
        const opener = starter.getByRole("button", { name: /^Start free trial$/i });
        await opener.click();
        const dialog = page.getByRole("dialog", { name: /^Start your free trial$/i });
        await expect(dialog).toBeVisible();
        await expect(dialog).toHaveAttribute(
          primitive === "base" ? "data-open" : "data-state",
          primitive === "base" ? "" : "open",
        );
        await dialog.getByLabel("Work email", { exact: true }).fill("style-review@example.test");
        await dialog.getByLabel("Workspace name", { exact: true }).fill("Style review");
        const overlay = await dialog.evaluate((node) => {
          const rect = node.getBoundingClientRect();
          const css = getComputedStyle(node);
          return {
            state: node.getAttribute("data-state"),
            nativeOpen: node.hasAttribute("data-open"),
            bounds: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
            padding: css.padding,
            radius: css.borderTopLeftRadius,
            fields: [...node.querySelectorAll("input")].map((input) => {
              const bounds = input.getBoundingClientRect();
              const computed = getComputedStyle(input);
              return {
                type: input.type,
                value: input.value,
                width: bounds.width,
                height: bounds.height,
                fontSize: computed.fontSize,
                radius: computed.borderTopLeftRadius,
              };
            }),
          };
        });
        await evidence(page, info, `${primitive}-${style}-trial-dialog`, { overlay });
        await page.keyboard.press("Escape");
        await expect(dialog).toHaveCount(0);
        await expect(opener).toBeFocused();
        expect(issues).toEqual([]);
      });
    }
  });
}
