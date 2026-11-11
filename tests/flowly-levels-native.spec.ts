import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

// Native Level contract observed on the reference; no key, focus or style injection.
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

async function open(page: Page, section: string, width: number, library = "radix") {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(
    library === "base" ? "/base/#/template-preview/flowly" : "/#/template-preview/flowly",
  );
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

async function capture(page: Page, info: TestInfo, name: string, target: Locator) {
  const measured = await target.evaluate((root) => {
    const metric = (element: Element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return {
        tag: element.tagName,
        role: element.getAttribute("role"),
        width: rect.width,
        height: rect.height,
        x: rect.x,
        y: rect.y,
        font: style.fontSize,
        line: style.lineHeight,
        weight: style.fontWeight,
        gap: style.gap,
        padding: style.padding,
        columns: style.gridTemplateColumns,
        border: style.borderWidth,
        radius: style.borderRadius,
      };
    };
    return {
      group: metric(root),
      items: Array.from(
        root.querySelectorAll('[data-slot="toggle-group-item"], [data-slot="radio-group-item"]'),
      ).map((element) => ({
        ...metric(element),
        pressed: element.getAttribute("aria-pressed"),
        checked: element.getAttribute("aria-checked"),
        tabindex: element.getAttribute("tabindex"),
        label: element.getAttribute("aria-labelledby"),
      })),
      cards: Array.from(root.querySelectorAll('label[data-slot="field-label"]')).map(metric),
      descriptions: Array.from(root.querySelectorAll('[data-slot="field-description"]')).map(
        metric,
      ),
    };
  });
  await writeFile(info.outputPath(`${name}.json`), JSON.stringify(measured, null, 2) + "\n");
  await page.screenshot({ path: info.outputPath(`${name}.png`), fullPage: false });
  return measured;
}

async function access(page: Page) {
  const trigger = page.getByRole("button", { name: "Open Hanna Berg actions", exact: true });
  await trigger.click();
  await page.getByRole("menuitem", { name: "Change access", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Hanna Berg", exact: true });
  await settledDialog(dialog);
  return {
    trigger,
    dialog,
    levels: dialog.getByRole("radiogroup", { name: "Access level", exact: true }),
  };
}

const levelCases = ["radix", "base"].flatMap((library) =>
  [1440, 390].map((width) => ({ library, width })),
);
for (const { library, width } of levelCases) {
  test(`Flowly Level ${library} ${width}: Invite pressed buttons preserve native focus, selection, description and draft reset`, async ({
    page,
  }, info) => {
    await open(page, "Members", width, library);
    const trigger = page.getByRole("button", { name: "Invite member", exact: true });
    await trigger.click();
    let dialog = page.getByRole("dialog", { name: "Invite Member", exact: true });
    await settledDialog(dialog);
    const group = dialog.getByRole("group", { name: "Level", exact: true });
    const admin = group.getByRole("button", { name: "Admin", exact: true });
    const editor = group.getByRole("button", { name: "Editor", exact: true });
    const viewer = group.getByRole("button", { name: "Viewer", exact: true });
    await expect(group.getByRole("button")).toHaveCount(3);
    await expect(group.getByRole("radio")).toHaveCount(0);
    await expect(editor).toHaveAttribute("aria-pressed", "true");
    await expect(editor).toHaveAttribute("tabindex", "-1");
    if (library === "base") {
      await expect(admin).toHaveAttribute("tabindex", "0");
      await expect(editor).toHaveAttribute("data-pressed", "");
    } else {
      await expect(group).toHaveAttribute("tabindex", "0");
      await expect(editor).toHaveAttribute("data-state", "on");
    }
    await expect(dialog.getByLabel("Name", { exact: true })).toBeFocused();
    const measured = await capture(page, info, "invite-level-default", group);
    expect(measured.group.gap).toBe("0px");
    expect(measured.group.height).toBeCloseTo(28, 1);
    for (const item of measured.items) {
      expect(item.tag).toBe("BUTTON");
      expect(item.role).toBeNull();
      expect(item.height).toBeCloseTo(28, 1);
      expect(item.font).toBe("12.8px");
      expect(item.weight).toBe("500");
    }
    await editor.click();
    await expect(editor).toHaveAttribute("aria-pressed", "true");
    await viewer.click();
    await expect(viewer).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.locator("#invite-level-description")).toHaveText(
      "Sees runs and results, changes nothing.",
    );
    await expect(dialog).toContainText("Joins as Viewer");
    await viewer.press("ArrowLeft");
    await expect(editor).toBeFocused();
    await expect(viewer).toHaveAttribute("aria-pressed", "true");
    await editor.press("Home");
    await expect(admin).toBeFocused();
    await expect(viewer).toHaveAttribute("aria-pressed", "true");
    await admin.press("End");
    await expect(viewer).toBeFocused();
    await expect(viewer).toHaveAttribute("aria-pressed", "true");
    await viewer.press("ArrowLeft");
    await editor.press("Space");
    await expect(editor).toHaveAttribute("aria-pressed", "true");
    await expect(dialog.locator("#invite-level-description")).toHaveText(
      "Builds, runs and publishes in their areas.",
    );
    await expect(dialog).toContainText("Joins as Editor");
    await editor.press("Space");
    await expect(editor).toHaveAttribute("aria-pressed", "true");
    await admin.click();
    await expect(admin).toHaveAttribute("aria-pressed", "true");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    dialog = page.getByRole("dialog", { name: "Invite Member", exact: true });
    await settledDialog(dialog);
    await expect(dialog.getByRole("button", { name: "Editor", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });

  test(`Flowly Level ${library} ${width}: Access whole cards preserve native radio keyboard, draft, save and Undo`, async ({
    page,
  }, info) => {
    await open(page, "Members", width, library);
    let { trigger, dialog, levels } = await access(page);
    let editor = levels.getByRole("radio", { name: /^Editor/ });
    let viewer = levels.getByRole("radio", { name: /^Viewer/ });
    const save = dialog.getByRole("button", { name: "Save Access", exact: true });
    await expect(levels.getByRole("radio")).toHaveCount(4);
    await expect(editor).toBeChecked();
    await expect(save).toBeDisabled();
    const measured = await capture(page, info, "access-level-default", levels);
    expect(measured.group.gap).toBe("8px");
    expect(measured.cards).toHaveLength(4);
    const columns = new Set(measured.cards.map((card) => Math.round(card.x)));
    expect(columns.size).toBe(width === 1440 ? 2 : 1);
    for (const card of measured.cards) expect(card.height).toBeCloseTo(width === 1440 ? 76 : 60, 1);
    if (library === "base") await expect(editor).toHaveAttribute("data-checked", "");
    else await expect(editor).toHaveAttribute("data-state", "checked");
    for (const item of measured.items) {
      expect(item.tag).toBe(library === "base" ? "SPAN" : "BUTTON");
      expect(item.role).toBe("radio");
      expect(item.width).toBeCloseTo(16, 1);
      expect(item.height).toBeCloseTo(16, 1);
    }
    for (const description of measured.descriptions) {
      expect(description.font).toBe("12px");
      expect(description.line).toBe("16px");
      expect(description.weight).toBe("400");
    }
    await levels.locator('label[for="member-access-viewer"]').click();
    await expect(viewer).toBeChecked();
    await expect(viewer).toBeFocused();
    await expect(save).toBeEnabled();
    // Radix moves focus on a timer and checks the held arrow when focus arrives.
    await page.keyboard.down("ArrowUp");
    await expect(editor).toBeFocused();
    await page.keyboard.up("ArrowUp");
    await expect(editor).toBeChecked();
    await expect(save).toBeDisabled();
    const first = library === "base" ? editor : levels.getByRole("radio", { name: /^Owner/ });
    const last = library === "base" ? editor : viewer;
    await editor.press("Home");
    await expect(first).toBeFocused();
    await expect(editor).toBeChecked();
    await first.press("End");
    await expect(last).toBeFocused();
    await expect(editor).toBeChecked();
    await editor.focus();
    await editor.press("Space");
    await expect(editor).toBeChecked();
    await expect(save).toBeDisabled();
    await levels.locator('label[for="member-access-viewer"]').click();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    // Preserve the separate known Cancel-to-details behavior; verify draft disposal here.
    if (await page.getByRole("dialog").count()) await page.keyboard.press("Escape");
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    ({ trigger, dialog, levels } = await access(page));
    editor = levels.getByRole("radio", { name: /^Editor/ });
    viewer = levels.getByRole("radio", { name: /^Viewer/ });
    await expect(editor).toBeChecked();
    await viewer.check();
    await dialog.getByRole("button", { name: "Save Access", exact: true }).click();
    await expect(dialog.getByRole("heading", { name: "Hanna Berg", exact: true })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await expect(
      page.locator(".fs-member-identity").filter({ hasText: "Hanna Berg" }),
    ).toContainText("Viewer");
    const toast = page
      .locator("[data-sonner-toast]")
      .filter({ hasText: "Demo member access updated" });
    await toast.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(
      page.locator(".fs-member-identity").filter({ hasText: "Hanna Berg" }),
    ).toContainText("Editor");
  });
}

for (const width of [1440, 390]) {
  test(`Flowly fields ${width}: native field groups preserve two-column Person, measured gaps, accessible Message and real invite data`, async ({
    page,
  }, info) => {
    await open(page, "Members", width);
    const trigger = page.getByRole("button", { name: "Invite member", exact: true });
    await trigger.click();
    let dialog = page.getByRole("dialog", { name: "Invite Member", exact: true });
    await settledDialog(dialog);
    const measured = await dialog.locator("form > fieldset").evaluateAll((sets) => {
      const metric = (e: Element) => {
        const b = e.getBoundingClientRect(),
          s = getComputedStyle(e);
        return {
          y: b.y,
          x: b.x,
          width: b.width,
          height: b.height,
          font: s.fontSize,
          line: s.lineHeight,
          weight: s.fontWeight,
          gap: s.gap,
          display: s.display,
          marginBottom: s.marginBottom,
          position: s.position,
          slot: e.getAttribute("data-slot"),
        };
      };
      return sets.map((set) => ({
        name: set.querySelector(":scope > legend")?.textContent,
        ...metric(set),
        legend: metric(set.querySelector(":scope > legend")!),
        rows: Array.from(set.querySelectorAll(':scope > [data-slot="field-group"] > div')).map(
          metric,
        ),
        fields: Array.from(set.querySelectorAll('[data-slot="field"]')).map((field) => ({
          ...metric(field),
          label: metric(field.querySelector("label")!),
          control: field.querySelector(
            '[data-slot="input"], [data-slot="select-trigger"], textarea',
          )
            ? metric(
                field.querySelector('[data-slot="input"], [data-slot="select-trigger"], textarea')!,
              )
            : null,
        })),
      }));
    });
    await writeFile(
      info.outputPath("invite-fields-geometry.json"),
      JSON.stringify(measured, null, 2) + "\n",
    );
    expect(measured.map((set) => set.name)).toEqual(["Person", "Access", "Areas", "Message"]);
    for (const set of measured) {
      expect(set.slot).toBe("field-set");
      expect(set.legend.slot).toBe("field-legend");
      expect(set.legend.height).toBeCloseTo(20, 1);
      expect(set.legend.marginBottom).toBe("6px");
    }
    for (let index = 1; index < measured.length; index++) {
      expect(measured[index].y - measured[index - 1].y - measured[index - 1].height).toBeCloseTo(
        24,
        1,
      );
    }
    const [person, accessGroup, areas, message] = measured;
    expect(person.height).toBeCloseTo(160.5, 1);
    expect(person.rows).toHaveLength(2);
    for (const row of person.rows) {
      expect(row.display).toBe("grid");
      expect(row.gap).toBe("16px");
      expect(row.height).toBeCloseTo(59.25, 1);
    }
    expect(person.fields).toHaveLength(4);
    expect(person.fields[0].y).toBeCloseTo(person.fields[1].y, 1);
    expect(person.fields[2].y).toBeCloseTo(person.fields[3].y, 1);
    expect(person.fields[1].x - person.fields[0].x - person.fields[0].width).toBeCloseTo(16, 1);
    expect(person.fields[2].y - person.fields[0].y - person.fields[0].height).toBeCloseTo(16, 1);
    for (const [index, field] of person.fields.entries()) {
      expect(field.height).toBeCloseTo(59.25, 1);
      expect(field.gap).toBe("8px");
      expect(field.label.height).toBeCloseTo(19.25, 1);
      expect(field.label.font).toBe("14px");
      expect(field.control?.height).toBeCloseTo(32, 1);
      expect(field.control?.font).toBe(index === 3 || width === 1440 ? "14px" : "16px");
    }
    expect(accessGroup.height).toBeCloseTo(110.25, 1);
    expect(areas.height).toBeCloseTo(243, 1);
    expect(message.fields[0].label.position).toBe("absolute");
    expect(message.fields[0].label.height).toBeCloseTo(1, 1);
    expect(message.fields[0].control?.height).toBeCloseTo(width === 390 ? 66 : 64, 1);
    expect(message.fields[0].control?.font).toBe(width === 390 ? "16px" : "14px");
    expect(message.height).toBeCloseTo(width === 390 ? 121 : 119, 1);
    await page.screenshot({ path: info.outputPath("invite-fields-default.png"), fullPage: false });
    const name = dialog.getByRole("textbox", { name: "Name", exact: true });
    const email = dialog.getByRole("textbox", { name: "Work Email", exact: true });
    const role = dialog.getByRole("textbox", { name: "Role", exact: true });
    const team = dialog.getByRole("combobox", { name: "Team", exact: true });
    await expect(name).toBeFocused();
    await name.press("Tab");
    await expect(email).toBeFocused();
    await email.press("Tab");
    await expect(role).toBeFocused();
    await role.press("Tab");
    await expect(team).toBeFocused();
    await team.click();
    await page.getByRole("option", { name: "Data", exact: true }).click();
    await expect(team).toContainText("Data");
    await name.fill("Draft Fields");
    await dialog.getByRole("textbox", { name: "Message", exact: true }).fill("Draft message");
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await trigger.click();
    dialog = page.getByRole("dialog", { name: "Invite Member", exact: true });
    await settledDialog(dialog);
    await expect(dialog.getByRole("textbox", { name: "Name", exact: true })).toHaveValue("");
    await expect(dialog.getByRole("combobox", { name: "Team", exact: true })).toContainText(
      "Platform",
    );
    await expect(dialog.getByRole("textbox", { name: "Message", exact: true })).toHaveValue("");
    await dialog.getByRole("textbox", { name: "Name", exact: true }).fill("Ana Field Layout");
    await dialog
      .getByRole("textbox", { name: "Work Email", exact: true })
      .fill("ana.fields@example.test");
    await dialog.getByRole("textbox", { name: "Role", exact: true }).fill("Layout Engineer");
    await dialog.getByRole("combobox", { name: "Team", exact: true }).click();
    await page.getByRole("option", { name: "Data", exact: true }).click();
    await dialog
      .getByRole("textbox", { name: "Message", exact: true })
      .fill("Native field message");
    await expect(dialog.getByRole("textbox", { name: "Message", exact: true })).toHaveValue(
      "Native field message",
    );
    await page.screenshot({ path: info.outputPath("invite-message-filled.png"), fullPage: false });
    await dialog.getByRole("button", { name: "Send Invite", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await page
      .getByRole("textbox", { name: "Search members", exact: true })
      .fill("Ana Field Layout");
    const member = page.locator(".fs-member-identity").filter({ hasText: "Ana Field Layout" });
    await expect(member).toContainText("Editor");
    await member.click();
    const detail = page.getByRole("dialog", { name: "Ana Field Layout", exact: true });
    await expect(detail.locator(".fs-facts").first()).toContainText("ana.fields@example.test");
    await expect(detail.locator(".fs-facts").first()).toContainText("Layout Engineer");
    await expect(detail.locator(".fs-facts").first()).toContainText("Data");
    await page.keyboard.press("Escape");
    const toast = page.locator("[data-sonner-toast]").filter({ hasText: "Demo invitation added" });
    await toast.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(member).toHaveCount(0);
  });
}
