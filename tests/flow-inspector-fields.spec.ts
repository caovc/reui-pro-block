import { expect, test, type Page } from "@playwright/test";

async function openEditor(page: Page, id: string, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`./#/preview/application/flow/${id}`);
  await expect(page.locator("[data-flow-variant]")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const node = page.locator(`[data-flow-node="${id === "flow-1" ? "form" : "trigger"}"]`);
  await node.dblclick();
  if (id === "flow-1") {
    await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveCount(0);
    await expect(page.locator(".fg-native-inspector-fields")).toHaveCount(0);
    await page.getByRole("button", { name: "Edit step", exact: true }).click();
  }
  await expect(page.getByRole("textbox", { name: "Title", exact: true })).toBeVisible();
  return node;
}

const descriptions = {
  "flow-1": {
    title: "Shown on the node. Two or three words read best.",
    detail: "The second line on the node. Usually the service it calls or the condition it tests.",
  },
  "flow-2": {
    title: "The integration or service this step calls.",
    detail: "What the step does, in one short clause.",
  },
};

for (const width of [1440, 390]) {
  for (const id of ["flow-1", "flow-2"] as const) {
    test(`${id} at ${width} uses responsive native text fields and adjacent contextual helpers`, async ({
      page,
    }) => {
      await openEditor(page, id, width);
      const group = page.locator(".fg-inspector-text-fields");
      await expect(group).toHaveAttribute("data-slot", "field-group");
      await expect(group).toHaveCSS("gap", "20px");
      const fields = group.locator('[data-slot="field"]');
      await expect(fields).toHaveCount(2);
      const titleBox = (await page
        .getByRole("textbox", { name: "Title", exact: true })
        .boundingBox())!;
      const detailBox = (await page
        .getByRole("textbox", { name: "Detail", exact: true })
        .boundingBox())!;
      expect(detailBox.y - titleBox.y).toBe(76);

      for (const name of ["Title", "Detail"] as const) {
        const input = page.getByRole("textbox", { name, exact: true });
        const field = fields.filter({ has: input });
        const label = field.locator('[data-slot="field-label"]');
        const help = field.getByRole("button", {
          name: `About the ${name.toLowerCase()}`,
          exact: true,
        });
        await expect(input).toHaveAttribute("data-slot", "input");
        await expect(input).toHaveCSS("height", "32px");
        await expect(input).toHaveCSS("font-size", width === 390 ? "16px" : "14px");
        await expect(input).toHaveCSS("line-height", width === 390 ? "24px" : "20px");
        await expect(input).toHaveCSS("font-weight", "400");
        await expect(input).toHaveCSS("padding", "4px 10px");
        await expect(input).toHaveCSS("margin-top", "0px");
        await expect(label).toHaveCSS("line-height", "14px");
        await expect(label).toHaveAttribute("for", (await input.getAttribute("id"))!);
        const labelBox = (await label.boundingBox())!;
        const helpBox = (await help.boundingBox())!;
        expect(helpBox.x - labelBox.x - labelBox.width).toBe(6);
        expect(helpBox.width).toBe(24);
        expect(helpBox.height).toBe(24);
        await expect(help.locator("svg")).toHaveCSS("width", "12px");

        await help.hover();
        const tooltip = page.getByRole("tooltip");
        await expect(tooltip).toHaveText(descriptions[id][name === "Title" ? "title" : "detail"]);
        const surface = page.locator('[data-slot="tooltip-content"]');
        await expect(surface).toHaveCSS("font-family", "Inter, Arial, sans-serif");
        await expect.poll(async () => (await surface.boundingBox())!.width).toBe(224);
        await expect
          .poll(async () => (await surface.boundingBox())!.height)
          .toBe(id === "flow-1" && name === "Detail" ? 60 : 44);
        await expect
          .poll(async () => {
            const bounds = (await surface.boundingBox())!;
            return Math.round(helpBox.y - bounds.y - bounds.height);
          })
          .toBe(4);
        if (width === 390) {
          await expect.poll(async () => (await surface.boundingBox())!.x).toBe(5);
        }
        await page.mouse.move(width - 10, 850, { steps: 10 });
        await expect(tooltip).toHaveCount(0);
      }
    });

    test(`${id} at ${width} preserves label focus, helper Escape, draft cancellation and saved-value Undo`, async ({
      page,
    }) => {
      const node = await openEditor(page, id, width);
      const title = page.getByRole("textbox", { name: "Title", exact: true });
      const detail = page.getByRole("textbox", { name: "Detail", exact: true });
      const originalTitle = await title.inputValue();
      const originalDetail = await detail.inputValue();
      await page.locator('.fg-native-inspector-fields [data-slot="field-label"]').first().click();
      await expect(title).toBeFocused();
      await expect
        .poll(() => title.evaluate((element) => getComputedStyle(element).boxShadow))
        .toContain("3px");
      await title.fill("Unsaved title");
      await detail.fill("Unsaved detail");
      await page.keyboard.press("Shift+Tab");
      await expect(
        page.getByRole("button", { name: "About the detail", exact: true }),
      ).toBeFocused();
      await expect(page.getByRole("tooltip")).toHaveText(descriptions[id].detail);
      await page.keyboard.press("Escape");
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await expect(title).toHaveValue("Unsaved title");
      await expect(detail).toHaveValue("Unsaved detail");
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(title).toHaveCount(0);
      await expect(node).toContainText(originalTitle);
      await expect(node).not.toContainText("Unsaved title");

      await node.dblclick();
      if (id === "flow-1")
        await page.getByRole("button", { name: "Edit step", exact: true }).click();
      await expect(title).toHaveValue(originalTitle);
      await expect(detail).toHaveValue(originalDetail);
      await title.fill("Saved field title");
      await detail.fill("Saved field detail");
      await page.getByRole("button", { name: "Save step", exact: true }).click();
      await expect(title).toHaveCount(0);
      await expect(node).toContainText("Saved field title");
      await expect(node).toContainText("Saved field detail");
      await expect(page.locator(".fg-native-inspector-fields")).toHaveCount(0);
      await expect(page.getByRole("button", { name: "Edit step", exact: true })).toBeVisible();
      if (width === 390) {
        // The native modal keeps outside toast actions unavailable until it closes.
        await page.getByRole("button", { name: "Close", exact: true }).click();
        await expect(page.getByRole("dialog")).toHaveCount(0);
      }
      await page
        .locator("[data-sonner-toast]")
        .filter({ hasText: "Step updated" })
        .getByRole("button", { name: "Undo", exact: true })
        .click();
      await expect(node).toContainText(originalTitle);
      await expect(node).toContainText(originalDetail);
      await expect(node).not.toContainText("Saved field title");
    });
  }
}

test("phone field tooltip follows the origin's explicit host font and reset", async ({ page }) => {
  await openEditor(page, "flow-2", 390);
  await page.evaluate(() => {
    let style = document.getElementById("preview-preset") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "preview-preset";
      document.head.append(style);
    }
    style.textContent =
      ":root:root [data-slot=sheet-content] { font-family: Georgia, serif; --font-sans: Georgia, serif; }";
  });
  const help = page.getByRole("button", { name: "About the title", exact: true });
  await help.hover();
  const tooltip = page.locator('[data-slot="tooltip-content"]');
  await expect(tooltip).toHaveCSS("font-family", "Georgia, serif");
  await page.evaluate(() => {
    document.getElementById("preview-preset")!.textContent = "";
  });
  await expect(tooltip).toHaveCSS("font-family", "Inter, Arial, sans-serif");
});

for (const width of [1440, 390]) {
  test(`workflow rich selects retain native geometry, icons and adjacent help at ${width}`, async ({
    page,
  }) => {
    await openEditor(page, "flow-1", width);
    const entries = [
      {
        label: "Category",
        items: ["Webhook", "Condition", "Data", "Email", "Delay", "Action"],
        height: 168,
        help: "Sets the glyph on the node, so a run reads by shape before anyone reads the words.",
        helpHeight: 60,
      },
      {
        label: "Owner",
        items: ["Ines Marchetti", "Tomas Lindqvist", "Hanna Berg"],
        height: 84,
        help: "Whoever gets paged when this step fails on a live run.",
        helpHeight: 44,
      },
    ];
    for (const entry of entries) {
      const trigger = page.getByRole("combobox", { name: entry.label, exact: true });
      const field = page
        .locator('.fg-inspector-select-fields [data-slot="field"]')
        .filter({ has: trigger });
      const label = field.locator("label");
      await expect(label).toHaveAttribute("for", (await trigger.getAttribute("id"))!);
      await expect(trigger).toHaveAttribute("data-slot", "select-trigger");
      await expect(trigger).toHaveCSS("height", "32px");
      await expect(trigger).toHaveCSS("font-size", "14px");
      await expect(trigger).toHaveCSS("font-weight", "400");
      await expect(trigger).toHaveCSS("padding", "8px 8px 8px 10px");
      expect((await trigger.boundingBox())!.width).toBe(width === 390 ? 357 : 351);
      if (entry.label === "Category") {
        await expect(trigger.locator(".lucide-webhook")).toHaveCount(1);
      } else {
        await expect(trigger.locator("img")).toHaveCount(1);
        await expect(trigger.locator(".fg-person")).toHaveCSS("width", "20px");
      }
      const help = field.getByRole("button", {
        name: `About the ${entry.label.toLowerCase()}`,
        exact: true,
      });
      const labelBox = (await label.boundingBox())!;
      expect((await help.boundingBox())!.x - labelBox.x - labelBox.width).toBe(6);
      await help.hover();
      await expect(page.getByRole("tooltip")).toHaveText(entry.help);
      await expect
        .poll(
          async () => (await page.locator('[data-slot="tooltip-content"]').boundingBox())!.height,
        )
        .toBe(entry.helpHeight);
      await page.mouse.move(width - 10, 850, { steps: 10 });
      await expect(page.getByRole("tooltip")).toHaveCount(0);
      await trigger.click();
      const popup = page.getByRole("listbox");
      await expect(popup).toHaveAttribute("data-slot", "select-content");
      await expect(popup).toHaveCSS("font-family", "Inter, Arial, sans-serif");
      await expect.poll(async () => (await popup.boundingBox())!.height).toBe(entry.height);
      const options = popup.getByRole("option");
      await expect(options).toHaveCount(entry.items.length);
      for (const name of entry.items) {
        const option = popup.getByRole("option", { name, exact: true });
        await expect(option).toHaveCSS("height", "28px");
        await expect(option).toHaveCSS("padding", "4px 32px 4px 6px");
        if (entry.label === "Owner") await expect(option.locator("img")).toHaveCount(1);
      }
      await expect(popup.locator('[aria-selected="true"]')).toHaveCount(1);
      await page.keyboard.press("Escape");
      await expect(popup).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await expect(page.getByRole("textbox", { name: "Title", exact: true })).toBeVisible();
    }
  });

  test(`workflow select typeahead, Escape, save and draft cancellation stay native at ${width}`, async ({
    page,
  }) => {
    await openEditor(page, "flow-1", width);
    const category = page.getByRole("combobox", { name: "Category", exact: true });
    const owner = page.getByRole("combobox", { name: "Owner", exact: true });
    await category.click();
    await page.keyboard.press("End");
    await expect(page.getByRole("option", { name: "Action", exact: true })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(page.getByRole("option", { name: "Webhook", exact: true })).toBeFocused();
    await page.keyboard.press("e");
    await expect(page.getByRole("option", { name: "Email", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(category).toContainText("Email");
    await expect(category.locator(".lucide-mail")).toHaveCount(1);
    await owner.click();
    await page.keyboard.press("h");
    await expect(page.getByRole("option", { name: "Hanna Berg", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(owner).toContainText("Hanna Berg");
    await category.click();
    await page.keyboard.press("Escape");
    await expect(category).toBeFocused();
    await expect(owner).toContainText("Hanna Berg");
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    await openEditor(page, "flow-1", width);
    await expect(category).toContainText("Webhook");
    await expect(owner).toContainText("Ines Marchetti");
    await category.click();
    await page.getByRole("option", { name: "Email", exact: true }).click();
    await owner.click();
    await page.getByRole("option", { name: "Hanna Berg", exact: true }).click();
    await page.getByRole("button", { name: "Save step", exact: true }).click();
    await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveCount(0);
    // Let the native toast finish without hovering it over the footer's Edit step.
    await page.mouse.move(0, 0);
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: "Step updated" }),
    ).toHaveCount(0);
    await page.getByRole("button", { name: "Edit step", exact: true }).click();
    await expect(category).toContainText("Email");
    await expect(owner).toContainText("Hanna Berg");
  });
}

for (const width of [1440, 390]) {
  test(`agent compact deletion preserves safe focus and removes only its node and connections at ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("./#/preview/application/flow/flow-2");
    const trigger = page.getByRole("button", { name: "Actions for Neon", exact: true });
    await expect(trigger).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const nodes = page.locator(".react-flow__node");
    const edges = page.locator(".react-flow__edge");
    const beforeNodes = await nodes.count();
    const beforeEdges = await edges.count();
    const openDelete = async () => {
      await trigger.click();
      await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
    };
    await openDelete();
    const dialog = page.getByRole("alertdialog", { name: "Delete Step?", exact: true });
    await expect(dialog).toHaveAttribute("data-size", "sm");
    await expect(dialog).toHaveCSS("font-family", "Inter, Arial, sans-serif");
    await expect(dialog.getByRole("heading")).toHaveCSS("font-family", "Inter, Arial, sans-serif");
    await expect(dialog.locator('[data-slot="alert-dialog-description"]')).toHaveText(
      "Neon and 2 connections are removed.",
    );
    await expect.poll(async () => (await dialog.boundingBox())!.width).toBe(320);
    await expect.poll(async () => (await dialog.boundingBox())!.height).toBe(147);
    const cancel = dialog.getByRole("button", { name: "Cancel", exact: true });
    const confirm = dialog.getByRole("button", { name: "Delete Step", exact: true });
    await expect(cancel).toBeFocused();
    expect((await cancel.boundingBox())!.width).toBe(140);
    expect((await confirm.boundingBox())!.width).toBe(140);
    expect((await cancel.boundingBox())!.y).toBe((await confirm.boundingBox())!.y);
    await expect(cancel).toHaveCSS("height", "32px");
    await expect(confirm).toHaveCSS("height", "32px");
    await cancel.click();
    await expect(dialog).toHaveCount(0);
    await expect(nodes).toHaveCount(beforeNodes);
    await expect(edges).toHaveCount(beforeEdges);
    await expect(trigger).toBeVisible();
    await expect(trigger).toBeFocused();
    await openDelete();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(nodes).toHaveCount(beforeNodes);
    await expect(trigger).toBeFocused();
    await openDelete();
    await confirm.click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toHaveCount(0);
    await expect(nodes).toHaveCount(beforeNodes - 1);
    await expect(edges).toHaveCount(beforeEdges - 2);
  });
}

test("compact deletion follows its canvas origin font and reset", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto("./#/preview/application/flow/flow-2");
  await page.getByRole("button", { name: "Actions for Neon", exact: true }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toBeVisible();
  await page.evaluate(() => {
    let style = document.getElementById("preview-preset") as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = "preview-preset";
      document.head.append(style);
    }
    style.textContent =
      ":root:root .reui-reference .fg-canvas { font-family: Georgia, serif; --font-sans: Georgia, serif; }";
  });
  await expect(dialog).toHaveCSS("font-family", "Georgia, serif");
  await expect(dialog.getByRole("heading")).toHaveCSS("font-family", "Georgia, serif");
  await page.evaluate(() => {
    document.getElementById("preview-preset")!.textContent = "";
  });
  await expect(dialog).toHaveCSS("font-family", "Inter, Arial, sans-serif");
  await expect(dialog.getByRole("heading")).toHaveCSS("font-family", "Inter, Arial, sans-serif");
});
