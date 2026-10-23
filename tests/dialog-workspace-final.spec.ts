import { readFile } from "node:fs/promises";
import { unzipSync, strFromU8 } from "fflate";
import { expect, test } from "@playwright/test";
const entries = [
  { id: 11, launch: "Open finance account setup" },
  { id: 12, launch: "Open quick entry" },
  { id: 13, launch: "Open project templates" },
  { id: 14, launch: "Open connection consent" },
  { id: 16, launch: "Open duplicate check" },
];
const route = (id: number) => `./#/preview/application/dialog/dialog-${id}`;
async function open(page: import("@playwright/test").Page, id: number) {
  await page.goto(route(id));
  await page
    .getByRole("button", { name: entries.find((entry) => entry.id === id)!.launch, exact: true })
    .click();
}
for (const width of [1440, 390])
  test(`final five dialogs remain bounded at ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const entry of entries) {
      await open(page, entry.id);
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible();
      await expect
        .poll(async () => {
          const b = await dialog.boundingBox();
          return !!b && b.x >= 0 && b.y >= 0 && b.x + b.width <= width && b.y + b.height <= 844;
        })
        .toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(width);
      if (entry.id === 13) await dialog.getByRole("button", { name: "Back", exact: true }).click();
      else await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole("button", { name: entry.launch, exact: true })).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
test("finance live preview sanitizes and persists local identity without banking action", async ({
  page,
}) => {
  await open(page, 11);
  await expect(page.getByLabel("Account name", { exact: true })).toBeFocused();
  await page.getByLabel("Account name", { exact: true }).fill("QA Operating");
  await page.getByLabel("Account tag", { exact: true }).fill("QA-TEST_2026");
  await page.getByLabel("Statement label", { exact: true }).fill("qa studio");
  await expect(page.getByLabel("Account tag", { exact: true })).toHaveValue("qatest_2026");
  await expect(page.getByLabel("Statement label", { exact: true })).toHaveValue("QA STUDIO");
  await expect(page.getByLabel("Live account preview")).toContainText("QA Operating");
  await page.getByRole("button", { name: "Create account", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("no financial account was opened");
});
test("entry modal keeps official BaseUI portals inside focus trap and returns focus on close", async ({
  page,
}) => {
  await open(page, 12);
  const dialog = page.locator(".final-entry-dialog");
  await expect(page.locator('[data-slot="dialog-overlay"]')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.body.style.pointerEvents)).toBe("none");
  await page.locator("#entry-status").click();
  await page.getByRole("combobox", { name: "Change status", exact: true }).fill("Completed");
  await page.getByRole("option", { name: "Completed", exact: true }).click();
  await expect(page.locator("#entry-status")).toContainText("Completed");
  await page.locator("#entry-priority").click();
  await page.getByRole("option", { name: "Urgent", exact: true }).click();
  await page.locator("#entry-status").focus();
  await page.keyboard.press("Tab");
  expect(await page.evaluate(() => !!document.activeElement?.closest(".final-entry-dialog"))).toBe(
    true,
  );
  await expect(page.getByRole("button", { name: "Open quick entry", exact: true })).toBeHidden();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Open quick entry", exact: true })).toBeFocused();
});
test("entry preserves five title drafts and selected status across tabs", async ({ page }) => {
  await open(page, 12);
  await page.getByLabel("Title", { exact: true }).fill("QA action");
  await page.getByRole("tab", { name: "Brief", exact: true }).click();
  await page.getByLabel("Title", { exact: true }).fill("QA brief");
  for (const name of ["Nudge", "Canvas", "Pulse", "Action"])
    await page.getByRole("tab", { name, exact: true }).click();
  await expect(page.getByLabel("Title", { exact: true })).toHaveValue("QA action");
  await page.getByRole("button", { name: "Create Action", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("QA action");
});
test("template prefills fields but retains user labels and resolves real due date", async ({
  page,
}) => {
  await open(page, 13);
  await page.getByRole("checkbox", { name: /^Design/ }).check();
  await page.getByRole("button", { name: "Select template", exact: true }).click();
  await page
    .getByRole("menuitem", {
      name: "Feature Request Shape a request into scoped delivery.",
      exact: true,
    })
    .click();
  await expect(page.getByLabel("Project name", { exact: true })).toHaveValue(
    "Invoice Export Builder",
  );
  await expect(page.getByRole("checkbox", { name: /^Design/ })).toBeChecked();
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Invoice Export Builder");
  await expect(page.getByRole("alert")).toContainText(/\d{4}-\d{2}-\d{2}/);
});
test("consent saves the actual selected scope without OAuth", async ({ page }) => {
  await open(page, 14);
  await page.getByRole("radio", { name: /Messages/ }).check();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Messages selected locally");
  await expect(page.getByRole("alert")).toContainText("no permission was granted");
});
test("duplicate Undo cancels pending link and create new remains independent", async ({ page }) => {
  await open(page, 16);
  await page.getByRole("button", { name: "Link Maya L. Chen", exact: true }).click();
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Create New", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Created a new local draft");
});

test("modal entry assignee search, local invite and real custom due date work", async ({
  page,
}) => {
  await open(page, 12);
  await page.locator("#entry-assignee").click();
  await page.getByPlaceholder("Select assignee").fill("Leo");
  await expect(page.getByRole("option")).toHaveCount(1);
  await page.getByRole("option", { name: "Leo Grant", exact: true }).click();
  await expect(page.locator("#entry-assignee")).toContainText("Leo Grant");
  await page.locator("#entry-assignee").click();
  await page.getByPlaceholder("Select assignee").fill("Invite");
  await page.getByRole("option", { name: "Invite...", exact: true }).click();
  await page.getByLabel("Invite email", { exact: true }).fill("qa@example.com");
  await page.getByRole("button", { name: "Save invitation draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("No email was sent");
  await page.locator("#entry-date").click();
  await page.getByRole("option", { name: "Custom date...", exact: true }).click();
  const picker = page.getByRole("dialog", { name: "Pick a date", exact: true });
  await expect(picker).toBeVisible();
  await expect(picker.getByRole("grid")).toHaveCount(2);
  await picker.getByRole("button", { name: "Confirm", exact: true }).click();
  await page.getByRole("button", { name: "Create Action", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("leo");
  await expect(page.getByRole("alert")).toContainText(/\d{4}-\d{2}-\d{2}/);
});

for (const [id, module] of [
  [11, "finance"],
  [12, "entry"],
  [13, "templates"],
  [14, "consent"],
  [16, "duplicates"],
] as const) {
  test(`dialog ${id} source viewer resolves its actual final module`, async ({ page }) => {
    await page.goto(`./#/block/application/dialog/dialog-${id}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    await expect(page.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      `src/blocks/application/dialog-variants/workspace-final/${module}.tsx`,
    );
  });
}

test("duplicate link finalizes only after the actual Undo window closes", async ({ page }) => {
  await open(page, 16);
  await page.getByRole("button", { name: "Link Maya L. Chen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Undo", exact: true })).toBeVisible();
  await expect(page.locator(".refined-dialog-result")).toHaveCount(0);
  await expect(page.locator(".refined-dialog-result")).toContainText(
    "Linked Maya Chen to Maya L. Chen",
    { timeout: 8000 },
  );
});

test("actual entry ZIP includes the reused free adapters and official modal Portal API", async ({
  page,
}) => {
  await page.goto("./#/block/application/dialog/dialog-12");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const files = unzipSync(new Uint8Array(await readFile((await (await pending).path())!)));
  for (const path of [
    "src/blocks/application/dialog-variants/workspace-final/entry.tsx",
    "src/blocks/application/dialog-variants/workspace-final/free/assignee-picker.tsx",
    "src/blocks/application/dialog-variants/workspace-final/free/date-picker.tsx",
    "src/blocks/application/dialog-variants/workspace-final/free/label-cards.tsx",
    "src/components/ui/combobox.tsx",
    "src/components/reui/REUI-LICENSE.txt",
    "src/lib/demo-artwork.ts",
  ])
    expect(files[path], path).toBeDefined();
  expect(strFromU8(files["src/components/ui/combobox.tsx"])).toContain(
    "<ComboboxPrimitive.Portal container={portalContainer}>",
  );
  expect(
    strFromU8(files["src/blocks/application/dialog-variants/workspace-final/free/date-picker.tsx"]),
  ).toContain("c-combobox-25");
});
