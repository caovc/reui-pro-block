import { expect, test } from "@playwright/test";
import { writeFile } from "node:fs/promises";

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`Flow2 creation toast leaves native Cancel reachable at ${viewport.width}`, async ({
    page,
  }, info) => {
    await page.setViewportSize(viewport);
    await page.goto("./#/preview/application/flow/flow-2");
    const nodes = page.locator(".flow-fidelity-node");
    await expect(nodes).toHaveCount(9);
    await page.evaluate(() => document.fonts.ready);

    const triage = page.locator('[data-flow-node="model"]');
    await triage.getByRole("button", { name: "Actions for Claude Sonnet 5", exact: true }).click();
    await page.getByRole("menuitem", { name: "Add branch", exact: true }).click();
    const path = page.getByRole("textbox", { name: "Path", exact: true });
    await expect(path).toHaveValue("New path");
    if (viewport.width === 390) {
      await expect(page.getByRole("dialog")).toBeVisible();
    } else {
      await expect(page.getByRole("complementary", { name: "New step details" })).toBeVisible();
    }

    const toast = page.locator("[data-sonner-toast]").filter({ hasText: /^Step created$/ });
    const cancel = page.getByRole("button", { name: "Cancel", exact: true });
    await expect(toast).toBeVisible();
    await expect(toast).toHaveAttribute("data-y-position", "top");
    await expect(toast).toHaveAttribute("data-x-position", "center");
    await expect(cancel).toBeVisible();
    await expect(cancel).toBeInViewport();

    // Read actual native geometry; do not move the pointer, stop the timer, or alter styles.
    const toastBefore = await toast.boundingBox();
    const cancelBefore = await cancel.boundingBox();
    expect(toastBefore).not.toBeNull();
    expect(cancelBefore).not.toBeNull();
    if (!toastBefore || !cancelBefore) throw new Error("Missing native toast/Cancel geometry");
    const cancelCenter = {
      x: cancelBefore.x + cancelBefore.width / 2,
      y: cancelBefore.y + cancelBefore.height / 2,
    };
    const toastContainsCancelCenter =
      cancelCenter.x >= toastBefore.x &&
      cancelCenter.x <= toastBefore.x + toastBefore.width &&
      cancelCenter.y >= toastBefore.y &&
      cancelCenter.y <= toastBefore.y + toastBefore.height;
    expect(toastContainsCancelCenter).toBe(false);
    expect(toastBefore.x).toBeGreaterThanOrEqual(0);
    expect(toastBefore.x + toastBefore.width).toBeLessThanOrEqual(viewport.width);

    const overflowBefore = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflowBefore.scrollWidth).toBeLessThanOrEqual(overflowBefore.clientWidth + 1);

    // Observe on both sides of the real click: expiry or forced dismissal cannot satisfy this case.
    await expect(toast).toBeVisible();
    const beforeClick = Date.now();
    await cancel.click();
    const afterClick = Date.now();
    await expect(toast).toBeVisible();
    const toastAfter = await toast.boundingBox();
    await expect(path).toHaveCount(0);
    await expect(nodes).toHaveCount(10);
    await expect(nodes.filter({ hasText: "New step" })).toHaveCount(1);
    if (viewport.width === 390) {
      await expect(page.getByRole("dialog")).toHaveCount(0);
    } else {
      await expect(page.getByRole("complementary")).toHaveCount(0);
    }

    const overflow = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));
    expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    await writeFile(
      info.outputPath(`flow2-toast-native-${viewport.width}.json`),
      JSON.stringify(
        {
          viewport,
          toastBefore,
          cancelBefore,
          cancelCenter,
          toastContainsCancelCenter,
          toastAfter,
          beforeClick,
          afterClick,
          observedToastVisibleBeforeAndAfterNativeCancel: true,
          nodeCountAfterCancel: await nodes.count(),
          overflowBefore,
          overflowAfter: overflow,
          forcedPointerOrContentOrFocus: false,
          toastDismissedOrExpiryAwaited: false,
        },
        null,
        2,
      ) + "\n",
    );
  });
}
