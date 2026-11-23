import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import { strFromU8 } from "fflate";
import {
  captureOriginalArchive,
  fileBytes,
  openSource,
  selectSource,
  sourceText,
  verifyOriginalClosure,
  type SourceTarget,
} from "./fidelity-next-source.helpers";
test.describe.configure({ timeout: 30000, retries: 0 });
const folder = "src/blocks/data/";
const leaf = folder + "ai-chat-comparison.tsx";
const modules = [
  "ai-chat-comparison.tsx",
  "ai-chat-comparison-pane.tsx",
  "ai-chat-comparison-composer.tsx",
  "ai-chat-comparison-actions.tsx",
  "ai-chat-comparison-export.ts",
  "ai-chat-comparison-model.ts",
  "ai-chat-comparison-session.ts",
  "ai-chat-comparison.css",
].map((name) => folder + name);
for (const primitive of ["radix", "base"] as const) {
  test(`Chat7 ${primitive} actual source view/copy/file and untouched complete starter export`, async ({
    page,
    context,
    baseURL,
  }, info) => {
    if (!baseURL) throw new Error("The exact dual preview is required");
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["warning", "error"].includes(message.type())) errors.push(message.text());
    });
    const root = new URL("./", baseURL);
    if (root.pathname.endsWith("/base/")) root.pathname = root.pathname.slice(0, -5);
    const url = new URL(primitive === "base" ? "base/" : "./", root);
    url.hash =
      "/block/ai-agents/ai-chat/ai-chat-7?" +
      new URLSearchParams({ preset: JSON.stringify({ primitive, style: "nova", mode: "light" }) });
    const target: SourceTarget = {
      id: "ai-chat-7",
      kind: "block",
      name: "Model Comparison",
      route: url.href,
      defaultPath: leaf,
      selectedPath: leaf,
      requiredFiles: [
        ...modules,
        "src/components/ui/message.tsx",
        "src/components/ui/bubble.tsx",
        "src/components/ui/message-scroller.tsx",
        "src/components/ui/resizable.tsx",
        "src/components/ui/select.tsx",
        "src/components/ui/input-group.tsx",
        "src/components/ui/attachment.tsx",
        "src/components/ui/alert.tsx",
        "src/components/ui/badge.tsx",
        "src/components/ui/empty.tsx",
        "src/components/reui/code-block/code-block.tsx",
        "src/components/reui/REUI-LICENSE.txt",
      ],
    };
    const { dialog, choice } = await openSource(page, target, "archive");
    const { files } = await captureOriginalArchive(page, target, dialog, info);
    await verifyOriginalClosure(target, files, info, primitive);
    const iframe = page
      .frameLocator('iframe[title="Model Comparison live preview"]')
      .locator("html");
    await expect(iframe).toHaveAttribute("data-ui-primitive", primitive);
    await expect(iframe).toHaveAttribute("data-ui-style", "nova");
    expect(JSON.parse(strFromU8(files["components.json"])).style).toBe(`${primitive}-nova`);
    for (const filename of [
      leaf,
      folder + "ai-chat-comparison-model.ts",
      folder + "ai-chat-comparison.css",
      "src/components/ui/select.tsx",
    ]) {
      const selected = { ...target, selectedPath: filename };
      const original =
        filename === "src/components/ui/select.tsx" && primitive === "base"
          ? "src/foundations/base/ui/select.tsx"
          : filename;
      const bytes = await fileBytes(original);
      const code = await selectSource(page, selected, dialog, choice);
      await expect.poll(() => sourceText(code, selected)).toBe(bytes.toString("utf8"));
      await code.getByRole("button", { name: "Copy", exact: true }).click();
      await expect
        .poll(() => page.evaluate(() => navigator.clipboard.readText()))
        .toBe(bytes.toString("utf8"));
      const pending = page.waitForEvent("download");
      await code.getByRole("button", { name: "Download source file", exact: true }).click();
      const file = await pending;
      expect(file.suggestedFilename()).toBe(basename(filename));
      const path = await file.path();
      expect(path).toBeTruthy();
      expect(await readFile(path!)).toEqual(bytes);
      expect(Buffer.from(files[filename])).toEqual(bytes);
    }
    expect(errors).toEqual([]);
  });
}
