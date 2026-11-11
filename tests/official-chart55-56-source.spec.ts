import { expect, test } from "@playwright/test";
import { strFromU8 } from "fflate";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import {
  captureOriginalArchive,
  fileBytes,
  openSource,
  selectSource,
  sourceText,
  verifyOriginalClosure,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

test.setTimeout(30_000);
test.describe.configure({ retries: 0 });
test.use({ actionTimeout: 5_000 });

const chartFiles = "src/blocks/data/";
const select = "src/components/ui/select.tsx";
const agreements = [
  `${chartFiles}working-agreements.tsx`,
  `${chartFiles}working-agreements-matrix.tsx`,
  `${chartFiles}working-agreements-model.ts`,
];
const revenue = [
  `${chartFiles}revenue-map.tsx`,
  `${chartFiles}revenue-map-model.ts`,
  `${chartFiles}revenue-map-land.ts`,
];

const targets: { target: SourceTarget; leaves: string[] }[] = [
  {
    target: {
      id: "chart-55",
      kind: "block",
      name: "Working Agreements",
      route: "./#/block/chart/status-tracker/chart-55",
      defaultPath: agreements[0],
      selectedPath: agreements[0],
      requiredFiles: [
        ...agreements,
        `${chartFiles}status-tracker.tsx`,
        `${chartFiles}reui-free-chart-primitives.tsx`,
        "src/components/reui/frame.tsx",
        "src/components/reui/number-field.tsx",
        "src/components/reui/badge.tsx",
        "src/components/ui/chart.tsx",
        "src/components/ui/popover.tsx",
        "src/components/ui/progress.tsx",
        select,
        "src/components/ui/table.tsx",
      ],
    },
    leaves: agreements,
  },
  {
    target: {
      id: "chart-56",
      kind: "block",
      name: "Revenue Map",
      route: "./#/block/chart/composed-chart/chart-56",
      defaultPath: revenue[0],
      selectedPath: revenue[0],
      requiredFiles: [
        ...revenue,
        `${chartFiles}composed-charts.tsx`,
        "src/components/reui/frame.tsx",
        "src/components/ui/item.tsx",
        select,
        "src/components/ui/dropdown-menu.tsx",
      ],
    },
    leaves: revenue,
  },
];

const foundations = [
  { primitive: "radix", style: "vega" },
  { primitive: "base", style: "lyra" },
] as const;

for (const { primitive, style } of foundations) {
  for (const { target, leaves } of targets) {
    test(`${target.name} exposes ${primitive}-${style} source in View, Copy, file download and starter ZIP`, async ({
      page,
      context,
      baseURL,
    }, info) => {
      await context.grantPermissions(["clipboard-read", "clipboard-write"]);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      const site = new URL(primitive === "base" ? "base/" : "./", baseURL);
      const route = new URL(target.route, site);
      route.hash += `?preset=${encodeURIComponent(JSON.stringify({ primitive, style }))}`;
      const resolved = { ...target, route: route.href };
      const { dialog, choice } = await openSource(page, resolved, "archive");
      const { files } = await captureOriginalArchive(page, resolved, dialog, info);
      await verifyOriginalClosure(resolved, files, info, primitive);

      const preview = page
        .frameLocator(`iframe[title="${target.name} live preview"]`)
        .locator("html");
      await expect(preview).toHaveAttribute("data-ui-primitive", primitive);
      await expect(preview).toHaveAttribute("data-ui-style", style);
      expect(JSON.parse(strFromU8(files["components.json"])).style).toBe(`${primitive}-${style}`);
      expect(strFromU8(files["index.html"])).toContain(`data-ui-style="${style}"`);
      expect(strFromU8(files["src/theme.css"])).toContain(
        (await page.locator("#preview-preset").textContent())!.trim(),
      );
      const nativeSelect = primitive === "base" ? "src/foundations/base/ui/select.tsx" : select;
      for (const filename of [...leaves, select]) {
        const selected = { ...resolved, selectedPath: filename };
        const expected = await fileBytes(filename === select ? nativeSelect : filename);
        const code = await selectSource(page, selected, dialog, choice);
        await expect.poll(() => sourceText(code, selected)).toBe(expected.toString("utf8"));
        await code.getByRole("button", { name: "Copy", exact: true }).click();
        await expect
          .poll(() => page.evaluate(() => navigator.clipboard.readText()))
          .toBe(expected.toString("utf8"));

        const pending = page.waitForEvent("download");
        await code.getByRole("button", { name: "Download source file", exact: true }).click();
        const download = await pending;
        expect(download.suggestedFilename()).toBe(basename(filename));
        const artifact = await download.path();
        expect(artifact).toBeTruthy();
        expect(await readFile(artifact!)).toEqual(expected);
        expect(Buffer.from(files[filename])).toEqual(expected);
      }
      if (target.id === "chart-56") {
        expect(Buffer.from(files[revenue[2]]).toString("utf8")).toContain(
          "Natural Earth 1:110m land (public domain)",
        );
      }
      expect(errors).toEqual([]);
    });
  }
}
