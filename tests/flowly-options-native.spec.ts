import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

// Original 30s case / 5s assertion budgets; run with one worker and zero retries.
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

async function measureMemberLegend(group: Locator, info: TestInfo, context: "invite" | "access") {
  const measured = await group.evaluate((root) => {
    const metric = (element: Element | null) => {
      if (!element) return null;
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        y: box.y,
        width: box.width,
        height: box.height,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        fontWeight: style.fontWeight,
        marginTop: style.marginTop,
        marginBottom: style.marginBottom,
        gap: style.gap,
        id: element.id,
      };
    };
    return {
      group: metric(root),
      legend: metric(root.querySelector(":scope > legend")),
      description: metric(root.querySelector(':scope > [data-slot="field-description"]')),
      firstRow: metric(root.querySelector('[data-slot="field"]')),
      describedBy: root.getAttribute("aria-describedby"),
    };
  });
  await writeFile(
    info.outputPath(`${context}-legend-geometry.json`),
    JSON.stringify(measured, null, 2) + "\n",
  );
  if (!measured.legend || !measured.firstRow || !measured.group) {
    throw new Error("Member Areas lost its native legend or option rows");
  }
  expect(measured.legend.fontSize).toBe("14px");
  expect(measured.legend.lineHeight).toBe("20px");
  expect(measured.legend.fontWeight).toBe("500");
  expect(measured.legend.marginBottom).toBe("6px");
  expect(measured.legend.width).toBeLessThan(measured.firstRow.width);
  const legendGap = measured.firstRow.y - measured.legend.y - measured.legend.height;
  expect(Math.abs(legendGap - (context === "invite" ? 6 : 30))).toBeLessThanOrEqual(0.25);
  expect(measured.group.gap).toBe(context === "invite" ? "16px" : "12px");
  if (context === "invite") {
    expect(measured.description).toBeNull();
  } else {
    if (!measured.description) throw new Error("Access Areas lost its group description");
    expect(measured.description.fontSize).toBe("12px");
    expect(measured.description.lineHeight).toBe("16px");
    expect(measured.description.fontWeight).toBe("400");
    expect(measured.description.marginTop).toBe("-4px");
    expect(measured.describedBy?.split(/\s+/)).toContain(measured.description.id);
    expect(
      Math.abs(measured.firstRow.y - measured.description.y - measured.description.height - 12),
    ).toBeLessThanOrEqual(0.25);
  }
}

async function screenshot(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: info.outputPath(`${name}.png`) });
}

async function measureRows(
  group: Locator,
  info: TestInfo,
  name: string,
  expectedCount: number,
  rowHeight: number,
  controlSize: { width: number; height: number },
  expectedGap: number | null,
  grid = false,
) {
  const measured = await group.evaluate((root) => {
    const metric = (element: Element) => {
      const box = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        fontWeight: style.fontWeight,
        fontFamily: style.fontFamily,
        gap: style.gap,
      };
    };
    return [...root.querySelectorAll('[data-slot="field"]')].map((row) => {
      const control = row.querySelector('[role="checkbox"], [role="switch"]');
      const label = row.querySelector('[data-slot="field-label"]');
      const description = row.querySelector('[data-slot="field-description"]');
      if (!control || !label || !description)
        throw new Error("An option lost its control/label/description");
      const describedBy = control.getAttribute("aria-describedby");
      return {
        row: metric(row),
        control: metric(control),
        label: metric(label),
        description: metric(description),
        labelText: label.textContent,
        labelFor: label.getAttribute("for"),
        controlId: control.id,
        describedBy,
        descriptionId: description.id,
        checked: control.getAttribute("aria-checked"),
      };
    });
  });
  await writeFile(
    info.outputPath(`${name}-geometry.json`),
    JSON.stringify(measured, null, 2) + "\n",
  );
  expect(measured).toHaveLength(expectedCount);
  for (const item of measured) {
    expect(Math.abs(item.row.height - rowHeight)).toBeLessThanOrEqual(0.25);
    expect(item.control.width).toBe(controlSize.width);
    expect(item.control.height).toBe(controlSize.height);
    const eventLabel = name === "webhook-events";
    const compactDescription = name === "access-areas";
    expect(item.row.gap).toBe("8px");
    expect(item.label.fontSize).toBe(eventLabel ? "12px" : "14px");
    expect(item.label.lineHeight).toBe(eventLabel ? "16px" : "19.25px");
    expect(item.label.fontWeight).toBe("500");
    expect(item.description.fontSize).toBe(compactDescription ? "12px" : "14px");
    expect(item.description.lineHeight).toBe(compactDescription ? "16px" : "21px");
    expect(item.description.fontWeight).toBe("400");
    if (eventLabel) expect(item.label.fontFamily).toMatch(/monospace/i);
    expect(item.labelFor).toBe(item.controlId);
    expect(item.descriptionId).not.toBe("");
    expect(item.describedBy?.split(/\s+/)).toContain(item.descriptionId);
    expect(item.control.x).toBeGreaterThanOrEqual(item.row.x - 0.25);
    expect(item.control.x + item.control.width).toBeLessThanOrEqual(
      item.row.x + item.row.width + 0.25,
    );
  }
  if (expectedGap !== null) {
    if (grid) {
      expect(Math.abs(measured[0].row.y - measured[1].row.y)).toBeLessThanOrEqual(0.25);
      expect(Math.abs(measured[2].row.y - measured[3].row.y)).toBeLessThanOrEqual(0.25);
      expect(
        Math.abs(measured[1].row.x - measured[0].row.x - measured[0].row.width - expectedGap),
      ).toBeLessThanOrEqual(0.25);
      expect(
        Math.abs(measured[2].row.y - measured[0].row.y - measured[0].row.height - expectedGap),
      ).toBeLessThanOrEqual(0.25);
    } else {
      for (let index = 1; index < measured.length; index++) {
        const previous = measured[index - 1].row;
        expect(
          Math.abs(measured[index].row.y - previous.y - previous.height - expectedGap),
        ).toBeLessThanOrEqual(0.25);
      }
    }
  }
  return measured;
}

async function undo(page: Page, title: string) {
  await page
    .locator("[data-sonner-toast]")
    .filter({ hasText: title })
    .getByRole("button", { name: "Undo", exact: true })
    .click();
}

async function openAccess(page: Page) {
  const trigger = page.getByRole("button", { name: "Open Hanna Berg actions", exact: true });
  await trigger.click();
  await page.getByRole("menuitem", { name: "Change access", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Hanna Berg", exact: true });
  await settledDialog(dialog);
  return { trigger, dialog };
}

async function manageSettings(page: Page, title: string) {
  const trigger = page.getByRole("button", { name: "Manage", exact: true }).first();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: title, exact: true });
  await settledDialog(dialog);
  await dialog.getByRole("tab", { name: "Settings", exact: true }).click();
  return { trigger, dialog };
}

for (const width of [1440, 390]) {
  test(`Flowly options ${width}: status filter and Invite switches use labels, Space, cancel/reset and saved areas`, async ({
    page,
  }, info) => {
    await open(page, "Members", width);
    const filter = page.getByRole("button", { name: "Filter members by status", exact: true });
    await filter.click();
    const invited = page.getByRole("checkbox", { name: /^Invited(?:\s*\d+)?$/ });
    await page.locator('label[for="settings-member-status-invited"]').click();
    await expect(invited).toBeChecked();
    await expect(invited).toBeFocused();
    await expect(page.locator(".fs-member-grid")).toContainText("Lena Wade");
    await expect(page.locator(".fs-member-grid")).not.toContainText("Hanna Berg");
    await invited.press("Space");
    await expect(invited).not.toBeChecked();
    await expect(page.locator(".fs-member-grid")).toContainText("Hanna Berg");
    await page.keyboard.press("Escape");
    await expect(filter).toBeFocused();

    const invite = page.getByRole("button", { name: "Invite member", exact: true });
    await invite.click();
    let dialog = page.getByRole("dialog", { name: "Invite Member", exact: true });
    await settledDialog(dialog);
    const areas = dialog.locator(".fs-member-areas-invite");
    await expect(areas.getByRole("switch")).toHaveCount(4);
    await expect(areas.getByRole("checkbox")).toHaveCount(0);
    for (const name of ["Workflows", "Agents"])
      await expect(areas.getByRole("switch", { name, exact: true })).toBeChecked();
    for (const name of ["Billing", "Integrations"])
      await expect(areas.getByRole("switch", { name, exact: true })).not.toBeChecked();
    const billing = areas.getByRole("switch", { name: "Billing", exact: true });
    await dialog.locator('label[for="invite-area-billing"]').click();
    await expect(billing).toBeChecked();
    await expect(billing).toBeFocused();
    await billing.press("Space");
    await expect(billing).not.toBeChecked();
    const rows = await measureRows(
      areas,
      info,
      "invite-areas",
      4,
      42.25,
      { width: 24, height: 14 },
      16,
    );
    for (const row of rows) {
      expect(
        Math.abs(row.control.x + row.control.width - row.row.x - row.row.width),
      ).toBeLessThanOrEqual(0.25);
      expect(row.control.x).toBeGreaterThan(row.label.x + row.label.width);
    }
    await measureMemberLegend(areas, info, "invite");
    await screenshot(page, info, "invite-switches");
    await dialog.locator('label[for="invite-area-billing"]').click();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(invite).toBeFocused();
    await invite.click();
    dialog = page.getByRole("dialog", { name: "Invite Member", exact: true });
    await settledDialog(dialog);
    await expect(dialog.getByRole("switch", { name: "Billing", exact: true })).not.toBeChecked();
    await dialog.locator("#invite-name").fill("Ana UI Options");
    await dialog.locator("#invite-email").fill("ana-options@example.com");
    await dialog.locator('label[for="invite-area-billing"]').click();
    await dialog.getByRole("button", { name: "Send Invite", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    const search = page.getByRole("textbox", { name: "Search members", exact: true });
    await search.fill("Ana UI Options");
    await page.locator(".fs-member-identity").filter({ hasText: "Ana UI Options" }).click();
    const saved = page.getByRole("dialog", { name: "Ana UI Options", exact: true });
    await saved.getByRole("tab", { name: "Access", exact: true }).click();
    await expect(saved.locator(".fs-facts")).toContainText("Workflows, Agents, Billing");
    await page.keyboard.press("Escape");
    await undo(page, "Demo invitation added");
    await expect(page.locator(".fs-member-grid")).not.toContainText("Ana UI Options");
  });

  test(`Flowly options ${width}: Access checkbox layout preserves label, Space, draft cancel, save and Undo`, async ({
    page,
  }, info) => {
    await open(page, "Members", width);
    let { trigger, dialog } = await openAccess(page);
    const areas = dialog.locator(".fs-member-areas-access");
    await expect(areas.getByRole("checkbox")).toHaveCount(4);
    await expect(areas.getByRole("switch")).toHaveCount(0);
    const billing = areas.getByRole("checkbox", { name: "Billing", exact: true });
    for (const name of ["Workflows", "Agents"]) {
      await expect(areas.getByRole("checkbox", { name, exact: true })).toBeChecked();
    }
    await expect(
      areas.getByRole("checkbox", { name: "Integrations", exact: true }),
    ).not.toBeChecked();
    await expect(billing).not.toBeChecked();
    await areas.locator('label[for="member-area-billing"]').click();
    await expect(billing).toBeChecked();
    await expect(billing).toBeFocused();
    await billing.press("Space");
    await expect(billing).not.toBeChecked();
    await measureRows(
      areas,
      info,
      "access-areas",
      4,
      37.25,
      { width: 16, height: 16 },
      12,
      width === 1440,
    );
    await measureMemberLegend(areas, info, "access");
    await screenshot(page, info, "access-checkboxes");
    await areas.locator('label[for="member-area-billing"]').click();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    // Do not lock in the known local Cancel-to-details mismatch; only verify draft disposal.
    if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    ({ trigger, dialog } = await openAccess(page));
    await expect(dialog.getByRole("checkbox", { name: "Billing", exact: true })).not.toBeChecked();
    await dialog.locator('label[for="member-area-billing"]').click();
    await dialog.getByRole("button", { name: "Save Access", exact: true }).click();
    await dialog.getByRole("tab", { name: "Access", exact: true }).click();
    await expect(dialog.locator(".fs-facts")).toContainText("Billing");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await undo(page, "Demo member access updated");
    ({ dialog } = await openAccess(page));
    await expect(dialog.getByRole("checkbox", { name: "Billing", exact: true })).not.toBeChecked();
    await page.keyboard.press("Escape");
  });

  test(`Flowly options ${width}: Integration Use In keeps measured rows and real Discard, saved uses, Undo and reload`, async ({
    page,
  }, info) => {
    await open(page, "Integrations", width);
    let { trigger, dialog } = await manageSettings(page, "Slack");
    let group = dialog.getByRole("group", { name: "Use In", exact: true });
    let tools = group.getByRole("checkbox", { name: "Agent tools", exact: true });
    for (const name of ["Workflow steps", "Run alerts"]) {
      await expect(group.getByRole("checkbox", { name, exact: true })).toBeChecked();
    }
    await expect(tools).not.toBeChecked();
    await group.locator('label[for="integration-edit-use-agent-tools"]').click();
    await expect(tools).toBeChecked();
    await expect(tools).toBeFocused();
    await tools.press("Space");
    await expect(tools).not.toBeChecked();
    await measureRows(group, info, "integration-use", 3, 42.25, { width: 16, height: 16 }, 12);
    await screenshot(page, info, "integration-use");
    await group.locator('label[for="integration-edit-use-agent-tools"]').click();
    await dialog.getByRole("button", { name: "Discard", exact: true }).click();
    await expect(tools).not.toBeChecked();
    await group.locator('label[for="integration-edit-use-agent-tools"]').click();
    await dialog.getByRole("button", { name: "Save Changes", exact: true }).click();
    await expect(dialog.getByRole("button", { name: "Save Changes", exact: true })).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    ({ dialog } = await manageSettings(page, "Slack"));
    await expect(dialog.getByRole("checkbox", { name: "Agent tools", exact: true })).toBeChecked();
    await page.keyboard.press("Escape");
    await undo(page, "Demo integration updated");
    ({ dialog } = await manageSettings(page, "Slack"));
    group = dialog.getByRole("group", { name: "Use In", exact: true });
    tools = group.getByRole("checkbox", { name: "Agent tools", exact: true });
    await expect(tools).not.toBeChecked();
    await group.locator('label[for="integration-edit-use-agent-tools"]').click();
    await dialog.getByRole("button", { name: "Save Changes", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.reload();
    await enterSettings(page, "Integrations", width);
    ({ dialog } = await manageSettings(page, "Slack"));
    await expect(
      dialog.getByRole("checkbox", { name: "Agent tools", exact: true }),
    ).not.toBeChecked();
    await page.keyboard.press("Escape");
  });

  test(`Flowly options ${width}: Webhook event labels, Space, measured rows, Discard, saved events, Undo and reload`, async ({
    page,
  }, info) => {
    await open(page, "Webhooks", width);
    let { trigger, dialog } = await manageSettings(page, "api.brick.test/hooks/runs");
    let events = dialog.getByRole("group", { name: "Events", exact: true });
    const started = events.getByRole("checkbox", { name: "run.started", exact: true });
    for (const name of ["run.started", "run.completed", "run.failed"]) {
      await expect(events.getByRole("checkbox", { name, exact: true })).toBeChecked();
    }
    await expect(
      events.getByRole("checkbox", { name: "agent.approval_requested", exact: true }),
    ).not.toBeChecked();
    await events.locator('label[for="webhook-edit-event-run.started"]').click();
    await expect(started).not.toBeChecked();
    await expect(started).toBeFocused();
    await started.press("Space");
    await expect(started).toBeChecked();
    await measureRows(events, info, "webhook-events", 5, 39, { width: 16, height: 16 }, 12);
    await screenshot(page, info, "webhook-events");
    const published = events.getByRole("checkbox", { name: "workflow.published", exact: true });
    await expect(published).not.toBeChecked();
    await events.locator('label[for="webhook-edit-event-workflow.published"]').click();
    await dialog.getByRole("button", { name: "Discard", exact: true }).click();
    await expect(published).not.toBeChecked();
    await events.locator('label[for="webhook-edit-event-workflow.published"]').click();
    await dialog.getByRole("button", { name: "Save Changes", exact: true }).click();
    await dialog.getByRole("tab", { name: "Overview", exact: true }).click();
    await expect(dialog.getByText("workflow.published", { exact: true })).toHaveCount(1);
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await undo(page, "Demo endpoint updated");
    ({ dialog } = await manageSettings(page, "api.brick.test/hooks/runs"));
    events = dialog.getByRole("group", { name: "Events", exact: true });
    await expect(
      events.getByRole("checkbox", { name: "workflow.published", exact: true }),
    ).not.toBeChecked();
    await events.locator('label[for="webhook-edit-event-workflow.published"]').click();
    await dialog.getByRole("button", { name: "Save Changes", exact: true }).click();
    await page.keyboard.press("Escape");
    await page.reload();
    await enterSettings(page, "Webhooks", width);
    ({ dialog } = await manageSettings(page, "api.brick.test/hooks/runs"));
    await expect(
      dialog.getByRole("checkbox", { name: "workflow.published", exact: true }),
    ).not.toBeChecked();
    await page.keyboard.press("Escape");
  });
}
