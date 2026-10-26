import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { unzipSync, strFromU8 } from "fflate";
import { expect, test, type Page } from "@playwright/test";

async function openSection(page: Page, section: string) {
  await page.goto("/#/template-preview/lucent");
  await page.getByRole("button", { name: "Infrastructure", exact: true }).click();
  await page.getByRole("button", { name: section, exact: true }).click();
}
async function returnTo(page: Page, section: string) {
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: section, exact: true }).click();
}

test("Lucent cluster tree matches all four regions and the 20-cluster capacity", async ({
  page,
}) => {
  await openSection(page, "Clusters");
  await expect(page.getByText("976 vCPU", { exact: true })).toBeVisible();
  await expect(page.getByText("6,056 vCPU", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "prod-us-1", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Expand all", exact: true }).click();
  await expect(page.getByRole("button", { name: "prod-us-1", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "sandbox-sa-1", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Collapse all", exact: true }).click();
  await expect(page.getByRole("button", { name: "prod-eu-1", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Display", exact: true }).click();
  await page.getByRole("checkbox", { name: "Growth", exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("columnheader", { name: "Growth", exact: true })).toHaveCount(0);
  await expect(page.locator("tfoot")).not.toContainText("110%");
});

test("Lucent node-pool provisioning changes real capacity and retains its policy", async ({
  page,
}) => {
  await openSection(page, "Clusters");
  await page.getByRole("button", { name: "Create cluster", exact: true }).click();
  await page.getByLabel("Name", { exact: true }).fill("qa-region-pool");
  await page.getByRole("radio", { name: "Compute-optimised", exact: true }).check();
  await page.getByRole("switch", { name: "Autoscaling", exact: true }).uncheck();
  await expect(page.getByText(/fleet 6,056 vCPU → 6,312 vCPU/)).toBeVisible();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Create cluster", exact: true })
    .click();
  await expect(page.getByRole("row").filter({ hasText: "qa-region-pool" })).toContainText(
    "256 vCPU",
  );
  await expect(page.getByRole("row").filter({ hasText: "qa-region-pool" })).toContainText("E8");
  await returnTo(page, "Clusters");
  await page.getByLabel("Search clusters", { exact: true }).fill("qa-region-pool");
  await page.getByRole("button", { name: "qa-region-pool", exact: true }).click();
  await expect(page.getByRole("switch", { name: "Autoscaling", exact: true })).not.toBeChecked();
  await page.getByRole("combobox", { name: "Region", exact: true }).click();
  await page.getByRole("option", { name: "sa-east", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText("sa-east", { exact: true }).first()).toBeVisible();
});

test("Lucent upgrade dates use the free calendar and survive Overview navigation", async ({
  page,
}) => {
  await openSection(page, "Clusters");
  await page.getByRole("button", { name: "Next upgrade prod-eu-1", exact: true }).click();
  await page.locator('button[data-day="9/16/2026"]').click();
  await page.keyboard.press("Escape");
  await returnTo(page, "Clusters");
  await expect(
    page.getByRole("button", { name: "Next upgrade prod-eu-1", exact: true }),
  ).toContainText("Sep 16, 2026");
});

test("Lucent cluster details and deletion target only the selected cluster", async ({ page }) => {
  await openSection(page, "Clusters");
  await page.getByRole("button", { name: "Cluster actions prod-eu-1", exact: true }).click();
  await page.getByRole("menuitem", { name: "View details", exact: true }).click();
  await expect(page.getByText("cls-prod-eu-1", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("button", { name: "prod-eu-1", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "prod-eu-2", exact: true })).toBeVisible();
  await expect(page.getByText("5,032 vCPU", { exact: true })).toBeVisible();
});

test("Lucent hosts preserve one monitoring change and real row selection", async ({ page }) => {
  await openSection(page, "Hosts");
  const first = page.getByRole("switch", { name: "Monitor ip-10-0-1-11", exact: true });
  await first.uncheck();
  await page.getByRole("checkbox", { name: "Select host ip-10-0-1-12", exact: true }).check();
  await expect(page.getByText("1 selected", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Clear selection", exact: true }).click();
  await returnTo(page, "Hosts");
  await expect(first).not.toBeChecked();
  await expect(
    page.getByRole("switch", { name: "Monitor ip-10-0-1-12", exact: true }),
  ).toBeChecked();
  await page.getByRole("tab", { name: "Offline", exact: true }).click();
  await expect(page.getByRole("button", { name: "ip-10-4-1-70", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "ip-10-0-1-11", exact: true })).toHaveCount(0);
});

test("Lucent host enrolment command follows cluster and role, then adds the local record", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openSection(page, "Hosts");
  await page.getByRole("button", { name: "Add host", exact: true }).click();
  await page.getByRole("combobox", { name: "Role", exact: true }).click();
  await page.getByRole("option", { name: "Edge", exact: true }).click();
  await page.getByRole("button", { name: "Copy enrolment command", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("--role edge");
  await page.getByRole("dialog").getByRole("button", { name: "Add host", exact: true }).click();
  await expect(
    page.getByRole("table").getByRole("button", { name: "ip-10-5-0-15", exact: true }),
  ).toBeVisible();
  await returnTo(page, "Hosts");
  await expect(page.getByText("15 hosts · 6 patched · 4 pending", { exact: true })).toBeVisible();
});

test("Lucent host edit retains operations and cluster without changing another host", async ({
  page,
}) => {
  await openSection(page, "Hosts");
  await page.getByRole("button", { name: "Host actions ip-10-0-1-11", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await page.getByRole("switch", { name: "Monitored", exact: true }).uncheck();
  await page.getByRole("combobox", { name: "Patch priority", exact: true }).click();
  await page.getByRole("option", { name: "Critical", exact: true }).click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await returnTo(page, "Hosts");
  await page.getByRole("button", { name: "ip-10-0-1-11", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("Critical");
  await expect(page.getByRole("dialog")).toContainText("Off");
});

test("Lucent registry pagination counts repositories while retaining tag order", async ({
  page,
}) => {
  await openSection(page, "Registry");
  await expect(page.getByText("16 repositories / showing tags", { exact: true })).toBeVisible();
  const tags = await page.getByRole("row").allTextContents();
  expect(tags.findIndex((text) => text.includes("v2.13.4"))).toBeLessThan(
    tags.findIndex((text) => text.includes("v2.13.0")),
  );
  await page.getByRole("button", { name: "Go to next page", exact: true }).click();
  await expect(
    page.getByRole("table").getByRole("button", { name: "orders-db", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "search-indexer", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Unscanned", exact: true }).click();
  await expect(page.getByRole("button", { name: "gateway-base", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "payments-api", exact: true })).toHaveCount(0);
});

test("Lucent registry toggles and tag completion survive Overview navigation", async ({ page }) => {
  await openSection(page, "Registry");
  await page.getByRole("switch", { name: "Scan on push payments-api", exact: true }).uncheck();
  await page.getByRole("checkbox", { name: "Mark v2.13.0 complete", exact: true }).check();
  await returnTo(page, "Registry");
  await expect(
    page.getByRole("switch", { name: "Scan on push payments-api", exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Mark v2.13.0 complete", exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("checkbox", { name: "Mark sha256:9f2c1a complete", exact: true }),
  ).not.toBeChecked();
});

test("Lucent repository policy uses NumberField, fixed names and actual clipboard path", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await openSection(page, "Registry");
  await page.getByRole("button", { name: "New repository", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Repository name", exact: true })
    .fill("qa-policy-registry");
  await page.getByLabel("Keep last", { exact: true }).fill("12");
  await page.getByRole("checkbox", { name: "Scan on push", exact: true }).uncheck();
  await page.getByRole("button", { name: "Create repository", exact: true }).click();
  await page
    .getByRole("button", { name: "Repository actions qa-policy-registry", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Copy repository", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(
    "registry.internal/qa-policy-registry",
  );
  await page
    .getByRole("button", { name: "Repository actions qa-policy-registry", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await expect(page.getByRole("textbox", { name: "Repository path", exact: true })).toHaveAttribute(
    "readonly",
    "",
  );
  await expect(page.getByLabel("Keep last", { exact: true })).toHaveValue("12");
  await expect(page.getByRole("checkbox", { name: "Scan on push", exact: true })).not.toBeChecked();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await returnTo(page, "Registry");
  await expect(page.getByText("17 repositories / showing tags", { exact: true })).toBeVisible();
});

test("Lucent registry display settings control real tags, columns and density", async ({
  page,
}) => {
  await openSection(page, "Registry");
  await page.getByRole("button", { name: "Settings", exact: true }).last().click();
  await page.getByRole("switch", { name: "Show tags", exact: true }).uncheck();
  await page.getByRole("switch", { name: "Pusher", exact: true }).uncheck();
  await page.getByRole("combobox", { name: "Density", exact: true }).click();
  await page.getByRole("option", { name: "Comfortable", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("button", { name: "v2.14.0", exact: true })).toHaveCount(0);
  await expect(page.getByRole("columnheader", { name: "Pusher", exact: true })).toHaveCount(0);
  expect(
    (await page.getByRole("row").filter({ hasText: "payments-api" }).boundingBox())?.height,
  ).toBeGreaterThanOrEqual(60);
});

for (const section of ["Clusters", "Hosts", "Registry"]) {
  test(`Lucent ${section} at 390px keeps navigation and forms inside the viewport`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/#/template-preview/lucent");
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
    await page.getByRole("button", { name: "Infrastructure", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: section, exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
      true,
    );
    await page.screenshot({
      path: `/tmp/bricklane-templates-round3/lucent-${section.toLowerCase()}-390.png`,
      animations: "disabled",
    });
    await page
      .getByRole("button", {
        name:
          section === "Clusters"
            ? "Create cluster"
            : section === "Hosts"
              ? "Add host"
              : "New repository",
        exact: true,
      })
      .click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("dialog").screenshot({
      path: `/tmp/bricklane-templates-round3/lucent-${section.toLowerCase()}-form-390.png`,
      animations: "disabled",
    });
    const bounds = await page.getByRole("dialog").boundingBox();
    expect(bounds?.x).toBeGreaterThanOrEqual(0);
    expect((bounds?.x ?? 0) + (bounds?.width ?? 0)).toBeLessThanOrEqual(391);
    if (section === "Hosts") {
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await page.getByRole("button", { name: "Host actions ip-10-0-1-11", exact: true }).click();
      await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
      await page.getByRole("dialog").screenshot({
        path: "/tmp/bricklane-templates-round3/lucent-host-edit-390.png",
        animations: "disabled",
      });
      for (const label of ["Patch window start", "Patch window end"]) {
        const button = page.getByRole("button", { name: label, exact: true });
        expect((await button.boundingBox())?.width).toBeGreaterThan(130);
        expect(await button.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
          true,
        );
      }
    }
    if (section === "Registry") {
      await page.getByRole("button", { name: "Cancel", exact: true }).click();
      await page.getByRole("button", { name: "Settings", exact: true }).last().click();
      await page.getByRole("switch", { name: "Last pulled", exact: true }).check();
      await page.keyboard.press("Escape");
      await expect(
        page.getByRole("columnheader", { name: "Last pulled", exact: true }),
      ).toBeAttached();
    }
    expect(errors).toEqual([]);
  });
}

test("Lucent registry excludes completed tags when queue settings change", async ({ page }) => {
  await openSection(page, "Registry");
  await page.getByRole("button", { name: "Settings", exact: true }).last().click();
  await page.getByRole("switch", { name: "Include completed", exact: true }).uncheck();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("table").getByRole("button", { name: "v2.14.0", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("table").getByRole("button", { name: "v2.13.0", exact: true }),
  ).toBeVisible();
});

test("Lucent code preview, copy and downloaded project use its actual infrastructure modules", async ({
  page,
  context,
}) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/#/templates/lucent");
  await page.getByRole("button", { name: "View template source", exact: true }).click();
  const modules = ["lucent", "lucent-clusters", "lucent-hosts", "lucent-registry"].map(
    (name) => `src/templates/workflow/${name}.tsx`,
  );
  await page.getByRole("combobox", { name: "Template source file", exact: true }).click();
  expect((await page.getByRole("option").allTextContents()).slice(0, 4)).toEqual(modules);
  await page.getByRole("option", { name: modules[3], exact: true }).click();
  const source = await readFile(join(process.cwd(), modules[3]), "utf8");
  expect(await page.locator(".template-source-code").textContent()).toBe(source);
  await page.getByRole("button", { name: "Copy", exact: true }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download project", exact: true }).click();
  const download = await pending;
  const zip = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const path of modules)
    expect(strFromU8(zip[path])).toBe(await readFile(join(process.cwd(), path), "utf8"));
  expect(zip["src/templates/workflow/lucent-infrastructure-model.ts"]).toBeTruthy();
  expect(zip["src/templates/workflow/infrastructure.css"]).toBeTruthy();
  expect(
    zip["src/blocks/application/dialog-variants/workspace-final/free/scope-options.tsx"],
  ).toBeTruthy();
  await download.saveAs("/tmp/bricklane-templates-round3/export-lucent-m3.zip");
});
