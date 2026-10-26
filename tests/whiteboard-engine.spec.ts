import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const route = (kind = 1) => `/#/preview/application/whiteboard/whiteboard-${kind}`;
async function savedScene(page: Page, kind = 1) {
  return page.evaluate(
    (id) => JSON.parse(localStorage.getItem(`bricklane:whiteboard:whiteboard-${id}`) || "null"),
    kind,
  );
}
async function openBoard(page: Page, kind = 1) {
  await page.goto(route(kind));
  const canvas = page.locator(".bricklane-whiteboard-engine canvas.interactive");
  await expect(canvas).toBeVisible();
  await expect
    .poll(async () => Boolean((await savedScene(page, kind))?.elements?.length))
    .toBe(true);
  return canvas;
}

test("Excalidraw creates, selects, resizes and undoes a native element", async ({ page }) => {
  const canvas = await openBoard(page);
  const originalScene = await savedScene(page);
  const originalIds = new Set(originalScene.elements.map((item: { id: string }) => item.id));
  const before = originalScene.elements.filter(
    (item: { isDeleted: boolean }) => !item.isDeleted,
  ).length;
  await page.getByRole("radio", { name: "Rectangle", exact: true }).click();
  const box = (await canvas.boundingBox())!;
  const start = { x: box.x + box.width * 0.44, y: box.y + box.height * 0.73 };
  await page.mouse.move(start.x, start.y);
  await page.mouse.down();
  await page.mouse.move(start.x + 160, start.y + 90, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(
      async () =>
        (await savedScene(page)).elements.filter((item: { isDeleted: boolean }) => !item.isDeleted)
          .length,
    )
    .toBe(before + 1);
  const createdScene = await savedScene(page);
  const created = createdScene.elements.find(
    (item: { id: string; isDeleted: boolean }) => !item.isDeleted && !originalIds.has(item.id),
  );
  expect(created.type).toBe("rectangle");
  const handle = {
    x:
      box.x +
      (created.x + created.width + createdScene.appState.scrollX) *
        createdScene.appState.zoom.value +
      4,
    y:
      box.y +
      (created.y + created.height + createdScene.appState.scrollY) *
        createdScene.appState.zoom.value +
      4,
  };
  await page.mouse.move(handle.x, handle.y);
  await page.mouse.down();
  await page.mouse.move(handle.x + 48, handle.y + 30, { steps: 8 });
  await page.mouse.up();
  await expect
    .poll(
      async () =>
        (await savedScene(page)).elements.find((item: { id: string }) => item.id === created.id)
          .width,
    )
    .toBeGreaterThan(created.width + 60);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await savedScene(page)).elements.find((item: { id: string }) => item.id === created.id)
          .width,
    )
    .toBeCloseTo(created.width, 1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await savedScene(page)).elements.filter((item: { isDeleted: boolean }) => !item.isDeleted)
          .length,
    )
    .toBe(before);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect
    .poll(
      async () =>
        (await savedScene(page)).elements.filter((item: { isDeleted: boolean }) => !item.isDeleted)
          .length,
    )
    .toBe(before + 1);
  await page.reload();
  await expect(canvas).toBeVisible();
  await expect
    .poll(
      async () =>
        (await savedScene(page)).elements.filter((item: { isDeleted: boolean }) => !item.isDeleted)
          .length,
    )
    .toBe(before + 1);
});

test("native drawing inspector changes stroke weight, with fonts served locally", async ({
  page,
}) => {
  const externalFonts: string[] = [];
  const localFonts: number[] = [];
  page.on("request", (request) => {
    if (request.url().includes("esm.run") || request.url().includes("unpkg.com"))
      externalFonts.push(request.url());
  });
  page.on("response", (response) => {
    if (response.url().includes("/excalidraw/fonts/") && response.url().includes("woff2"))
      localFonts.push(response.status());
  });
  await openBoard(page);
  await page.getByRole("radio", { name: "Rectangle", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Selected shape actions", exact: true }),
  ).toBeAttached();
  await page.getByTitle("Extra bold", { exact: true }).click();
  await expect(page.getByTitle("Extra bold", { exact: true }).getByRole("radio")).toBeChecked();
  expect(externalFonts).toEqual([]);
  expect(localFonts.length).toBeGreaterThan(0);
  expect(localFonts.filter((status) => status === 200).length).toBeGreaterThanOrEqual(2);
  // Native export/font registration can revalidate the two successfully preloaded local fonts.
  expect(localFonts.every((status) => status === 200 || status === 304)).toBe(true);
  expect(
    await page.evaluate(() => {
      const faces = [...document.fonts];
      return (
        faces.some(
          (face) =>
            face.family === "Excalifont" && face.weight === "400" && face.status === "loaded",
        ) &&
        faces.some(
          (face) => face.family === "Nunito" && face.weight === "500" && face.status === "loaded",
        )
      );
    }),
  ).toBe(true);
});

test("native board, SVG and PNG exports contain real elements and roundtrip through open", async ({
  page,
}) => {
  await openBoard(page);
  await page.getByRole("button", { name: "Board menu", exact: true }).click();
  const downloadFile = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Save board", exact: true }).click();
  const download = await downloadFile;
  expect(download.suggestedFilename()).toMatch(/\.excalidraw$/);
  const content = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(content.type).toBe("excalidraw");
  expect(content.elements.some((item: { type: string }) => item.type === "text")).toBe(true);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const svgFile = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export SVG", exact: true }).click();
  expect(await readFile((await (await svgFile).path())!, "utf8")).toContain("<svg");
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const pngFile = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export PNG", exact: true }).click();
  const png = await readFile((await (await pngFile).path())!);
  expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
  await page.getByRole("button", { name: "Board menu", exact: true }).click();
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("menuitem", { name: "Open board file", exact: true }).click();
  await (await chooser).setFiles((await download.path())!);
  await expect(page.getByText("Board opened", { exact: true })).toBeVisible();
});

for (const width of [1440, 390]) {
  test(`both whiteboards render and pan within ${width}px without engine errors`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const kind of [1, 2]) {
      const canvas = await openBoard(page, kind);
      if (width < 640)
        await page
          .getByRole("button", { name: kind === 1 ? "Board panel" : "Planning panel", exact: true })
          .click();
      const previous = await savedScene(page, kind);
      await page.getByRole("radio", { name: "Hand", exact: true }).click();
      const box = (await canvas.boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.8);
      await page.mouse.down();
      await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height * 0.8 + 25, {
        steps: 5,
      });
      await page.mouse.up();
      await expect
        .poll(async () => (await savedScene(page, kind)).appState.scrollX)
        .not.toBe(previous.appState.scrollX);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        width,
      );
    }
    expect(errors).toEqual([]);
  });
}

test("native canvas follows the host's dark theme without changing scene colors", async ({
  page,
}) => {
  await page.goto(`${route()}?theme=dark`);
  await expect(page.locator(".bricklane-whiteboard-engine .excalidraw")).toHaveClass(/theme--dark/);
  await expect.poll(async () => Boolean((await savedScene(page))?.elements?.length)).toBe(true);
  const note = (await savedScene(page)).elements.find(
    (item: { id: string }) => item.id === "goal0",
  );
  expect(note.backgroundColor).toBe("#fff0a5");
});

test("first-load text metrics match the locally loaded drawing fonts", async ({ page }) => {
  for (const kind of [1, 2]) {
    await openBoard(page, kind);
    const metrics = await page.evaluate(async (id) => {
      await document.fonts.ready;
      const scene = JSON.parse(localStorage.getItem(`bricklane:whiteboard:whiteboard-${id}`)!);
      const context = document.createElement("canvas").getContext("2d")!;
      return scene.elements
        .filter(
          (element: { type: string; fontFamily: number }) =>
            element.type === "text" && [5, 6].includes(element.fontFamily),
        )
        .map(
          (element: {
            id: string;
            text: string;
            width: number;
            fontSize: number;
            fontFamily: number;
          }) => {
            context.font = `${element.fontSize}px ${element.fontFamily === 5 ? "Excalifont" : "Nunito"}`;
            return {
              id: element.id,
              width: element.width,
              measured: Math.max(
                ...element.text.split("\n").map((line) => context.measureText(line).width),
              ),
            };
          },
        );
    }, kind);
    expect(metrics.length).toBeGreaterThan(10);
    for (const metric of metrics)
      expect(Math.abs(metric.width - metric.measured), `native text ${metric.id}`).toBeLessThan(1);
  }
});
