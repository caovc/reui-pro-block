import { expect, test } from "@playwright/test";
import { strFromU8 } from "fflate";
import {
  captureOriginalArchive,
  fileBytes,
  openSource,
  selectSource,
  sourceText,
  type SourceTarget,
} from "./fidelity-next-source.helpers";

const implementation = "src/components/ui/template-progress.tsx";
const sharedAdapter = "src/templates/workflow/free/flowly-progress.tsx";
const templates = [
  { id: "flowly", name: "Flowly", label: "Seats: 60%", value: 60, height: "4px" },
  { id: "tempo", name: "Tempo", label: "Usage Limit", value: 82, height: "6px" },
  { id: "flux", name: "Flux", label: "Workspace spending limit", value: 66, height: "6px" },
] as const;

for (const primitive of ["radix", "base"] as const) {
  for (const template of templates) {
    test(`${template.name} Progress uses the selected ${primitive} primitive and source`, async ({
      page,
      baseURL,
    }, info) => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      const entry = new URL(primitive === "base" ? "base/" : "./", baseURL!);
      await page.goto(new URL(`#/template-preview/${template.id}`, entry).href);
      await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);

      if (template.id === "flowly") {
        await page.getByRole("button", { name: "Settings", exact: true }).click();
        await page
          .locator(".fs-secondary .fs-navigation")
          .getByRole("button", { name: "Members", exact: true })
          .click();
      }

      const progress = page.getByRole("progressbar", { name: template.label, exact: true });
      await expect(progress).toHaveAttribute("aria-valuenow", String(template.value));
      if (primitive === "radix") await expect(progress).toHaveAttribute("data-state", "loading");
      else await expect(progress).toHaveAttribute("data-progressing", "");
      const track = progress.locator('[data-slot="progress-track"]');
      await expect(track).toHaveCSS("height", template.height);
      await expect
        .poll(() =>
          track.evaluate((element) => {
            const fill = element.querySelector('[data-slot="progress-indicator"]')!;
            return fill.getBoundingClientRect().width / element.getBoundingClientRect().width;
          }),
        )
        .toBeCloseTo(template.value / 100, 2);

      const target: SourceTarget = {
        id: template.id,
        name: template.name,
        kind: "template",
        family: "workflow",
        route: new URL(`#/templates/${template.id}`, entry).href,
        defaultPath: `src/templates/workflow/${template.id}.tsx`,
        selectedPath: implementation,
        requiredFiles: [implementation, sharedAdapter],
      };
      const { dialog, choice } = await openSource(page, target, "archive");
      const { files } = await captureOriginalArchive(page, target, dialog, info);
      const expectedFile =
        primitive === "base" ? "src/foundations/base/ui/template-progress.tsx" : implementation;
      const expectedSource = (await fileBytes(expectedFile)).toString("utf8");
      expect(strFromU8(files[implementation])).toBe(expectedSource);
      expect(strFromU8(files[sharedAdapter])).toContain("@/components/ui/template-progress");
      expect(JSON.parse(strFromU8(files["components.json"])).style).toBe(`${primitive}-nova`);
      const code = await selectSource(page, target, dialog, choice);
      await expect.poll(() => sourceText(code, target)).toBe(expectedSource);
    });
  }
}
