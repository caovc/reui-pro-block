import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { strFromU8 } from "fflate";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { normalizeTheme, themeCSS } from "../src/components/site/preview-theme";
import { UI_STYLES, type UiStyle } from "../src/foundations/styles/index";
import {
  captureOriginalArchive,
  fileBytes,
  openSource,
  selectSource,
  sourceText,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

const id = "data-grid-advanced-28";
const name = "Invoice Manager";
const destination = `/data-grid/advanced/${id}`;
const directory = "src/blocks/data";
const leaf = `${directory}/grid-advanced-invoice-manager`;
const sheet = "src/components/ui/sheet.tsx";
const originals = [
  `${leaf}.tsx`,
  `${leaf}-controls.tsx`,
  `${leaf}-panels.tsx`,
  `${leaf}-model.ts`,
  `${leaf}.css`,
];
const nativeSheet = { radix: sheet, base: "src/foundations/base/ui/sheet.tsx" };
const packageName = { radix: "radix-ui", base: "@base-ui/react" };
type Library = keyof typeof nativeSheet;

const customer = "Birchway Fitness";
const invoice = "INV-2046";
const opener = (preview: Page | ReturnType<Page["frameLocator"]>) =>
  preview.getByRole("button", { name: `Open ${invoice}, ${customer}`, exact: true });
const columns = (preview: Page | ReturnType<Page["frameLocator"]>) =>
  preview.getByRole("button", { name: "Columns", exact: true });

function route(root: string, library: Library, style: UiStyle, kind: "block" | "preview") {
  const address = new URL(library === "base" ? "base/" : "./", root);
  const preset = normalizeTheme({ primitive: library, style, mode: "light" });
  const parameters = new URLSearchParams({ preset: JSON.stringify(preset) });
  address.hash = `/${kind}${destination}?${parameters}`;
  return address.href;
}

async function verifyNativeColumns(
  preview: Page | ReturnType<Page["frameLocator"]>,
  library: Library,
) {
  const trigger = columns(preview);
  const menu = preview.getByRole("menu");
  const timeline = menu.getByRole("menuitemcheckbox", { name: "Timeline", exact: true });
  await trigger.press("ArrowDown");
  await expect(menu).toBeVisible();
  if (library === "base") await expect(menu).toHaveAttribute("data-open", "");
  else await expect(menu).toHaveAttribute("data-state", "open");
  await expect(timeline).toBeChecked();
  await timeline.press("Space");
  await expect(timeline).toBeFocused();
  await expect(timeline).not.toBeChecked();
  await expect(preview.getByRole("columnheader", { name: "Timeline" })).toHaveCount(0);
  await timeline.press("Space");
  await expect(timeline).toBeChecked();
  await timeline.press("Escape");
  await expect(menu).toBeHidden();
  await expect(trigger).toBeFocused();
}

async function verifyCodeFile(
  page: Page,
  code: Locator,
  target: SourceTarget,
  files: Record<string, Uint8Array>,
  info: TestInfo,
) {
  const expected = strFromU8(files[target.selectedPath]);
  await expect.poll(() => sourceText(code, target)).toBe(expected);
  await code.getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  const pending = page.waitForEvent("download");
  await code.getByRole("button", { name: "Download source file", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe(basename(target.selectedPath));
  const output = info.outputPath(download.suggestedFilename());
  await download.saveAs(output);
  expect(await readFile(output)).toEqual(Buffer.from(files[target.selectedPath]));
}

function archiveText(files: Record<string, Uint8Array>, path: string) {
  expect(files[path], path).toBeDefined();
  return strFromU8(files[path]);
}

test.use({ viewport: { width: 1440, height: 1000 } });

for (const library of ["radix", "base"] as const) {
  for (const style of UI_STYLES) {
    test(`${library}/${style} Invoice Manager native preview and matching starter files`, async ({
      page,
      context,
      baseURL,
    }, info) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const faults: string[] = [];
      page.on("pageerror", (error) => faults.push(error.message));
      const address = route(baseURL!, library, style, "block");
      await page.goto(address);
      const preview = page.frameLocator(`iframe[title="${name} live preview"]`);
      const previewRoot = preview.locator("html");
      await expect(previewRoot).toHaveAttribute("data-ui-primitive", library);
      await expect(previewRoot).toHaveAttribute("data-ui-style", style);
      await expect(
        preview.getByRole("region", { name: "Invoice manager", exact: true }),
      ).toBeVisible();
      await expect(preview.getByText("Showing 1 to 20 of 148 invoices")).toBeVisible();
      const expectedTheme = themeCSS(
        normalizeTheme({ primitive: library, style, mode: "light" }),
      ).trim();
      await expect
        .poll(async () => (await preview.locator("#preview-preset").textContent())?.trim())
        .toBe(expectedTheme);
      const appearance = await columns(preview).evaluate((node) => {
        const style = getComputedStyle(node);
        return {
          height: style.height,
          radius: style.borderTopLeftRadius,
          padding: style.paddingInlineStart,
        };
      });
      expect(parseFloat(appearance.height)).toBeGreaterThan(20);
      await info.attach("column control appearance", {
        body: JSON.stringify(appearance),
        contentType: "application/json",
      });

      await verifyNativeColumns(preview, library);
      const trigger = opener(preview);
      await trigger.press("Enter");
      const details = preview.getByRole("dialog", { name: customer, exact: true });
      await expect(details).toBeVisible();
      await expect(details.getByText("Balance due", { exact: true })).toBeVisible();
      if (library === "base") await expect(details).toHaveAttribute("data-open", "");
      else await expect(details).toHaveAttribute("data-state", "open");
      await details.press("Escape");
      await expect(details).toBeHidden();
      await expect(trigger).toBeFocused();

      const target: SourceTarget = {
        id,
        name,
        kind: "block",
        route: address,
        defaultPath: originals[0]!,
        selectedPath: sheet,
        requiredFiles: [...originals, sheet],
      };
      const { opener: codeTrigger, dialog, choice } = await openSource(page, target, "archive");
      const { files } = await captureOriginalArchive(page, target, dialog, info);
      for (const filename of [
        ...originals,
        "LICENSE",
        "THIRD_PARTY_NOTICES.md",
        "src/components/reui/REUI-LICENSE.txt",
        "src/blocks/assets/Inter-LICENSE.txt",
      ]) {
        expect(Buffer.from(files[filename]), filename).toEqual(await fileBytes(filename));
      }
      expect(Buffer.from(files[sheet])).toEqual(await fileBytes(nativeSheet[library]));
      expect(
        JSON.parse(archiveText(files, "package.json")).dependencies[packageName[library]],
      ).toBeTruthy();
      expect(JSON.parse(archiveText(files, "components.json")).style).toBe(`${library}-${style}`);
      expect(archiveText(files, "src/theme.css")).toContain(expectedTheme);
      expect(archiveText(files, "src/Example.tsx")).toContain(id);

      if (style === "nova") {
        const defaultTarget = { ...target, selectedPath: target.defaultPath };
        await verifyCodeFile(
          page,
          await selectSource(page, defaultTarget, dialog, choice),
          defaultTarget,
          files,
          info,
        );
      }
      await verifyCodeFile(
        page,
        await selectSource(page, target, dialog, choice),
        target,
        files,
        info,
      );
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(codeTrigger).toBeFocused();
      expect(faults).toEqual([]);
    });
  }
}

for (const library of ["radix", "base"] as const) {
  test(`${library} Invoice Manager groups and filters rows and exports the current ledger view`, async ({
    page,
    baseURL,
  }, info) => {
    await page.goto(route(baseURL!, library, "nova", "preview"));
    const ledger = page.getByRole("region", { name: "Invoice manager", exact: true });
    const firstInvoice = opener(page);
    const expand = ledger.getByRole("button", { name: "Expand Needs You", exact: true });
    await expect(ledger.getByText("Showing 1 to 20 of 148 invoices")).toBeVisible();
    const metrics = ledger.getByRole("region", { name: "Receivables overview", exact: true });
    await expect(metrics.getByRole("region", { name: "Needs You", exact: true })).toContainText(
      "6 invoices",
    );
    await expect(metrics.getByRole("region", { name: "Waiting", exact: true })).toContainText(
      "8 invoices",
    );
    await expect(metrics.getByRole("region", { name: "Next 30 Days", exact: true })).toContainText(
      "9 invoices",
    );

    await ledger.getByRole("button", { name: "Collapse Needs You", exact: true }).press("Enter");
    await expect(firstInvoice).toHaveCount(0);
    await expect(expand).toBeFocused();
    await expand.press("Enter");
    await expect(firstInvoice).toBeVisible();
    await ledger.getByRole("button", { name: "Go to next page", exact: true }).click();
    await expect(ledger.getByText("Showing 21 to 40 of 148 invoices")).toBeVisible();
    await ledger.getByRole("button", { name: "Go to previous page", exact: true }).click();
    await expect(firstInvoice).toBeVisible();

    const grouping = ledger.getByRole("combobox", { name: "Group rows by", exact: true });
    await grouping.click();
    await page.getByRole("option", { name: "No grouping", exact: true }).click();
    await expect(
      ledger.getByRole("button", { name: "Collapse Needs You", exact: true }),
    ).toHaveCount(0);
    await expect(firstInvoice).toBeVisible();
    const quarterTimeline = ledger.locator(".invoice-track").first();
    await expect(quarterTimeline.locator(".invoice-track-divisions > span")).toHaveCount(3);
    await ledger.getByText("Month", { exact: true }).click();
    await expect(quarterTimeline.locator(".invoice-track-divisions > span")).toHaveCount(4);

    const filter = ledger.getByRole("button", { name: "Filter", exact: true });
    await filter.click();
    const advanced = page.getByRole("dialog", { name: "Advanced filter", exact: true });
    await advanced.getByRole("button", { name: "Add filter", exact: true }).click();
    await page.getByRole("option", { name: "Status", exact: true }).click();
    await page.getByRole("option", { name: "is", exact: true }).click();
    const paid = page.getByRole("option", { name: "Paid", exact: true });
    await expect(paid).toBeVisible();
    await paid.click();
    await expect(paid).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(advanced).toHaveCount(0);
    await expect(filter).toBeFocused();
    await expect(firstInvoice).toHaveCount(0);
    await expect(
      ledger.getByRole("table").getByText("Paid", { exact: true }).first(),
    ).toBeVisible();

    await filter.click();
    await advanced.getByRole("button", { name: "Clear all", exact: true }).click();
    await page.keyboard.press("Escape");
    await expect(firstInvoice).toBeVisible();

    await ledger
      .getByRole("searchbox", { name: "Search customers, contacts and invoices" })
      .fill(invoice);
    await expect(ledger.getByText("Showing 1 to 1 of 1 invoices")).toBeVisible();
    const pending = page.waitForEvent("download");
    await ledger.getByRole("button", { name: "Export", exact: true }).click();
    const download = await pending;
    const filename = info.outputPath(download.suggestedFilename());
    await download.saveAs(filename);
    const csv = await readFile(filename, "utf8");
    expect(csv.trim().split(/\r?\n/)).toHaveLength(2);
    expect(csv).toContain(invoice);
    expect(csv).toContain(customer);
    expect(csv).toContain("4585.00");
  });

  test(`${library} Invoice Manager records payments and collections with keyboard focus and undo`, async ({
    page,
    baseURL,
  }) => {
    await page.goto(route(baseURL!, library, "nova", "preview"));
    const trigger = opener(page);
    await trigger.press("Enter");
    const details = page.getByRole("dialog", { name: customer, exact: true });
    await expect(details).toBeVisible();
    await expect(details.getByText("$4,585", { exact: true }).first()).toBeVisible();
    const reminders = details.getByRole("switch", { name: "Automatic reminders", exact: true });
    await expect(reminders).toBeChecked();
    const record = details.getByRole("button", { name: "Record Payment", exact: true });
    await record.press("Enter");
    const payment = page.getByRole("dialog", { name: "Record Payment", exact: true });
    await expect(payment).toBeVisible();
    await payment.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(payment).toBeHidden();
    await expect(record).toBeFocused();
    await record.press("Enter");
    await payment.getByRole("button", { name: "Record", exact: true }).click();
    await expect(payment).toBeHidden();
    await expect(details.getByText("$0", { exact: true }).first()).toBeVisible();
    await expect(reminders).not.toBeChecked();
    await expect(record).toHaveCount(0);
    await expect(
      details.getByRole("button", { name: `More actions for ${invoice}`, exact: true }),
    ).toBeFocused();
    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();
    await page.getByRole("button", { name: "Undo", exact: true }).click();

    await trigger.press("Enter");
    await expect(record).toBeVisible();
    const handoff = details.getByRole("button", { name: "Hand to Collections", exact: true });
    await handoff.press("Enter");
    const confirmation = page.getByRole("alertdialog", {
      name: "Hand to Collections?",
      exact: true,
    });
    const cancel = confirmation.getByRole("button", { name: "Cancel", exact: true });
    await expect(cancel).toBeFocused();
    await cancel.press("Enter");
    await expect(confirmation).toBeHidden();
    await expect(handoff).toBeFocused();
    await handoff.press("Enter");
    await confirmation.getByRole("button", { name: "Hand to Collections", exact: true }).click();
    await expect(confirmation).toBeHidden();
    await expect(details.getByText("In Collections", { exact: true }).first()).toBeVisible();
    await expect(reminders).not.toBeChecked();
    await page.keyboard.press("Escape");
    await expect(details).toBeHidden();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await trigger.press("Enter");
    await expect(handoff).toBeVisible();
    await expect(reminders).toBeChecked();
  });

  test(`${library} Invoice Manager mobile preview scrolls only the ledger and exposes search by keyboard`, async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(route(baseURL!, library, "nova", "preview"));
    const ledger = page.getByRole("region", { name: "Invoice manager", exact: true });
    const overview = ledger.getByRole("region", { name: "Receivables overview", exact: true });
    const first = await overview
      .getByRole("region", { name: "Needs You", exact: true })
      .boundingBox();
    const second = await overview
      .getByRole("region", { name: "Waiting", exact: true })
      .boundingBox();
    expect(second!.y).toBeGreaterThanOrEqual(first!.y + first!.height);
    expect(await page.locator("html").evaluate((node) => node.scrollWidth)).toBe(390);
    const scroll = ledger.locator('[data-slot="scroll-area-viewport"]').first();
    await expect
      .poll(() => scroll.evaluate((node) => node.scrollWidth - node.clientWidth))
      .toBeGreaterThan(500);
    const searchName = "Search customers, contacts and invoices";
    const search = ledger.getByRole("button", { name: searchName, exact: true });
    await search.press("Enter");
    const input = page.getByRole("searchbox", { name: searchName, exact: true });
    await expect(input).toBeFocused();
    await input.fill(invoice);
    await input.press("Escape");
    await expect(input).toHaveCount(0);
    await expect(search).toBeFocused();
    await expect(ledger.getByText("Showing 1 to 1 of 1 invoices")).toBeVisible();
    await opener(page).press("Enter");
    const details = page.getByRole("dialog", { name: customer, exact: true });
    await expect(details).toBeVisible();
    expect((await details.boundingBox())!.width).toBeCloseTo(390, 2);
    await details.getByRole("button", { name: "Close", exact: true }).press("Enter");
    await expect(details).toBeHidden();
    await expect(opener(page)).toBeFocused();
  });
}

for (const library of ["radix", "base"] as const) {
  test(`${library} Invoice Manager drafts can be edited and deleted through the native details menu`, async ({
    page,
    baseURL,
  }) => {
    await page.goto(route(baseURL!, library, "nova", "preview"));
    const ledger = page.getByRole("region", { name: "Invoice manager", exact: true });
    const add = ledger.getByRole("button", { name: "New invoice", exact: true });
    await add.press("Enter");
    const create = page.getByRole("dialog", { name: "New invoice", exact: true });
    const createDraft = create.getByRole("button", { name: "Create Draft", exact: true });
    await expect(createDraft).toBeDisabled();
    await create
      .getByRole("textbox", { name: "Description", exact: true })
      .fill("Member records migration");
    const amount = create.locator('[data-slot="number-field-input"]');
    await expect(amount).toHaveAccessibleName("Invoice amount");
    await amount.fill("1375.50");
    await amount.press("Tab");
    await expect(createDraft).toBeEnabled();
    await createDraft.click();
    await expect(create).toBeHidden();
    await expect(add).toBeFocused();
    await expect(ledger.getByText("Showing 1 to 1 of 1 invoices")).toBeVisible();
    const draft = ledger.getByRole("button", { name: /Open INV-\d+, Birchway Fitness/ });
    await draft.press("Enter");
    const details = page.getByRole("dialog", { name: customer, exact: true });
    await expect(
      details.getByText("Member records migration", { exact: true }).first(),
    ).toBeVisible();
    const actions = details.getByRole("button", { name: /More actions for INV-/ });
    await actions.press("ArrowDown");
    const edit = page.getByRole("menuitem", { name: "Edit Invoice", exact: true });
    await edit.press("Enter");
    const editor = page.getByRole("dialog", { name: "Edit invoice", exact: true });
    await editor
      .getByRole("textbox", { name: "Description", exact: true })
      .fill("Member records and export");
    await editor.getByRole("button", { name: "Save Changes", exact: true }).click();
    await expect(editor).toBeHidden();
    await expect(draft).toBeFocused();
    await draft.press("Enter");
    await expect(
      details.getByText("Member records and export", { exact: true }).first(),
    ).toBeVisible();

    await actions.press("ArrowDown");
    await page.getByRole("menuitem", { name: "Delete Invoice", exact: true }).press("Enter");
    const confirmation = page.getByRole("alertdialog", { name: "Delete invoice?", exact: true });
    await confirmation.getByRole("button", { name: "Delete Invoice", exact: true }).click();
    await expect(details).toBeHidden();
    await expect(confirmation).toBeHidden();
    await expect(ledger.getByText("No invoices found", { exact: true })).toBeVisible();
    await expect(add).toBeFocused();
    await page.getByRole("button", { name: "Undo", exact: true }).click();
    await expect(draft).toBeVisible();
  });
}
