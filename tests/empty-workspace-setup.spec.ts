import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

const route = (id: number) => `./#/preview/application/empty-state/empty-state-${id}`;

for (const width of [1440, 390]) {
  test(`empty11–14 keep distinct public topologies without document overflow at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (let id = 11; id <= 14; id++) {
      await page.goto(route(id));
      await expect(page.locator(`[data-empty-variant="${id}"]`)).toBeVisible();
      await expect(page.locator('[data-slot="icon-stack"]')).toHaveCount(1);
      await expect(page.getByRole("dialog")).toHaveCount(0);
      expect(await page.locator("vite-error-overlay").count()).toBe(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `empty${id}`,
      ).toBeLessThanOrEqual(width);
      if (id === 11) {
        await expect(page.locator('[data-slot="card"]')).toHaveCount(1);
        await expect(page.locator('[data-slot="empty"]').getByRole("button")).toHaveCount(0);
      }
      if (id === 12)
        await expect(page.getByRole("button", { name: "Execute", exact: true })).toBeVisible();
      if (id === 13) {
        expect(
          await page
            .locator(".empty-workspace-connectors")
            .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length),
        ).toBe(width === 1440 ? 4 : 1);
        for (const name of ["Dropbox", "Cloudflare R2", "Google Drive", "Microsoft OneDrive"])
          await expect(
            page.getByRole("button", { name: `Connect ${name}`, exact: true }).locator("img"),
          ).toHaveAttribute("src", /^data:image\/svg\+xml,/);
      }
      if (id === 14) await expect(page.locator('[data-slot="frame-panel-footer"]')).toHaveCount(1);
    }
    expect(errors).toEqual([]);
  });
}

test("signal creation keeps trigger/destination and its switch pauses the actual local rule", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(route(11));
  await page.getByRole("button", { name: "Add signal", exact: true }).click();
  await page.getByLabel("Signal name", { exact: true }).fill("QA release intake");
  await page.getByRole("combobox").nth(0).click();
  await page.getByRole("option", { name: "Task created", exact: true }).click();
  await page.getByRole("combobox").nth(1).click();
  await page.getByRole("option", { name: "Review queue", exact: true }).click();
  await page.getByRole("button", { name: "Create local signal", exact: true }).click();
  await expect(page.getByText("Task created → Review queue", { exact: true })).toBeVisible();
  await page
    .getByRole("switch", { name: "Activate signal QA release intake", exact: true })
    .uncheck();
  await expect(page.getByText("Paused locally", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Reset signals", exact: true }).click();
  await expect(page.getByText("Create signals to route new work", { exact: true })).toBeVisible();
});

test("export audience/workspace filters drive visible rows and the actual CSV download", async ({
  page,
}) => {
  await page.goto(route(12));
  await page.getByRole("button", { name: "Audience: Everyone", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Finance reviewers", exact: true }).click();
  await page.getByRole("button", { name: "Workspace: All workspaces", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Harbor field", exact: true }).click();
  await page.getByRole("button", { name: "Execute", exact: true }).click();
  await expect(page.getByRole("cell", { name: "Lana Steiner", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Olivia Rhye", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Open download options", exact: true }).click();
  const pending = page.waitForEvent("download");
  await page.getByRole("menuitem", { name: "CSV bundle", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("activity-bundle.csv");
  const csv = await readFile((await download.path())!, "utf8");
  expect(csv).toContain('"Lana Steiner","Finance reviewers","Harbor field"');
  expect(csv).not.toContain("Olivia Rhye");
});

test("the actual free calendar preset applies a custom window and changes empty results on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(route(12));
  await page.getByRole("button", { name: "Date range: Last 30 days", exact: true }).click();
  await page.getByRole("menuitemradio", { name: "Custom window", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Apply custom window", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Choose custom date range", exact: true }).click();
  await expect(page.getByRole("grid")).toBeVisible();
  await expect
    .poll(async () => {
      const bounds = await page.locator('[data-slot="popover-content"]').boundingBox();
      return !!bounds && bounds.y >= 0 && bounds.y + bounds.height <= 900;
    })
    .toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole("button", { name: "Today", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Apply custom window", exact: true }).click();
  await page.getByRole("button", { name: "Execute", exact: true }).click();
  await expect(
    page.getByText("No example records match this filter window.", { exact: false }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Date range: Custom window", exact: true }),
  ).toBeVisible();
});

test("PDF brief provides honest printable HTML with the selected activity summary", async ({
  page,
}) => {
  await page.goto(route(12));
  await page.getByRole("button", { name: "Open download options", exact: true }).click();
  await page.getByRole("menuitem", { name: "PDF brief", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("No PDF generation service is connected");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download printable brief", exact: true }).click();
  const download = await pending;
  expect(download.suggestedFilename()).toBe("activity-brief.html");
  const html = await readFile((await download.path())!, "utf8");
  expect(html).toContain("<!doctype html>");
  expect(html).toContain("Olivia Rhye");
  expect(html).toContain("Everyone · All workspaces · Last 30 days");
});

test("scheduled delivery is an explicit local draft with the entered recipient and frequency", async ({
  page,
}) => {
  await page.goto(route(12));
  await page.getByRole("button", { name: "Open download options", exact: true }).click();
  await page.getByRole("menuitem", { name: "Schedule delivery", exact: true }).click();
  await page.getByLabel("Delivery email", { exact: true }).fill("qa-delivery@example.com");
  await page.getByRole("combobox").click();
  await page.getByRole("option", { name: "Monthly on the first", exact: true }).click();
  await page.getByRole("button", { name: "Save local delivery draft", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "qa-delivery@example.com · Monthly on the first",
  );
  await expect(page.getByRole("alert")).toContainText("No email has been sent");
});

test("storage connectors keep independent local folder names and disconnect back to empty", async ({
  page,
}) => {
  await page.goto(route(13));
  await page.getByRole("button", { name: "Connect Dropbox", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("No external account is authorized");
  await page.getByLabel("Folder name", { exact: true }).fill("Quarterly packets");
  await page.getByRole("button", { name: "Connect local sample folder", exact: true }).click();
  await page.getByRole("button", { name: "Connect Google Drive", exact: true }).click();
  await page.getByLabel("Folder name", { exact: true }).fill("Product research");
  await page.getByRole("button", { name: "Connect local sample folder", exact: true }).click();
  await expect(
    page.getByText("Quarterly packets · Read-only sample folder", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Product research · Read-only sample folder", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Disconnect Dropbox", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Google Drive", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Disconnect Google Drive", exact: true }).click();
  await expect(page.getByText("No file sources are linked", { exact: true })).toBeVisible();
});

test("storage connector columns follow their container, including a narrow desktop column", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(route(13));
  const pageContainer = page.locator(".empty-workspace-page");
  const columns = () =>
    page
      .locator(".empty-workspace-connectors")
      .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(" ").length);
  await expect(pageContainer).toBeVisible();
  await pageContainer.evaluate((element) => {
    element.style.width = "600px";
  });
  await expect.poll(columns).toBe(2);
  await pageContainer.evaluate((element) => {
    element.style.width = "380px";
  });
  await expect.poll(columns).toBe(1);
});

test("organization help exposes the observed public tooltip through keyboard focus", async ({
  page,
}) => {
  await page.goto(route(14));
  await page.getByRole("button", { name: "Enable organizations", exact: true }).focus();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("tooltip")).toContainText(
    "Organizations group users, teams, roles, and permissions under one account boundary.",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Learn more about Organizations", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("never creates an account");
});

test("organization setup preserves its name/ID and changes only local permission checkboxes", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(route(14));
  await page.getByRole("button", { name: "Enable organizations", exact: true }).click();
  await page.getByLabel("Organization name", { exact: true }).fill("QA review workspace");
  await page.getByLabel("Organization ID", { exact: true }).fill("qa-review");
  await page.getByRole("button", { name: "Enable locally", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "QA review workspace", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Organization ID: qa-review", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("checkbox", { name: "Owner manage members", exact: true }),
  ).toBeDisabled();
  await page.getByRole("checkbox", { name: "Reviewer edit content", exact: true }).check();
  await expect(
    page.getByRole("checkbox", { name: "Reviewer edit content", exact: true }),
  ).toBeChecked();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await page.getByRole("button", { name: "Disable local organizations", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Enable organizations", exact: true }),
  ).toBeVisible();
});

test("final Empty source defaults and real starter ZIP preserve actual free calendar/frame sources", async ({
  page,
}) => {
  const modules = ["signals", "exports", "storage", "organizations"];
  for (let id = 11; id <= 14; id++) {
    await page.goto(`./#/block/application/empty-state/empty-state-${id}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      `src/blocks/application/empty-variants/workspace-setup/${modules[id - 11]}.tsx`,
    );
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
  }
  await page.goto("./#/block/application/empty-state/empty-state-14");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await pending;
  const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const path of [
    "src/blocks/application/empty-variants/workspace-setup/organizations.tsx",
    "src/blocks/application/empty-variants/workspace-setup/free/range-picker.tsx",
    "src/components/reui/icon-stack.tsx",
    "src/components/reui/frame.tsx",
    "src/components/ui/tooltip.tsx",
    "src/components/ui/calendar.tsx",
    "src/lib/demo-artwork.ts",
    "src/components/reui/REUI-LICENSE.txt",
  ])
    expect(files[path], path).toBeDefined();
  expect(
    strFromU8(files["src/blocks/application/empty-variants/workspace-setup/free/range-picker.tsx"]),
  ).toContain("Official free REUI c-calendar-29");
});
