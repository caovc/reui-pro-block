import { expect, test } from "@playwright/test";
import { demoAvatar } from "../src/lib/demo-artwork";

const route = (entry: number) => `/#/preview/data-grid/grouping/data-grid-grouping-${entry}`;

test("editorial regrouping preserves the story's angle, author and dates", async ({ page }) => {
  await page.goto(route(6));
  const story = page.locator("tbody tr").filter({ hasText: "Cheap Money Ends" });
  for (const group of ["Stage", "Desk", "Issue"]) {
    await page
      .getByRole("radio", { name: group, exact: true })
      .or(page.getByRole("button", { name: group, exact: true }))
      .click();
    await expect(story).toContainText("Why regional lenders stopped underwriting the middle");
    await expect(story).toContainText("Alex Johnson");
    await expect(story.locator('time[datetime="2026-07-09"]')).toHaveText("09 Jul");
    await expect(story.locator('time[datetime="2026-08-07"]')).toHaveText("07 Aug");
  }
});

test("editorial grouping cannot change an existing story's rendered fields", async ({ page }) => {
  await page.goto(route(6));
  const story = page.locator("tbody tr").filter({ hasText: "Cheap Money Ends" });
  await expect(story).toBeVisible();
  const originalFields = await story.locator("td").allTextContents();
  await page
    .getByRole("radio", { name: "Desk", exact: true })
    .or(page.getByRole("button", { name: "Desk", exact: true }))
    .click();
  expect(await story.locator("td").allTextContents()).toEqual(originalFields);
});

test("editorial sorting changes one section and retains every story", async ({ page }) => {
  await page.goto(route(6));
  await expect(page.getByRole("table")).toHaveCount(4);
  const drafting = page.getByRole("region", { name: "Drafting stories", exact: true });
  const editing = page.getByRole("region", { name: "In Edit stories", exact: true });
  const editingOrder = await editing.locator("tbody tr").allTextContents();
  await drafting.getByRole("button", { name: "Story", exact: true }).click();
  await expect(drafting.locator('th[data-col-id="name"]')).toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  await expect(drafting.locator("tbody tr").first()).toContainText("Cheap Money Ends");
  await expect(editing.locator('th[data-col-id="name"]')).not.toHaveAttribute(
    "aria-sort",
    "ascending",
  );
  expect(await editing.locator("tbody tr").allTextContents()).toEqual(editingOrder);
  await expect(page.locator("tbody tr")).toHaveCount(13);
});

test("editorial search composes desk and placement facets and Clear restores all stories", async ({
  page,
}) => {
  await page.goto(route(6));
  await page.getByRole("button", { name: "Filter", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Business", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Lead", exact: true }).click();
  await page.keyboard.press("Escape");
  const rows = page.locator("tbody tr").filter({
    has: page.getByRole("button", { name: /^Actions for NR-/ }),
  });
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("The Repair Clause");
  await page.getByRole("textbox", { name: /Search/ }).fill("__absent_editorial_story__");
  await expect(page.getByText("No stories match", { exact: true })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(rows).toHaveCount(13);
});

test("editorial display applies column visibility and density to every section", async ({
  page,
}) => {
  await page.goto(route(6));
  const story = page.locator("tbody tr").filter({ hasText: "Cheap Money Ends" });
  const originalHeight = (await story.boundingBox())!.height;
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Angle", exact: true }).click();
  await page.getByRole("switch", { name: "Story Slug", exact: true }).uncheck();
  await page.getByRole("combobox", { name: /density/i }).click();
  await page.getByRole("option", { name: "Compact", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader", { name: "Angle", exact: true })).toHaveCount(0);
  await expect(story).not.toContainText("NR-1202");
  expect((await story.boundingBox())!.height).toBeLessThan(originalHeight);
  await expect(page.getByRole("columnheader", { name: "Story", exact: true })).toHaveCount(4);
});

test("delivery averages exclude unset completion and use the actual twelve engagements", async ({
  page,
}) => {
  await page.goto(route(7));
  await expect(page.getByRole("table")).toHaveCount(4);
  const discovery = page.getByRole("region", { name: "Discovery engagements", exact: true });
  await expect(discovery).toContainText("Avg 23%");
  const docker = discovery.locator("tbody tr").filter({ hasText: "Docker" });
  await expect(docker.getByRole("button", { name: "Name the Docker engagement" })).toBeVisible();
  await expect(docker).not.toContainText("0%");
  await expect(page.locator("tbody tr")).toHaveCount(12);
  await expect(page.locator("tbody tr").filter({ hasText: "Holiday Packaging" })).toContainText(
    "Launch Kit",
  );
  await expect(page.locator("tbody tr").filter({ hasText: "Investor Deck" })).toContainText(
    "Handoff",
  );
});

test("delivery stage selection preserves checked rows in other stages and hidden results", async ({
  page,
}) => {
  await page.goto(route(7));
  const discovery = page.getByRole("checkbox", {
    name: "Select every row in Discovery",
    exact: true,
  });
  const production = page.getByRole("checkbox", {
    name: "Select every row in In Production",
    exact: true,
  });
  await discovery.check();
  await expect(page.getByRole("status")).toHaveText("3 selected");
  await expect(production).not.toBeChecked();
  await production.check();
  await expect(page.getByRole("status")).toHaveText("7 selected");
  await discovery.uncheck();
  await expect(page.getByRole("status")).toHaveText("4 selected");
  await page.getByRole("textbox", { name: "Search engagements", exact: true }).fill("Stripe");
  await expect(page.getByRole("status")).toHaveText("4 selected");
  await page.getByRole("textbox", { name: "Search engagements", exact: true }).clear();
  await expect(production).toBeChecked();
  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(production).not.toBeChecked();
});

test("delivery shared sorting retains each engagement's crew", async ({ page }) => {
  await page.goto(route(7));
  const gemini = page.locator("tbody tr").filter({ hasText: "Gemini" });
  const crewGroup = gemini.getByLabel("Crew on the Gemini engagement");
  const portraits = crewGroup.locator('[data-slot="avatar-image"]');
  await expect(portraits).toHaveCount(3);
  for (const [index, name] of ["Sora Min", "Rina Holt", "Evren Blake"].entries()) {
    await expect(portraits.nth(index)).toHaveAttribute("src", demoAvatar(name));
  }
  await portraits.evaluateAll(async (images) => {
    await Promise.all(images.map((image) => (image as HTMLImageElement).decode()));
  });
  await expect(crewGroup.locator('[data-slot="avatar-group-count"]')).toHaveText("+1");
  const crew = await crewGroup.innerHTML();
  await page.getByRole("button", { name: "Client", exact: true }).first().click();
  await expect(page.locator('th[data-col-id="client"][aria-sort="ascending"]')).toHaveCount(4);
  await expect(
    page
      .getByRole("region", { name: "Discovery engagements", exact: true })
      .locator("tbody tr")
      .first(),
  ).toContainText("Docker");
  expect(await gemini.getByLabel("Crew on the Gemini engagement").innerHTML()).toEqual(crew);
  await page.getByRole("button", { name: "Crew", exact: true }).first().click();
  await expect(page.locator('th[data-col-id="crew"][aria-sort="ascending"]')).toHaveCount(4);
  const discoveryRows = page
    .getByRole("region", { name: "Discovery engagements", exact: true })
    .locator("tbody tr");
  await expect(discoveryRows.nth(0)).toContainText("Docker");
  await expect(discoveryRows.nth(1)).toContainText("Stripe");
  await expect(discoveryRows.nth(2)).toContainText("Gemini");
  expect(await gemini.getByLabel("Crew on the Gemini engagement").innerHTML()).toEqual(crew);
});

test("delivery stage visibility combines with search and restores through Show all", async ({
  page,
}) => {
  await page.goto(route(7));
  await page.getByRole("button", { name: "Stages", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Discovery", exact: true }).click();
  await page.getByRole("menuitemcheckbox", { name: "Client Review", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("table")).toHaveCount(2);
  await page.getByRole("textbox", { name: "Search engagements", exact: true }).fill("Stripe");
  await expect(page.getByRole("table")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await expect(page.locator("tbody tr")).toContainText("Holiday Packaging");
  await page.getByRole("button", { name: /Stages/ }).click();
  await page.getByRole("menuitem", { name: "Show all", exact: true }).click();
  await expect(page.locator("tbody tr")).toHaveCount(2);
  await page.getByRole("textbox", { name: "Search engagements", exact: true }).clear();
  await expect(page.locator("tbody tr")).toHaveCount(12);
});

test("delivery display changes every native table and restores from a real empty state", async ({
  page,
}) => {
  await page.goto(route(7));
  const row = page.locator("tbody tr").filter({ hasText: "Spring Menu Film" });
  const compactHeight = (await row.boundingBox())!.height;
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Completion", exact: true }).click();
  await page.getByRole("combobox", { name: "Row density", exact: true }).click();
  await page.getByRole("option", { name: "Roomy", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader", { name: "Completion", exact: true })).toHaveCount(0);
  expect((await row.boundingBox())!.height).toBeGreaterThan(compactHeight);
  await page
    .getByRole("textbox", { name: "Search engagements", exact: true })
    .fill("__absent_engagement__");
  await expect(page.getByText("No Matches", { exact: true })).toBeVisible();
  await expect(page.getByRole("table")).toHaveCount(0);
  await page.getByRole("textbox", { name: "Search engagements", exact: true }).clear();
  await expect(page.locator("tbody tr")).toHaveCount(12);
  await expect(page.getByRole("columnheader", { name: "Completion", exact: true })).toHaveCount(0);
});

for (const entry of [6, 7]) {
  test(`studio grouping ${entry} keeps phone content inside the document and scrolls the table`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route(entry));
    await expect(page.getByRole("table").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      390,
    );
    const viewport = page.locator('[data-slot="scroll-area-viewport"]').first();
    const box = (await viewport.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, Math.max(box.y + 50, 0));
    await page.mouse.wheel(500, 0);
    await expect.poll(() => viewport.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    expect(errors).toEqual([]);
  });
}
