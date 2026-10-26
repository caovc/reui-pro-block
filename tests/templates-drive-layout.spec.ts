import { test, expect, type Page } from "@playwright/test";

async function openDrive(page: Page, id: "filespace" | "filebox") {
  await page.goto(`./#/template-preview/${id}`);
  if (id === "filebox") {
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
  }
  await expect(page.getByRole("columnheader", { name: /Name/ })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function settleDialog(page: Page, width: number) {
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.evaluate((element) =>
    Promise.allSettled(
      element
        .getAnimations({ subtree: true })
        .filter((animation) => animation.effect?.getComputedTiming().iterations !== Infinity)
        .map((animation) => animation.finished),
    ),
  );
  await expect.poll(async () => Math.round((await dialog.boundingBox())!.x)).toBe(0);
  await expect.poll(async () => Math.round((await dialog.boundingBox())!.width)).toBe(width);
  return dialog;
}

for (const id of ["filespace", "filebox"] as const) {
  test(`${id} uses native compact Sidebar slots and bounded desktop inset`, async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type())) errors.push(message.text());
    });
    await openDrive(page, id);
    const expected = {
      "sidebar-header": [8, 8, 47, 52],
      "sidebar-content": [8, 60, 47, 888],
      "sidebar-footer": [8, 948, 47, 44],
      "sidebar-inset": [63, 8, 1369, 984],
    };
    for (const [slot, rect] of Object.entries(expected)) {
      await expect
        .poll(async () => {
          const box = await page.locator(`[data-slot="${slot}"]`).boundingBox();
          return box && [box.x, box.y, box.width, box.height].map(Math.round);
        })
        .toEqual(rect);
    }
    await expect(page.getByRole("button", { name: "Open application navigation" })).toBeHidden();
    await expect(page.locator(".ct-drive-sidebar")).toBeVisible();
    if (id === "filebox") {
      await expect
        .poll(async () => {
          const box = await page.locator(".ct-drive-suggested-item").first().boundingBox();
          return box && [box.x, box.y, box.width, box.height];
        })
        .toEqual([336, 139, 260.75, 58]);
    }
    await page.keyboard.press("Control+b");
    await expect(page.locator('[data-slot="sidebar-gap"]')).toHaveCSS("width", "63px");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(1440);
    expect(errors).toEqual([]);
  });

  test(`${id} keeps application and folder drawers distinct with native Escape focus`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openDrive(page, id);
    await expect(page.locator(".ct-drive-sidebar")).toBeHidden();
    for (const [label, width] of [
      ["Open application navigation", 63],
      ["Open folders", 256],
    ] as const) {
      const opener = page.getByRole("button", { name: label, exact: true });
      await opener.click();
      const dialog = await settleDialog(page, width);
      if (width === 63) {
        await expect(dialog.locator('[data-slot="sidebar-header"]')).toBeVisible();
        await expect(dialog.getByRole("button", { name: "Drive", exact: true })).toBeVisible();
        await expect(dialog.getByRole("treeitem")).toHaveCount(0);
      } else {
        await expect(
          dialog.getByRole("heading", { name: "Bricklane Drive", exact: true }),
        ).toBeVisible();
        await expect(dialog.getByRole("treeitem", { name: "My Drive", exact: true })).toBeVisible();
      }
      await page.keyboard.press("Escape");
      await expect(dialog).toBeHidden();
      await expect(opener).toBeFocused();
    }
    await page.getByRole("textbox", { name: "Search files", exact: true }).fill("no-match");
    await page.getByRole("button", { name: "Open folders", exact: true }).click();
    const folders = await settleDialog(page, 256);
    await folders.getByRole("treeitem", { name: "My Drive", exact: true }).click();
    await expect(folders).toBeHidden();
    await expect(page.getByRole("textbox", { name: "Search files", exact: true })).toHaveValue("");
    await expect(
      page.locator(".ct-drive-header").getByText("My Drive", { exact: true }),
    ).toHaveText("My Drive");
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  });
}

test("Filespace mobile toolbar stays above its independently scrolling records", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDrive(page, "filespace");
  const toolbar = page.locator(".ct-drive-toolbar");
  const scroll = page.locator(".ct-drive-table > .ct-table-scroll");
  await expect.poll(async () => Math.round((await toolbar.boundingBox())!.height)).toBe(129);
  await expect.poll(async () => Math.round((await scroll.boundingBox())!.y)).toBe(175);
  await expect.poll(async () => Math.round((await scroll.boundingBox())!.height)).toBe(668);
  const search = page.getByRole("textbox", { name: "Search files", exact: true });
  const list = page.getByRole("radio", { name: "List view", exact: true });
  const type = page.getByRole("combobox", { name: "File type", exact: true });
  expect(Math.round((await search.boundingBox())!.y)).toBe(
    Math.round((await type.boundingBox())!.y),
  );
  expect(Math.round((await list.boundingBox())!.y)).toBe(Math.round((await type.boundingBox())!.y));
  await scroll.evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect.poll(() => scroll.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
  await expect.poll(async () => Math.round((await toolbar.boundingBox())!.y)).toBe(46);
  expect(await page.evaluate(() => window.scrollY)).toBe(0);
});

test("Filespace view choices use native ToggleGroup keyboard and retain file actions", async ({
  page,
}) => {
  await openDrive(page, "filespace");
  const list = page.getByRole("radio", { name: "List view", exact: true });
  const grid = page.getByRole("radio", { name: "Grid view", exact: true });
  await expect(list).toBeChecked();
  await list.focus();
  await page.keyboard.press("ArrowRight");
  await expect(grid).toBeFocused();
  await page.keyboard.press("Space");
  await expect(grid).toBeChecked();
  await expect(page.locator(".ct-drive-grid")).toBeVisible();
  await page.keyboard.press("ArrowLeft");
  await expect(list).toBeFocused();
  await page.keyboard.press("Space");
  await expect(list).toBeChecked();
  await page.getByRole("checkbox", { name: "Select Hero Cut v12.mp4", exact: true }).check();
  await expect(page.getByText("1 selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(
    page.getByRole("checkbox", { name: "Select Hero Cut v12.mp4", exact: true }),
  ).not.toBeChecked();
});

test("Filebox mobile suggested folders use compact free Item rows and navigate their records", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDrive(page, "filebox");
  const cards = page.locator(".ct-drive-suggested-item");
  await expect(cards).toHaveCount(4);
  for (const [index, expected] of [
    [0, [17, 211, 172, 74]],
    [1, [201, 211, 172, 74]],
    [2, [17, 297, 172, 74]],
    [3, [201, 297, 172, 74]],
  ] as const) {
    await expect
      .poll(async () => {
        const box = await cards.nth(index).boundingBox();
        return box && [box.x, box.y, box.width, box.height].map(Math.round);
      })
      .toEqual(expected);
  }
  await expect
    .poll(async () => Math.round((await page.locator(".ct-drive-table").boundingBox())!.y))
    .toBe(415);
  await cards.getByText("Brand Library", { exact: true }).click();
  await expect(page.getByRole("row").filter({ hasText: "Bricklane symbol.svg" })).toBeVisible();
  await expect(
    page.locator(".ct-drive-header").getByText("Brand Library", { exact: true }),
  ).toBeVisible();
});
