import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { getTextEntryCss } from "../src/foundations/styles/text-entry";
import {
  captureOriginalArchive,
  fileBytes,
  openSource,
  selectSource,
  sourceText,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

const inputGroup = "src/components/ui/input-group.tsx";
const textarea = "src/components/ui/textarea.tsx";
const dropdown = "src/components/ui/dropdown-menu.tsx";

const targets = [
  {
    id: "ai-chat-1",
    kind: "block",
    name: "AI Chat Copilot",
    route: "#/block/ai-agents/ai-chat/ai-chat-1",
    defaultPath: "src/blocks/data/ai-chat-copilot.tsx",
    selectedPath: inputGroup,
    requiredFiles: ["src/blocks/data/ai-chat-composer.tsx", inputGroup, textarea, dropdown],
    style: "mira",
    styleLabel: "Mira",
    fieldLabel: "Message the assistant",
    actionLabel: "Choose model",
  },
  {
    id: "echo",
    kind: "template",
    name: "Echo",
    family: "workflow",
    route: "#/templates/echo",
    defaultPath: "src/templates/workflow/echo.tsx",
    selectedPath: inputGroup,
    requiredFiles: ["src/templates/workflow/echo-composer.tsx", inputGroup, textarea, dropdown],
    style: "luma",
    styleLabel: "Luma",
    fieldLabel: "Message Bricklane Chat",
    actionLabel: "Add context",
  },
] as const satisfies readonly (SourceTarget & {
  style: string;
  styleLabel: string;
  fieldLabel: string;
  actionLabel: string;
})[];

test.use({ viewport: { width: 1440, height: 1000 } });

for (const primitive of ["radix", "base"] as const) {
  for (const target of targets) {
    test(`${primitive} ${target.id} text entry preview and downloaded source agree`, async ({
      page,
      context,
    }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const params = new URLSearchParams({
        preset: JSON.stringify({ primitive, style: "nova", mode: "light" }),
      });
      await page.goto(`${primitive === "base" ? "./base/" : "./"}${target.route}?${params}`);
      await page.getByRole("button", { name: "Customize", exact: true }).click();
      await page.getByRole("combobox", { name: "Style", exact: true }).click();
      await page.getByRole("option", { name: target.styleLabel, exact: true }).click();
      await page.getByRole("button", { name: "Close customizer", exact: true }).click();

      const preview =
        target.kind === "block" ? page.frameLocator('iframe[title$=" live preview"]') : page;
      const html = preview.locator("html");
      await expect(html).toHaveAttribute("data-ui-primitive", primitive);
      await expect(html).toHaveAttribute("data-ui-style", target.style);
      const css = getTextEntryCss(target.style).trim();
      expect(css.length).toBeGreaterThan(0);
      await expect
        .poll(async () => (await preview.locator("#preview-preset").textContent())?.includes(css))
        .toBe(true);

      const draft = preview.getByRole("textbox", { name: target.fieldLabel, exact: true });
      await expect(draft).toHaveAttribute("data-slot", "input-group-control");
      await draft.fill("Review the input group");
      const trigger = preview.getByRole("button", { name: target.actionLabel, exact: true });
      await trigger.press("ArrowDown");
      const menu = preview.getByRole("menu");
      await expect(menu).toBeVisible();
      await expect(menu).toHaveAttribute(
        primitive === "base" ? "data-open" : "data-state",
        primitive === "base" ? "" : "open",
      );
      await page.keyboard.press("Escape");
      await expect(menu).toBeHidden();
      await expect(trigger).toBeFocused();
      await trigger.click();
      if (target.kind === "block") {
        await menu.getByRole("menuitemradio", { name: "Claude Sonnet", exact: true }).click();
        await expect(trigger).toContainText("Claude Sonnet");
      } else {
        await menu.getByRole("menuitem", { name: /Connect repo/ }).click();
        await expect(preview.getByText("bricklane/platform", { exact: true })).toBeVisible();
      }
      await expect(draft).toHaveValue("Review the input group");

      const resolved = { ...target, route: page.url() };
      const { dialog, choice } = await openSource(page, resolved, "archive");
      const { files } = await captureOriginalArchive(page, resolved, dialog, info);
      expect(JSON.parse(Buffer.from(files["components.json"]).toString("utf8")).style).toBe(
        `${primitive}-${target.style}`,
      );
      expect(Buffer.from(files["src/theme.css"]).toString("utf8")).toContain(css);
      for (const filename of resolved.requiredFiles)
        expect(files[filename], filename).toBeDefined();

      for (const filename of [inputGroup, textarea, dropdown]) {
        const actualPath =
          primitive === "base" && filename === dropdown
            ? "src/foundations/base/ui/dropdown-menu.tsx"
            : filename;
        const expected = await fileBytes(actualPath);
        expect(Buffer.from(files[filename]), filename).toEqual(expected);
        const selected = { ...resolved, selectedPath: filename };
        const code = await selectSource(page, selected, dialog, choice);
        const text = expected.toString("utf8");
        await expect.poll(() => sourceText(code, selected)).toBe(text);
        await code.getByRole("button", { name: "Copy", exact: true }).click();
        await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(text);
        const pending = page.waitForEvent("download");
        await code
          .getByRole("button", {
            name:
              target.kind === "block" ? "Download source file" : "Download template source file",
            exact: true,
          })
          .click();
        const download = await pending;
        const path = info.outputPath(basename(filename));
        await download.saveAs(path);
        expect(download.suggestedFilename()).toBe(basename(filename));
        expect(await readFile(path)).toEqual(expected);
      }
      expect(errors).toEqual([]);
    });
  }
}
