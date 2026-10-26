import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

const entry = "ai-agents/agent-activity/agent-activity-1";
const leaf = "src/blocks/data/agent-activity-approval.tsx";

async function openMenu(page: Page) {
  const trigger = page.getByRole("button", { name: "Approval run actions", exact: true });
  await trigger.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect.poll(async () => (await menu.boundingBox())?.width).toBe(224);
  return { trigger, menu };
}

for (const width of [1440, 390]) {
  for (const mode of ["light", "dark"]) {
    test(`Activity1 grouped menu geometry and portal typography at ${width}px ${mode}`, async ({
      page,
    }, testInfo) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      page.on("console", (message) => {
        if (message.type() === "error") errors.push(message.text());
      });
      await page.setViewportSize({ width, height: width === 1440 ? 1000 : 844 });
      // Match the reference's actual Inter font using the supported global theme,
      // rather than overriding the menu locally and masking portal inheritance.
      const preset = encodeURIComponent(JSON.stringify({ font: "inter", mode }));
      await page.goto(`./#/preview/${entry}?preset=${preset}`);
      const { trigger, menu } = await openMenu(page);
      await expect(menu.locator('[data-slot="dropdown-menu-label"]')).toHaveText([
        "View",
        "Density",
        "Run",
      ]);
      const bounds = (await menu.boundingBox())!;
      expect(bounds.height).toBe(294);
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(width);
      expect(await page.evaluate(() => devicePixelRatio)).toBe(1);
      await expect(menu.getByRole("menuitem", { name: "Copy Summary", exact: true })).toHaveCSS(
        "height",
        "28px",
      );
      const measured = await menu.evaluate((element) => {
        const measure = (node: Element) => {
          const style = getComputedStyle(node);
          const box = node.getBoundingClientRect();
          return {
            text: node.textContent,
            width: box.width,
            height: box.height,
            font: style.fontFamily,
            size: style.fontSize,
            leading: style.lineHeight,
            weight: style.fontWeight,
            gap: style.gap,
            radius: style.borderRadius,
            padding: style.padding,
            color: style.color,
            background: style.backgroundColor,
            variant: node.getAttribute("data-variant"),
          };
        };
        return {
          menu: measure(element),
          bodyFont: getComputedStyle(document.body).fontFamily,
          rows: [...element.querySelectorAll('[role^="menuitem"]')].map(measure),
          labels: [...element.querySelectorAll('[data-slot="dropdown-menu-label"]')].map(measure),
          documentWidth: document.documentElement.scrollWidth,
        };
      });
      expect(measured.menu.font).toBe(measured.bodyFont);
      expect(measured.menu.font).toContain("Inter");
      expect(measured.rows).toHaveLength(7);
      for (const row of measured.rows) {
        expect(row.height).toBe(28);
        expect(row.size).toBe("14px");
        expect(row.leading).toBe("20px");
        expect(row.gap).toBe("6px");
      }
      for (const label of measured.labels) {
        expect(label.height).toBe(24);
        expect(label.size).toBe("12px");
        expect(label.leading).toBe("16px");
      }
      expect(measured.rows.at(-1)?.variant).toBe("destructive");
      expect(measured.documentWidth).toBe(width);
      await testInfo.attach("menu-geometry", {
        body: JSON.stringify(measured, null, 2),
        contentType: "application/json",
      });
      await page.screenshot({ path: testInfo.outputPath(`menu-${width}-${mode}.png`) });
      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
      expect(errors).toEqual([]);
    });
  }

  test(`Activity1 ${width}px view toggles and density retain native checked state and keyboard focus`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`./#/preview/${entry}`);
    const { trigger, menu } = await openMenu(page);
    const paths = menu.getByRole("menuitemcheckbox", { name: "File Paths", exact: true });
    await expect(paths).toBeChecked();
    await paths.click();
    await expect(menu).toBeVisible();
    await expect(paths).not.toBeChecked();
    await expect(page.locator("[data-step-path]")).toHaveCount(0);
    await paths.click();
    await expect(paths).toBeChecked();
    await expect(page.locator("[data-step-path]").first()).toBeVisible();
    const notes = menu.getByRole("menuitemcheckbox", { name: "Step Notes", exact: true });
    await notes.click();
    await expect(notes).toBeChecked();
    await expect(page.locator('[data-approval-step="read"] [data-step-note]')).toBeVisible();
    await notes.click();
    await expect(notes).not.toBeChecked();
    const fold = menu.getByRole("menuitemcheckbox", { name: "Fold Finished Steps", exact: true });
    await fold.click();
    await expect(fold).toBeChecked();
    await expect(page.locator('[data-approval-step="read"]')).not.toBeVisible();
    await fold.click();
    await expect(fold).not.toBeChecked();
    const card = page.locator("[data-approval-card]");
    const comfortable = (await card.boundingBox())!.height;
    await menu.getByRole("menuitemradio", { name: "Compact", exact: true }).click();
    await expect(menu).toBeVisible();
    await expect(menu.getByRole("menuitemradio", { name: "Compact", exact: true })).toBeChecked();
    await expect(card).toHaveAttribute("data-density", "compact");
    expect((await card.boundingBox())!.height).toBeLessThan(comfortable);
    await menu.getByRole("menuitemradio", { name: "Comfortable", exact: true }).click();
    await expect(menu).toBeVisible();
    await expect(card).toHaveAttribute("data-density", "comfortable");
    await page.keyboard.press("Home");
    await expect(paths).toBeFocused();
    await page.keyboard.press("Space");
    await expect(paths).not.toBeChecked();
    await expect(menu).toBeVisible();
    await page.keyboard.press("Space");
    await expect(paths).toBeChecked();
    await expect(menu).toBeVisible();
    await page.keyboard.press("ArrowDown");
    await expect(notes).toBeFocused();
    await page.keyboard.press("End");
    const restart = menu.getByRole("menuitem", { name: "Restart Run", exact: true });
    await expect(restart).toBeFocused();
    await expect(restart).toHaveAttribute("data-variant", "destructive");
    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
    await trigger.press("ArrowDown");
    await expect(paths).toBeFocused();
    // A modal Radix menu intentionally blocks pointer events on background
    // elements. Send an actual outside pointer event instead of asking a
    // locator to wait for an inert background heading to become clickable.
    await page.mouse.click(8, 8);
    await expect(menu).not.toBeVisible();
  });
}

test("Activity1 menu copies the live summary and its destructive restart keeps view preferences", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(`./#/preview/${entry}`);
  await page.getByRole("button", { name: "Deny", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Workspace slug", exact: true })).toBeVisible();
  const { menu } = await openMenu(page);
  await menu.getByRole("menuitem", { name: "Copy Summary", exact: true }).click();
  await expect(menu).not.toBeVisible();
  await expect
    .poll(() => page.evaluate(() => navigator.clipboard.readText()))
    .toContain("skipped: Update the limit label");
  await openMenu(page);
  await menu.getByRole("menuitemradio", { name: "Compact", exact: true }).click();
  await menu.getByRole("menuitem", { name: "Restart Run", exact: true }).click();
  await expect(menu).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Approve", exact: true })).toBeVisible();
  await expect(page.locator("[data-approval-card]")).toHaveAttribute("data-density", "compact");
  await expect(page.locator('[data-approval-step="edit"]')).toHaveAttribute(
    "data-step-state",
    "queued",
  );
});

test("Activity1 code, copied text, source file and real starter all use the menu's actual leaf", async ({
  page,
  context,
}, testInfo) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto(`./#/block/${entry}`);
  await page.getByRole("button", { name: "View code", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "Source file" })).toHaveText(leaf);
  const expected = await readFile(leaf, "utf8");
  await page.locator(".source-code").getByRole("button", { name: "Copy", exact: true }).click();
  await expect.poll(() => page.evaluate(() => navigator.clipboard.readText())).toBe(expected);
  let pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source file", exact: true }).click();
  const source = await pending;
  expect(await readFile((await source.path())!, "utf8")).toBe(expected);
  pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download starter", exact: true }).click();
  const project = await pending;
  await project.saveAs(testInfo.outputPath("activity1-menu-starter.zip"));
  const zip = unzipSync(new Uint8Array(await readFile((await project.path())!)));
  for (const file of [
    leaf,
    "src/components/ui/dropdown-menu.tsx",
    "src/components/ui/trace.tsx",
    "src/components/ui/marker.tsx",
    "src/components/reui/frame.tsx",
    "src/components/reui/REUI-LICENSE.txt",
  ]) {
    expect(strFromU8(zip[file]), file).toBe(await readFile(file, "utf8"));
  }
  expect(strFromU8(zip[leaf])).toContain("<DropdownMenuLabel>Density</DropdownMenuLabel>");
  expect(strFromU8(zip[leaf])).toContain('variant="destructive" onClick={restart}');
});
