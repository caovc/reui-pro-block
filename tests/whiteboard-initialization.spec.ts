import { test, expect, type Route } from "@playwright/test";

for (const kind of [1, 2]) {
  test(`whiteboard-${kind} rejects edits until slow-font initialization finishes`, async ({
    page,
  }) => {
    const held: Route[] = [];
    let released = false;
    await page.route("**/excalidraw/fonts/**", (route) => {
      if (released) return route.continue();
      held.push(route);
    });
    try {
      await page.goto(`/#/preview/application/whiteboard/whiteboard-${kind}`, {
        waitUntil: "domcontentloaded",
      });
      await expect.poll(() => held.length).toBeGreaterThanOrEqual(2);
      await expect(page.getByRole("status").filter({ hasText: "Loading board" })).toBeVisible();
      await expect(page.locator(".wb-root")).toHaveAttribute("aria-busy", "true");
      const edit =
        kind === 1
          ? page.getByRole("button", { name: "Shape library", exact: true })
          : page.getByRole("button", { name: "Add a card to Receipts", exact: true });
      await expect(edit).toBeDisabled();
      expect(
        await page.evaluate(
          (id) => localStorage.getItem(`bricklane:whiteboard:whiteboard-${id}`),
          kind,
        ),
      ).toBeNull();
      released = true;
      await Promise.all(held.map((route) => route.continue()));
      await expect(page.locator(".wb-root")).toHaveAttribute("aria-busy", "false");
      await expect(edit).toBeEnabled();
      await expect(page.getByRole("radio", { name: "Selection", exact: true })).toBeChecked();
      if (kind === 1) {
        await edit.click();
        await page.getByRole("button", { name: "Add sticky note", exact: true }).click();
      } else {
        await edit.click();
        await page.getByLabel("Shape text", { exact: true }).fill("Ready receipt\n3 pts");
        await page.getByRole("button", { name: "Save text", exact: true }).click();
        await expect(page.getByText("29 of 31 pts", { exact: true })).toBeVisible();
      }
      await expect
        .poll(() =>
          page.evaluate((id) => {
            const scene = JSON.parse(
              localStorage.getItem(`bricklane:whiteboard:whiteboard-${id}`) || "null",
            );
            return (
              scene?.elements?.some(
                (element: { type: string; originalText?: string }) =>
                  element.type === "text" &&
                  element.originalText?.includes(id === 1 ? "Add your idea here" : "Ready receipt"),
              ) || false
            );
          }, kind),
        )
        .toBe(true);
    } finally {
      if (!released) {
        released = true;
        await Promise.all(held.map((route) => route.continue().catch(() => {})));
      }
    }
  });
}
