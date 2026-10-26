import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("native board header file preserves the complete engine scene", async ({ page }) => {
  await page.goto("/#/preview/application/whiteboard/whiteboard-1");
  await expect(page.locator(".bricklane-whiteboard-engine")).toHaveAttribute("aria-busy", "false");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const saved = JSON.parse(
          localStorage.getItem("bricklane:whiteboard:whiteboard-1") || "null",
        );
        return saved?.elements?.length || 0;
      }),
    )
    .toBeGreaterThan(0);
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("bricklane:whiteboard:whiteboard-1")!),
  );
  await page.locator(".wb-header").getByRole("button", { name: "Export", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Save board file", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toMatch(/\.excalidraw$/);
  const exported = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(exported.type).toBe("excalidraw");
  expect(exported.elements).toEqual(stored.elements);
  expect(exported.files).toEqual(stored.files);
});
