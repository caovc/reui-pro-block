import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const shortcuts = [
  { name: "Failures", view: "Runs", heading: null },
  { name: "Connections", view: "Connections", heading: /^Provider Connections$/ },
  { name: "Routing rules", view: "Routing rules", heading: /^Routing Rules/ },
  { name: "Spend overview", view: "Spend overview", heading: /^Cost Dashboard/ },
  { name: "Token audit", view: "Token audit", heading: /^Token Audit/ },
];

async function measureGroup(group: Locator, info: TestInfo, width: number) {
  const measured = await group.evaluate((root) => {
    const metric = (element: Element | null) => {
      if (!element) throw new Error("Required shortcut structure is missing");
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tag: element.tagName,
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        fontWeight: style.fontWeight,
        padding: style.padding,
      };
    };
    return {
      header: metric(root.querySelector('[data-slot="sidebar-group-label"]')),
      rows: [...root.querySelectorAll('a[data-slot="sidebar-menu-button"]')].map(metric),
    };
  });
  expect(measured.header.tag).toBe("BUTTON");
  expect(measured.header.height).toBe(32);
  expect(measured.header.fontSize).toBe("12px");
  expect(measured.header.lineHeight).toBe("16px");
  expect(measured.header.fontWeight).toBe("500");
  expect(measured.rows).toHaveLength(5);
  for (const row of measured.rows) {
    expect(row.height).toBe(36);
    expect(row.fontSize).toBe("14px");
    expect(row.lineHeight).toBe("20px");
    expect(row.fontWeight).toBe("400");
    expect(row.padding).toBe("8px 12px");
    expect(Math.abs(row.width - (width === 1440 ? 224 : 275.5))).toBeLessThanOrEqual(1);
  }
  for (let index = 1; index < measured.rows.length; index++) {
    expect(Math.abs(measured.rows[index].y - measured.rows[index - 1].y - 37)).toBeLessThanOrEqual(
      1,
    );
  }
  await writeFile(info.outputPath("quick-links-layout.json"), JSON.stringify(measured, null, 2));
}

async function checkDestination(page: Page, name: string, view: string, heading: RegExp | null) {
  await expect(page.locator(".wf-current-crumb")).toHaveText(view);
  if (heading) {
    await expect(page.locator(".wf-content .wf-page-heading h1")).toHaveText(heading);
  } else {
    // Failures intentionally preserves the existing RunTree alias in this narrow group migration.
    const tree = page.locator(".wf-run-tree");
    await expect(tree).toHaveCount(1);
    await expect(
      tree.locator(".wf-tree-name strong").filter({ hasText: /^Refund Triage$/ }),
    ).toHaveCount(1);
    await expect(
      tree.locator(".wf-tree-name strong").filter({ hasText: /^Invoice Reconciler$/ }),
    ).toHaveCount(0);
  }
  const primary = page.locator(".wf-native-navigation");
  await expect(primary.getByRole("button", { name: view, exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  const parent = ["Connections", "Routing rules"].includes(name)
    ? "Providers"
    : ["Spend overview", "Token audit"].includes(name)
      ? "Costs"
      : null;
  if (parent) {
    await expect(primary.getByRole("button", { name: parent, exact: true })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  }
  const group = page.locator(".wf-flux-quick-links");
  const selected = group.locator('[aria-current="page"], [data-active="true"]');
  await expect(selected).toHaveCount(0);
  await expect(group.getByRole("link", { name, exact: true })).toHaveAttribute(
    "href",
    "#/template-preview/flux",
  );
}

for (const width of [1440, 390]) {
  test(`Flux sidebar quick links ${width}: native disclosure and route callbacks preserve measured behavior`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
      if (message.type() === "warning") warnings.push(message.text());
    });
    await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
    await page.goto("/#/template-preview/flux");
    await expect(page.locator(".wf-agentops")).toBeVisible();
    await expect(page.locator(".wf-current-crumb")).toHaveText("Overview");
    await page.evaluate(async () => document.fonts.ready);
    const initialUrl = page.url();
    const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
    const drawer = page.getByRole("dialog", { name: "AgentOps navigation", exact: true });
    if (width === 390) {
      await trigger.click();
      await expect(drawer).toBeVisible();
    }
    const group = page.locator(".wf-flux-quick-links");
    const disclosure = group.getByRole("button", { name: "Quick links", exact: true });
    await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    await expect(disclosure).toHaveAttribute("aria-controls", /.+/);
    await measureGroup(group, info, width);
    await disclosure.click();
    await expect(disclosure).toHaveAttribute("aria-expanded", "false");
    await expect(group.getByRole("link")).toHaveCount(0);
    if (width === 1440) {
      await page.getByRole("button", { name: "Approvals", exact: true }).click();
      await expect(page.locator(".wf-flux-approval-layout")).toBeVisible();
      await page.getByRole("button", { name: "Overview", exact: true }).click();
      await expect(page.locator(".wf-current-crumb")).toHaveText("Overview");
      await expect(disclosure).toHaveAttribute("aria-expanded", "false");
      await disclosure.press("Enter");
    } else {
      await expect(drawer).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(drawer).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await trigger.click();
      await expect(drawer).toBeVisible();
    }
    await expect(disclosure).toHaveAttribute("aria-expanded", "true");
    for (const shortcut of shortcuts) {
      const link = group.getByRole("link", { name: shortcut.name, exact: true });
      if (width === 1440 && shortcut.name === "Failures") {
        await page.keyboard.press("Tab");
        await expect(link).toBeFocused();
        await page.keyboard.press("Enter");
      } else {
        await link.click();
      }
      await checkDestination(page, shortcut.name, shortcut.view, shortcut.heading);
      await expect(page).toHaveURL(initialUrl);
      if (width === 390) await expect(drawer).toBeVisible();
    }
    await page.screenshot({ path: info.outputPath("quick-links-native.png"), fullPage: false });
    if (width === 390) {
      await page.keyboard.press("Escape");
      await expect(drawer).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await trigger.click();
      await drawer.getByRole("button", { name: "Runs", exact: true }).click();
      await expect(drawer).toHaveCount(0);
      await expect(trigger).toBeFocused();
    } else {
      await page.getByRole("button", { name: "Runs", exact: true }).click();
    }
    // All other shortcuts clear the original risk-only seed, verified through actual rows after returning to Runs.
    await expect(
      page.locator(".wf-run-tree .wf-tree-name strong").filter({ hasText: /^Invoice Reconciler$/ }),
    ).toBeVisible();
    await expect(page.locator("vite-error-overlay")).toHaveCount(0);
    await expect(page.getByText("Unable to load this template", { exact: true })).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    await writeFile(info.outputPath("console.json"), JSON.stringify({ errors, warnings }, null, 2));
    expect(errors).toEqual([]);
  });
}

test("SidebarCollection default mobile row remains a button and closes the project drawer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/#/preview/application/app-shell/app-shell-3");
  const trigger = page.getByRole("button", { name: "Open navigation", exact: true });
  await trigger.click();
  const drawer = page.getByRole("dialog", { name: "Navigation", exact: true });
  await expect(drawer).toBeVisible();
  const project = drawer.getByRole("button", { name: "Design System", exact: true });
  await expect(project).toBeVisible();
  await expect(project).not.toHaveAttribute("href");
  await project.click();
  await expect(drawer).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("navigation", { name: "Breadcrumb", exact: true })).toContainText(
    "Design System",
  );
});
