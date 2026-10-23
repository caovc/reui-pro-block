import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

const route = (id: number) => `./#/preview/application/empty-state/empty-state-${id}`;

for (const width of [1440, 390]) {
  test(`empty1–5 preserve initial topology and no document overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (let id = 1; id <= 5; id++) {
      await page.goto(route(id));
      await expect(page.locator(`[data-empty-variant="${id}"]`)).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      expect(await page.locator("vite-error-overlay").count()).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `empty${id}`,
      ).toBeLessThanOrEqual(width);
      if (id === 1) await expect(page.getByText("Quick guides", { exact: true })).toBeVisible();
      if (id === 2)
        await expect(
          page.getByRole("button", { name: '"meeting transcript"', exact: true }),
        ).toBeVisible();
      if (id === 3) await expect(page.getByText("Quick starts", { exact: true })).toBeVisible();
      if (id === 4) {
        await expect(page.getByTestId("report-preview")).toBeEmpty();
        await expect(page.locator('[data-slot="frame"]')).toHaveCount(0);
      }
      if (id === 5) {
        await expect(page.getByTestId("brief-preview")).toBeEmpty();
        await expect(page.locator('[data-slot="frame"]')).toHaveCount(1);
      }
    }
    expect(errors).toEqual([]);
  });
}

test("actual free upload hook imports CSV quoted commas, escaped quotes, and multiline fields", async ({
  page,
}) => {
  await page.goto(route(1));
  await page.getByLabel("Upload records CSV").setInputFiles({
    name: "people.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      'Name,Notes,Team\r\n"Rhye, Olivia","Said ""ready""\non Monday",Design\r\nPhoenix,Available,Engineering',
    ),
  });
  await expect(page.getByRole("cell", { name: "Rhye, Olivia", exact: true })).toBeVisible();
  await expect(
    page.getByRole("cell", { name: 'Said "ready" on Monday', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("2 records · people.csv · Local preview only", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Clear records", exact: true }).click();
  await expect(page.getByText("Your record space is empty", { exact: true })).toBeVisible();
});

test("CSV structure and actual free hook file-size errors leave empty state intact", async ({
  page,
}) => {
  await page.goto(route(1));
  const input = page.getByLabel("Upload records CSV");
  await input.setInputFiles({
    name: "broken.csv",
    mimeType: "text/csv",
    buffer: Buffer.from('Name,Team\n"Missing quote,Design'),
  });
  await expect(page.getByRole("alert")).toContainText("missing its closing quote");
  await expect(page.getByRole("table")).toHaveCount(0);
  await input.setInputFiles({
    name: "large.csv",
    mimeType: "text/csv",
    buffer: Buffer.alloc(1024 * 1024 + 1, "a"),
  });
  await expect(page.getByRole("alert")).toContainText(/maximum size|too large|exceeds/i);
});

test("record guide and sample connection work without requesting external credentials", async ({
  page,
}) => {
  await page.goto(route(1));
  await page.getByRole("button", { name: "CSV setup", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Quoted commas");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Connect source", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("No credentials or external account access");
  await page.getByRole("button", { name: "Connect sample directory", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Olivia Rhye", exact: true })).toBeVisible();
  await expect(
    page.getByText("3 records · Sample directory · Local preview only", { exact: true }),
  ).toBeVisible();
});

test("search suggestions, controlled filters, and file detail are functional on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(route(2));
  await page.getByRole("button", { name: '"meeting transcript"', exact: true }).click();
  await expect(page.getByLabel("Search library")).toHaveValue('"meeting transcript"');
  await page.getByRole("button", { name: /Meeting transcript Product review/ }).click();
  await expect(page.getByRole("dialog")).toContainText("No document service is connected");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByLabel("Refine filters", { exact: true }).click();
  await page.getByLabel("Transcripts", { exact: true }).uncheck();
  await page.getByRole("button", { name: "Apply filters", exact: true }).click();
  await expect(page.getByText("No files match these filters.", { exact: false })).toBeVisible();
  await page.getByLabel("Search library").fill("launch-plan");
  await expect(page.getByRole("button", { name: /Launch plan Launch checklist/ })).toBeVisible();
});

test("quick-start project uses selected template and custom project name", async ({ page }) => {
  await page.goto(route(3));
  await page.getByRole("button", { name: "Sprint tracker", exact: true }).click();
  await page.getByLabel("Project name", { exact: true }).fill("QA release sprint");
  await page.getByRole("button", { name: "Create project", exact: true }).click();
  await expect(page.getByRole("heading", { name: "QA release sprint", exact: true })).toBeVisible();
  await expect(page.getByText("Prioritize sprint backlog", { exact: true })).toBeVisible();
  await expect(page.getByText("Assign task owners", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Reset project", exact: true }).click();
  await expect(page.getByText("No projects to show", { exact: true })).toBeVisible();
});

test("report empty screenshot slot populates sample and custom typed report on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(route(4));
  await page.getByRole("button", { name: "View sample", exact: true }).click();
  await expect(page.getByTestId("report-preview")).toContainText("Workspace performance");
  await page.getByRole("button", { name: "Add report", exact: true }).click();
  await page.getByLabel("Report name", { exact: true }).fill("QA pipeline review");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Opportunity pipeline", exact: true }).click();
  await page.getByRole("button", { name: "Create report", exact: true }).click();
  await expect(page.getByTestId("report-preview")).toContainText("QA pipeline review");
  await expect(page.getByTestId("report-preview")).toContainText("Opportunity pipeline");
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("actual Frame brief selects signals and saves typed local content", async ({ page }) => {
  await page.goto(route(5));
  await page.getByRole("button", { name: "Browse Signals", exact: true }).click();
  await page.getByLabel("Customer feedback", { exact: false }).check();
  await page.getByRole("button", { name: "Use 1 selected signals", exact: true }).click();
  await page.getByLabel("Brief title", { exact: true }).fill("QA weekly brief");
  await page
    .getByLabel("Review notes", { exact: true })
    .fill("Ship after reviewing the mobile workflow.");
  await page.getByRole("button", { name: "Save brief draft", exact: true }).click();
  const preview = page.getByTestId("brief-preview");
  await expect(preview).toContainText("QA weekly brief");
  await expect(preview).toContainText("Ship after reviewing the mobile workflow.");
  await expect(preview).toContainText("Customer feedback");
  await expect(preview).not.toContainText("Launch readiness");
});

test("Empty source viewer opens actual modules and starter ZIP preserves real free sources", async ({
  page,
}) => {
  const modules = ["data-import", "search", "project", "reports", "brief"];
  for (let id = 1; id <= 5; id++) {
    await page.goto(`./#/block/application/empty-state/empty-state-${id}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      `src/blocks/application/empty-variants/${modules[id - 1]}.tsx`,
    );
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
  }
  await page.goto("./#/block/application/empty-state/empty-state-1");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await pending;
  const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const path of [
    "src/blocks/application/empty-variants/data-import.tsx",
    "src/blocks/application/empty-variants/free/stacked-cards.tsx",
    "src/blocks/application/empty-variants/first-run/csv.ts",
    "src/blocks/application/empty-variants/first-run/first-run.css",
    "src/hooks/use-file-upload.ts",
    "src/components/ui/empty.tsx",
    "src/components/reui/REUI-LICENSE.txt",
  ])
    expect(files[path], path).toBeDefined();
  expect(strFromU8(files["src/hooks/use-file-upload.ts"])).toContain("export const useFileUpload");
  expect(
    strFromU8(files["src/blocks/application/empty-variants/free/stacked-cards.tsx"]),
  ).toContain("Official REUI free example c-empty-15");
});
