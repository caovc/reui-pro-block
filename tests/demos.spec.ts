import { test, expect } from "@playwright/test";
import catalog from "../src/data/catalog.json" with { type: "json" };
const items = catalog.flatMap((c) => c.blocks);
function route(category: string, name?: RegExp) {
  const block = items.find(
    (b) => b.category === category && (!name || name.test(b.name)),
  )!;
  return `./#/preview/${block.group}/${block.category}/${block.id}`;
}
test("magic link form validates and changes to sent state", async ({
  page,
}) => {
  await page.goto(route("auth", /Centered Magic Link/));
  await page
    .getByLabel("Work email", { exact: true })
    .fill("preview@example.com");
  await page
    .getByRole("button", { name: "Send magic link", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Check your inbox" }),
  ).toBeVisible();
  await expect(
    page.getByText("We sent a secure sign-in link to preview@example.com."),
  ).toBeVisible();
  await page.getByRole("button", { name: "Back to sign in" }).click();
  await expect(page.getByLabel("Work email", { exact: true })).toBeVisible();
});
test("grid edit, search and bulk selection update visible records", async ({
  page,
}) => {
  await page.goto(route("editing"));
  await page.getByRole("button", { name: "New row", exact: true }).click();
  await page.locator("#record-name").fill("QA preview record");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await page
    .getByLabel("Search records", { exact: true })
    .fill("QA preview record");
  await expect(
    page.getByRole("button", { name: "QA preview record", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("checkbox", { name: "Select all visible records", exact: true })
    .check();
  await expect(page.getByText("1 selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("No records match your search.")).toBeVisible();
});
test("calendar creates a visible event", async ({ page }) => {
  await page.goto(route("event-calendar"));
  await page.getByRole("button", { name: /Add event|New event/ }).click();
  await page
    .getByLabel("Event title", { exact: true })
    .fill("QA release review");
  await page.getByLabel("Day", { exact: true }).fill("22");
  await page.getByRole("button", { name: "Create event", exact: true }).click();
  await expect(
    page.getByRole("button", { name: /QA release review/ }),
  ).toBeVisible();
});
test("AI composer sends a message and renders a demo answer", async ({
  page,
}) => {
  await page.goto(route("ai-chat"));
  await page
    .getByRole("textbox", { name: "Message", exact: true })
    .fill("Summarize the release checklist");
  await page.getByRole("button", { name: "Send message", exact: true }).click();
  await expect(
    page.getByText("Summarize the release checklist", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/Here’s your release summary/)).toBeVisible();
  await expect(
    page.getByRole("textbox", { name: "Message", exact: true }),
  ).toBeEmpty();
});
test("cart quantities update the order total", async ({ page }) => {
  await page.goto(route("shopping-cart"));
  const before = await page.locator(".isolated-preview").innerText();
  const increase = page
    .getByRole("button", { name: /Increase|Add one/ })
    .first();
  await increase.click();
  await expect
    .poll(async () => await page.locator(".isolated-preview").innerText())
    .not.toBe(before);
});
test("FAQ categories and accordion expose selected answers", async ({
  page,
}) => {
  await page.goto(route("faq"));
  await page.getByRole("tab", { name: "Licensing", exact: true }).click();
  await expect(
    page.getByRole("button", {
      name: "Can one team use ReUI across multiple products?",
    }),
  ).toBeVisible();
  const question = page.getByRole("button", {
    name: "Can one team use ReUI across multiple products?",
  });
  await expect(question).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("region", {
      name: "Can one team use ReUI across multiple products?",
    }),
  ).toContainText(/license|products|projects/i);
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "false");
  await question.click();
  await expect(question).toHaveAttribute("aria-expanded", "true");
});

test("virtual grid windows 1200 rows as the scroll position changes", async ({
  page,
}) => {
  await page.goto(route("virtualization"));
  await expect(
    page.getByText("Rows 1–16 of 1,200 · Scroll to browse"),
  ).toBeVisible();
  const mountedBefore = await page.locator("tbody tr").count();
  expect(mountedBefore).toBeLessThan(25);
  await page
    .locator("div.overflow-auto")
    .filter({ has: page.locator("table") })
    .first()
    .evaluate((element) => {
      element.scrollTop = 5600;
      element.dispatchEvent(new Event("scroll"));
    });
  await expect(page.getByText(/Rows 98–113 of 1,200/)).toBeVisible();
  expect(await page.locator("tbody tr").count()).toBeLessThan(25);
});

test("whiteboard draws shapes with undo, redo and SVG export", async ({
  page,
}) => {
  await page.goto(route("whiteboard", /Design Review/));
  const canvas = page.getByRole("application", {
    name: "Checkout Review drawing canvas",
  });
  await expect(canvas).toBeVisible();
  const before = await canvas.locator("[data-shape]").count();
  await page.getByRole("radio", { name: "Rectangle", exact: true }).click();
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.5, box.y + box.height * 0.6, {
    steps: 5,
  });
  await page.mouse.up();
  await expect(canvas.locator("[data-shape]")).toHaveCount(before + 1);
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  await expect(canvas.locator("[data-shape]")).toHaveCount(before);
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await expect(canvas.locator("[data-shape]")).toHaveCount(before + 1);
  await page.getByRole("button", { name: "Export", exact: true }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "Export SVG", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("Checkout Review.svg");
});

test("sprint planning updates capacity, linked decisions and presentation", async ({
  page,
}) => {
  await page.goto(route("whiteboard", /Sprint Planning/));
  await expect(page.getByText("26 of 31 pts", { exact: true })).toBeVisible();
  const card = page.locator('[data-shape="story-0-0"]');
  await card.click();
  await page.getByRole("button", { name: "Estimate", exact: true }).click();
  await page.getByRole("radio", { name: "8", exact: true }).click();
  await page.getByRole("button", { name: "Reveal votes", exact: true }).click();
  await page.getByRole("button", { name: "Use 8 points", exact: true }).click();
  await expect(page.getByText("29 of 31 pts", { exact: true })).toBeVisible();
  await expect(card).toContainText("8 pts");
  await expect(page.getByRole("dialog")).toBeHidden();
  await card.click();
  const bounds = (await card.boundingBox())!;
  const scale = await page
    .locator(".wb-canvas")
    .evaluate((element) => (element as SVGSVGElement).getScreenCTM()!.a);
  await page.mouse.move(
    bounds.x + bounds.width / 2,
    bounds.y + bounds.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(
    bounds.x + bounds.width / 2 + 1050 * scale,
    bounds.y + bounds.height / 2,
    { steps: 12 },
  );
  await page.mouse.up();
  await expect(page.getByText("21 of 31 pts", { exact: true })).toBeVisible();
  await expect(page.getByText("19 pts parked", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add to log", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Apple Pay sheet · 8 pts",
  );
  await page
    .getByRole("button", { name: "Mark done", exact: true })
    .last()
    .click();
  await expect(
    page.getByRole("button", { name: "Done", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: "Plan", exact: true }).click();
  await page
    .getByRole("button", { name: "Add a card to Receipts", exact: true })
    .click();
  await page
    .getByLabel("Shape text", { exact: true })
    .fill("Tax receipt\n3 pts");
  await page.getByRole("button", { name: "Save text", exact: true }).click();
  await expect(page.getByText("24 of 31 pts", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Present", exact: true }).click();
  await expect(page.locator(".wb-root")).toHaveAttribute(
    "data-presenting",
    "true",
  );
  await expect(
    page.getByText("Presenting · Sprint Goal, 1 of 6", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next frame", exact: true }).click();
  await expect(
    page.getByText("Presenting · Risks, 2 of 6", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "End", exact: true }).click();
  await expect(page.locator(".wb-root")).toHaveAttribute(
    "data-presenting",
    "false",
  );
});

for (const [id, name, panelLabel, cardId] of [
  ["whiteboard-1", "Checkout Review", "Board panel", "goal0"],
  ["whiteboard-2", "Sprint 42 Planning", "Planning panel", "story-0-0"],
]) {
  test(`${id} keeps notes readable and supports panning on a phone`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 720 });
    await page.goto(`./#/preview/application/whiteboard/${id}`);
    await page.getByRole("button", { name: panelLabel, exact: true }).click();
    const canvas = page.getByRole("application", {
      name: `${name} drawing canvas`,
    });
    const card = page.locator(`[data-shape="${cardId}"]`);
    await expect
      .poll(async () => (await card.boundingBox())?.width || 0)
      .toBeGreaterThan(130);
    const before = (await card.boundingBox())!;
    await page.getByRole("radio", { name: "Hand", exact: true }).click();
    await page.mouse.move(230, 590);
    await page.mouse.down();
    await page.mouse.move(280, 620, { steps: 6 });
    await page.mouse.up();
    await expect
      .poll(async () => (await card.boundingBox())!.x - before.x)
      .toBeGreaterThan(45);
    await expect(canvas).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(390);
  });
}
