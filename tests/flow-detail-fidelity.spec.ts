import { expect, test, type Page } from "@playwright/test";
import { attachFontRenderDiagnostics } from "./font-render-diagnostics";

async function open(page: Page, id: string, width: number) {
  await page.setViewportSize({ width, height: 900 });
  await page.goto(`./#/preview/application/flow/${id}`);
  await expect(page.locator("[data-flow-variant]")).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

for (const width of [1440, 390]) {
  for (const id of ["flow-1", "flow-2"]) {
    test(`${id} at ${width} uses native mode ToggleGroup geometry and roving keyboard focus`, async ({
      page,
    }) => {
      await open(page, id, width);
      // Normalize the canvas zoom through the actual control before comparing geometry.
      await page.getByRole("button", { name: /^Zoom level / }).click();
      await page.getByRole("menuitem", { name: "100%", exact: true }).click();
      const group = page.getByRole("radiogroup", { name: "Canvas mode", exact: true });
      const select = group.getByRole("radio", { name: "Select", exact: true });
      const pan = group.getByRole("radio", { name: "Pan", exact: true });
      await expect(group).toHaveAttribute("data-slot", "toggle-group");
      await expect(group).toHaveAttribute("data-size", "sm");
      await expect(group).toHaveAttribute("data-spacing", "0.5");
      await expect(group).toHaveCSS("width", "58px");
      await expect(group).toHaveCSS("height", "28px");
      await expect(group).toHaveCSS("gap", "2px");
      const toolbar = page.getByRole("group", { name: "Canvas controls", exact: true });
      await expect(toolbar).toHaveAttribute("data-slot", "card");
      await expect(toolbar).toHaveCSS("border-top-width", "0px");
      expect(await toolbar.boundingBox()).toEqual({
        x: 24,
        y: 840,
        width: id === "flow-1" ? 287 : 220,
        height: 36,
      });
      expect(await group.boundingBox()).toEqual({ x: 28, y: 844, width: 58, height: 28 });
      const zoom = toolbar.getByRole("group", { name: "Zoom", exact: true });
      await expect(zoom).toHaveCSS("width", "108px");
      await expect(zoom).toHaveCSS("gap", "2px");
      await expect(toolbar.getByRole("button", { name: "Zoom level 100%", exact: true })).toHaveCSS(
        "font-size",
        "12.8px",
      );
      await expect(toolbar.getByRole("separator")).toHaveCount(id === "flow-1" ? 3 : 2);
      if (id === "flow-1") {
        await expect(toolbar.getByRole("button", { name: "Undo", exact: true })).toBeDisabled();
        await expect(toolbar.getByRole("button", { name: "Redo", exact: true })).toBeDisabled();
        const lock = toolbar.getByRole("button", { name: "Lock canvas", exact: true });
        await expect(lock).toHaveAttribute("aria-pressed", "false");
        await lock.click();
        const primary = await toolbar.evaluate((element) => {
          // Resolve the token through the browser: production may serialize 0.205 as 20.5%.
          const probe = element.ownerDocument.createElement("span");
          probe.style.backgroundColor = "var(--primary)";
          element.append(probe);
          const color = getComputedStyle(probe).backgroundColor;
          probe.remove();
          return color;
        });
        await expect(toolbar.getByRole("button", { name: "Unlock canvas", exact: true })).toHaveCSS(
          "background-color",
          primary,
        );
        await expect(
          toolbar.getByRole("button", { name: "Unlock canvas", exact: true }),
        ).toHaveAttribute("aria-pressed", "true");
        await toolbar.getByRole("button", { name: "Unlock canvas", exact: true }).click();
        await expect(lock).toHaveAttribute("aria-pressed", "false");
      }

      for (const button of [select, pan]) {
        await expect(button).toHaveCSS("width", "28px");
        await expect(button).toHaveCSS("height", "28px");
        await expect(button.locator("svg")).toHaveCSS("width", "14px");
      }
      const muted = await group.evaluate((element) => {
        const probe = element.ownerDocument.createElement("span");
        probe.style.backgroundColor = "var(--muted)";
        element.append(probe);
        const color = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return color;
      });
      const expectModePaint = async (selected: "Pan" | "Select") => {
        // Hover must not conceal a missing persistent selected background.
        await page.mouse.move(width - 20, 20);
        const checked = selected === "Pan" ? pan : select;
        const unchecked = selected === "Pan" ? select : pan;
        await expect(checked).toHaveCSS("background-color", muted);
        await expect(unchecked).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      };
      await expect(select).toHaveAttribute("aria-checked", "false");
      await expect(pan).toHaveAttribute("aria-checked", "true");
      await expectModePaint("Pan");
      await select.click();
      await expect(select).toHaveAttribute("aria-checked", "true");
      await expectModePaint("Select");
      await page.keyboard.press("ArrowRight");
      await expect(pan).toBeFocused();
      await expect(select).toHaveAttribute("aria-checked", "true");
      await expect(pan).toHaveAttribute("aria-checked", "false");
      await expectModePaint("Select");
      await page.keyboard.press("Space");
      await expect(pan).toHaveAttribute("aria-checked", "true");
      await expect(select).toHaveAttribute("aria-checked", "false");
      await expectModePaint("Pan");
      await page.keyboard.press("Space");
      await expect(pan).toHaveAttribute("aria-checked", "true");
    });
  }

  for (const id of ["flow-1", "flow-2"]) {
    test(`${id} at ${width} preserves node double-click details in Pan and Select without canvas double-click zoom`, async ({
      page,
    }) => {
      for (const mode of ["Pan", "Select"]) {
        // Each mode starts from a fresh document, outside the preceding phone Sheet.
        await page.goto("about:blank");
        await open(page, id, width);
        await expect(page.getByRole("textbox", { name: "Title", exact: true })).toHaveCount(0);
        await expect(page.getByRole("button", { name: "Edit step", exact: true })).toHaveCount(0);
        if (mode === "Select")
          await page.getByRole("radio", { name: "Select", exact: true }).click();
        const viewport = page.locator(".react-flow__viewport");
        const before = await viewport.getAttribute("style");
        const node = page.locator(`[data-flow-node="${id === "flow-1" ? "form" : "trigger"}"]`);
        if (mode === "Pan") {
          const engineNode = page.locator(
            `.react-flow__node[data-id="${id === "flow-1" ? "form" : "trigger"}"]`,
          );
          await expect(engineNode).not.toHaveClass(/draggable/);
          await expect(engineNode.locator(".react-flow__handle").first()).toHaveCSS(
            "pointer-events",
            "none",
          );
        }
        await page.locator(".react-flow__pane").dblclick({ position: { x: 10, y: 10 } });
        await page.evaluate(
          () =>
            new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
        );
        await expect(viewport).toHaveAttribute("style", before!);
        await node.dblclick();
        await expect(
          id === "flow-1"
            ? page.getByRole("button", { name: "Edit step", exact: true })
            : page.getByRole("textbox", { name: "Title", exact: true }),
        ).toBeVisible();
        await expect(viewport).toHaveAttribute("style", before!);
      }
    });
  }

  test(`keyboard context editing retains a native focus destination at ${width}`, async ({
    page,
  }) => {
    await open(page, "flow-1", width);
    const node = page.locator('[data-flow-node="form"]');
    await node.click({ button: "right" });
    await page.keyboard.press("End");
    await expect(page.getByRole("menuitem", { name: "Edit step", exact: true })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("textbox", { name: "Title", exact: true })).toBeVisible();
    await expect(page.getByRole("menu", { includeHidden: true })).toHaveCount(0);
    if (width === 1440) {
      await expect(node).toBeFocused();
    } else {
      await expect
        .poll(() =>
          page.getByRole("dialog").evaluate((element) => element.contains(document.activeElement)),
        )
        .toBe(true);
    }
  });

  test(`category Escape closes its popup and preserves the editor at ${width}`, async ({
    page,
  }) => {
    await open(page, "flow-1", width);
    await page.locator('[data-flow-node="form"]').click({ button: "right" });
    await page.getByRole("menuitem", { name: "Edit step", exact: true }).click();
    const title = page.getByRole("textbox", { name: "Title", exact: true });
    await expect(title).toBeVisible();
    await title.fill("Uncommitted form title");
    const category = page.getByRole("combobox", { name: "Category", exact: true });
    await category.click();
    await expect(page.getByRole("listbox")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(title).toBeVisible();
    await expect(title).toHaveValue("Uncommitted form title");
    await expect(category).toBeFocused();
    await expect(page.getByRole("button", { name: "Save step", exact: true })).toBeVisible();
  });
  test(`workflow menus and native badge match measured reference geometry at ${width}`, async ({
    page,
  }, testInfo) => {
    await open(page, "flow-1", width);
    const badge = page.locator('[data-flow-node="form"] [data-slot="badge"]');
    await attachFontRenderDiagnostics(
      page,
      testInfo,
      `flow-badge-font-${width}`,
      '[data-flow-node="form"] [data-slot="badge"]',
    );
    expect(
      await badge.evaluate((element) => parseFloat(getComputedStyle(element).width)),
    ).toBeCloseTo(76.796875, 2);
    await expect(badge.locator("svg")).toHaveCSS("width", "12px");
    await page.getByRole("button", { name: "Workflow actions", exact: true }).click();
    const menu = page.getByRole("menu");
    await expect(menu).toHaveCSS("width", "224px");
    await expect(menu).toHaveCSS("height", "177px");
    await expect(menu.locator("svg")).toHaveCount(5);
    await expect(
      menu.getByRole("menuitemcheckbox", { name: "Snap to grid", exact: true }),
    ).toHaveAttribute("aria-checked", "true");
    await menu.getByRole("menuitemcheckbox", { name: "Snap to grid", exact: true }).click();
    await expect(menu).toBeVisible();
    await expect(
      menu.getByRole("menuitemcheckbox", { name: "Snap to grid", exact: true }),
    ).toHaveAttribute("aria-checked", "false");
    await page.keyboard.press("Escape");
    await page.locator('[data-flow-node="form"]').click({ button: "right" });
    await expect(menu).toHaveCSS("width", "192px");
    await expect(menu).toHaveCSS("height", "101px");
    await expect(menu.getByRole("separator")).toHaveCount(1);
    await expect(menu.getByRole("menuitem")).toHaveText([
      "Add step after",
      "View details",
      "Edit step",
    ]);
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(page.locator('[data-flow-node="form"]')).toBeFocused();
  });

  test(`agent menu uses native icon sizing, end alignment and destructive state at ${width}`, async ({
    page,
  }) => {
    await open(page, "flow-2", width);
    const button = page.getByRole("button", { name: "Actions for Stripe", exact: true }).first();
    const trigger = (await button.boundingBox())!;
    expect(trigger.width).toBe(24);
    expect(trigger.height).toBe(24);
    await expect(button).toHaveCSS("border-radius", "8px");
    await button.click();
    const menu = page.getByRole("menu");
    await expect(menu).toHaveCSS("width", "176px");
    await expect(menu).toHaveCSS("height", "92px");
    await expect
      .poll(async () => {
        const bounds = (await menu.boundingBox())!;
        return Math.abs(bounds.x + bounds.width - trigger.x - trigger.width);
      })
      .toBeLessThan(1);
    await page.keyboard.press("Escape");
    await page.getByRole("button", { name: "Actions for Neon", exact: true }).click();
    await expect(menu).toHaveCSS("width", "176px");
    await expect(menu).toHaveCSS("height", "129px");
    await expect(menu.getByRole("menuitem", { name: "Delete", exact: true })).toHaveAttribute(
      "data-variant",
      "destructive",
    );
  });

  for (const id of ["flow-1", "flow-2"]) {
    test(`${id} at ${width} pans without moving nodes and enables native node and port editing only in Select`, async ({
      page,
    }) => {
      await open(page, id, width);
      const node = page.locator(
        `.react-flow__node[data-id="${id === "flow-1" ? "condition" : "query"}"]`,
      );
      const viewport = page.locator(".react-flow__viewport");
      const handle = node.locator(".react-flow__handle").first();
      const position = () =>
        node.evaluate((element) => {
          const matrix = new DOMMatrix(getComputedStyle(element).transform);
          return { x: matrix.m41, y: matrix.m42 };
        });
      const drag = async () => {
        const bounds = (await node.boundingBox())!;
        const x = bounds.x + Math.min(100, bounds.width / 2);
        const y = bounds.y + Math.min(24, bounds.height / 2);
        await page.mouse.move(x, y);
        await page.mouse.down();
        await page.mouse.move(x + 48, y + 24, { steps: 12 });
        await page.mouse.up();
      };
      const initialPosition = await position();
      const initialViewport = await viewport.getAttribute("style");
      await expect(node).not.toHaveClass(/draggable/);
      await expect(handle).toHaveCSS("pointer-events", "none");
      await drag();
      await expect(viewport).not.toHaveAttribute("style", initialViewport!);
      expect(await position()).toEqual(initialPosition);
      await page.getByRole("radio", { name: "Select", exact: true }).click();
      await expect(node).toHaveClass(/draggable/);
      await expect(handle).toHaveCSS("pointer-events", "all");
      await drag();
      await expect.poll(position).not.toEqual(initialPosition);
      if (id === "flow-1") {
        const snapped = await position();
        expect(snapped.x % 20).toBeCloseTo(0, 5);
        expect(snapped.y % 20).toBeCloseTo(0, 5);
        if (width === 1440) expect(snapped).toEqual({ x: 340, y: 180 });
      }
      await page.getByRole("radio", { name: "Pan", exact: true }).click();
      await expect(node).not.toHaveClass(/draggable/);
      await expect(handle).toHaveCSS("pointer-events", "none");
    });
  }
}

for (const id of ["flow-1", "flow-2", "flow-3", "flow-4"]) {
  test(`${id} phone portal inherits its origin and follows explicit host font changes and reset`, async ({
    page,
  }) => {
    await open(page, id, 390);
    const nodeId =
      id === "flow-1"
        ? "form"
        : id === "flow-2"
          ? "trigger"
          : id === "flow-3"
            ? "reconcile"
            : "north";
    const node = page.locator(`[data-flow-node="${nodeId}"]`);
    if (id === "flow-2") {
      await node.getByRole("button", { name: "Actions for Stripe", exact: true }).click();
      await page.getByRole("menuitem", { name: "View details", exact: true }).click();
    } else {
      await node.click();
      await page
        .locator(".react-flow__node-toolbar")
        .getByRole("button", { name: id === "flow-1" ? "View Form submitted" : /^Open / })
        .click();
    }
    const sheet = page.getByRole("dialog");
    await expect(sheet).toBeVisible();
    await expect(sheet).toHaveCSS("font-family", "Inter, Arial, sans-serif");
    // Exercise the same stylesheet mutation used by the host's theme injector.
    // This is local test data, not a product-wide font override.
    await page.evaluate(() => {
      let style = document.getElementById("preview-preset") as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement("style");
        style.id = "preview-preset";
        document.head.append(style);
      }
      style.textContent = `
        :root:root .reui-reference,
        :root:root [data-slot="sheet-content"] {
          font-family: Georgia, serif;
          --font-sans: Georgia, serif;
        }
      `;
    });
    await expect(sheet).toHaveCSS("font-family", "Georgia, serif");
    await expect
      .poll(() =>
        sheet.evaluate((element) =>
          getComputedStyle(element).getPropertyValue("--fg-inspector-origin-font-family").trim(),
        ),
      )
      .toBe("Georgia, serif");
    await page.evaluate(() => {
      document.getElementById("preview-preset")!.textContent = "";
    });
    await expect(sheet).toHaveCSS("font-family", "Inter, Arial, sans-serif");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
}
