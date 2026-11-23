import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

const primitives = ["radix", "base"] as const;
const roots = { radix: "/", base: "/base/" };
const demo = "#/templates/signal";

function withinSignal(page: Page) {
  return page.locator('[data-template="signal"]');
}

async function open(page: Page, primitive: (typeof primitives)[number], suffix = "") {
  await page.goto(`${roots[primitive]}${demo}${suffix}`);
  await expect(page).toHaveTitle("Signal — Bricklane Templates");
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(withinSignal(page).getByRole("navigation")).toBeVisible();
}

async function download(page: Page, name: string) {
  const pending = page.waitForEvent("download");
  await withinSignal(page).getByRole("button", { name, exact: true }).click();
  const result = await pending;
  return readFile((await result.path())!);
}

for (const primitive of primitives) {
  test(`Signal ${primitive}: source health follows campaigns and page search`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    await open(page, primitive);
    const signal = withinSignal(page);
    await expect(signal.getByRole("link")).toHaveCount(10);
    await expect(signal.getByText("Sync paused", { exact: true })).toHaveCount(2);
    await signal.getByRole("button", { name: "Notifications (1)" }).click();
    await expect(signal.getByText("Social ads needs attention.", { exact: false })).toBeVisible();
    await page.keyboard.press("Control+k");
    await page.getByRole("combobox", { name: "Search analytics pages" }).fill("Data sources");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/#\/templates\/signal\/sources$/);
    await signal.getByRole("button", { name: "Restore Social ads" }).click();
    await expect(signal.getByText("All sources are syncing.")).toBeVisible();
    await signal.getByRole("link", { name: "Overview", exact: true }).click();
    await expect(signal.getByText("Syncing", { exact: true })).toHaveCount(3);
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.screenshot({ path: info.outputPath("signal-phone.png") });
    expect(faults).toEqual([]);
  });

  test(`Signal ${primitive}: funnel validation, chart exports and retention data`, async ({
    page,
  }, info) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await open(page, primitive, "/funnels");
    const signal = withinSignal(page);
    const svg = signal.locator("svg.recharts-surface");
    await expect(svg).toBeVisible();
    await signal.getByLabel("Created account").fill("6000");
    await signal.getByRole("button", { name: "Apply cohort" }).click();
    await expect(signal.getByRole("alert")).toContainText("previous stage");
    expect((await download(page, "Export CSV")).toString()).toContain('"Created account",1142');
    await signal.getByLabel("Created account").fill("1500");
    await signal.getByRole("button", { name: "Apply cohort" }).click();
    await expect(signal.getByRole("alert")).toHaveCount(0);
    expect((await download(page, "Export CSV")).toString()).toContain('"Created account",1500');
    const size = await svg.evaluate((element) => [element.clientWidth, element.clientHeight]);
    const image = await download(page, "Export PNG");
    expect(image.subarray(0, 8)).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect([image.readUInt32BE(16), image.readUInt32BE(20)]).toEqual(
      size.map((value) => value * 2),
    );
    await page.screenshot({ path: info.outputPath("signal-funnel.png") });
    await signal.getByRole("link", { name: "Retention" }).click();
    await signal.getByRole("combobox", { name: "Retention window" }).click();
    await page.getByRole("option", { name: "16 weeks" }).click();
    await signal.getByLabel("Participants", { exact: true }).fill("500");
    await signal.getByLabel("August notes").fill("New rollout cohort");
    await signal.getByRole("button", { name: "Save cohort" }).click();
    await expect(signal.getByRole("row", { name: /August 500 New rollout cohort/ })).toBeVisible();
    const csv = (await download(page, "Export CSV")).toString();
    expect(csv).toContain('"W1",500');
    expect(csv.split("\r\n")).toHaveLength(17);
  });

  test(`Signal ${primitive}: scorecard changes survive navigation and transfer uses current workload`, async ({
    page,
  }) => {
    await open(page, primitive, "/goals");
    const signal = withinSignal(page);
    await expect(signal.getByText("KPI scorecard", { exact: true })).toBeVisible();
    await signal.getByRole("spinbutton", { name: "Site visits weight" }).fill("30");
    await expect(signal.getByText("Weights add up to 120%.")).toBeVisible();
    await signal.getByRole("button", { name: "Connect metrics" }).click();
    await expect(signal.getByText("Choose a new link without a cycle.")).toBeVisible();
    await signal.getByRole("link", { name: "Accounts" }).click();
    await signal.getByRole("button", { name: "Hand over Northstar Goods" }).click();
    await expect(page.getByRole("dialog")).toContainText("Lea Chen has the lowest open workload");
    await page.getByRole("button", { name: "Confirm handover" }).click();
    await expect(signal.getByText("Northstar Goods is now assigned to Lea Chen.")).toBeVisible();
    await signal.getByRole("link", { name: "Roadmap" }).click();
    await expect(signal.getByText("Security review", { exact: true })).toBeVisible();
    await signal.getByRole("link", { name: "Goals" }).click();
    await expect(signal.getByRole("spinbutton", { name: "Site visits weight" })).toHaveValue("30");
    await signal.getByRole("link", { name: "Settings" }).click();
    const role = signal.getByRole("combobox", { name: "Avi Singh role" });
    await role.click();
    await page.getByRole("option", { name: "Viewer" }).click();
    await signal.getByRole("link", { name: "Demo sign in" }).click();
    await signal.getByLabel("Email address").fill("demo@brick.test");
    await signal.getByRole("button", { name: "Preview sign-in link" }).click();
    await expect(signal.getByRole("status")).toContainText("one-time sign-in link");
    await page.goBack();
    await expect(role).toContainText("Viewer");
  });

  test(`Signal ${primitive}: roadmap gestures cannot cross the locked security review`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await open(page, primitive, "/roadmap");
    const bars = withinSignal(page).locator('button[data-slot="gantt-bar"]');
    const audit = bars.filter({ hasText: "Prepare evidence" });
    const security = bars.filter({ hasText: "Security review" });
    await expect(audit).toBeVisible();
    await expect(security).toBeVisible();
    for (const bar of [audit, security]) {
      await expect
        .poll(() =>
          bar.evaluate((node) => {
            const bounds = node.getBoundingClientRect();
            const hit = document.elementFromPoint(
              bounds.left + bounds.width / 2,
              bounds.top + bounds.height / 2,
            );
            return node.contains(hit);
          }),
        )
        .toBe(true);
    }
    const label = await audit.getAttribute("aria-label");
    const a = (await audit.boundingBox())!;
    const b = (await security.boundingBox())!;
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(b.x + b.width / 2, a.y + a.height / 2, { steps: 12 });
    await expect(audit).toHaveAttribute("data-dragging", "true");
    await page.mouse.up();
    await expect(audit).toHaveAttribute("aria-label", label!);
    const oneDay = (b.x - a.x) / 7;
    await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
    await page.mouse.down();
    await page.mouse.move(a.x + a.width / 2 + oneDay, a.y + a.height / 2, { steps: 8 });
    await expect(audit).toHaveAttribute("data-dragging", "true");
    await page.mouse.up();
    await expect(audit).not.toHaveAttribute("aria-label", label!);
  });

  test(`Signal ${primitive}: project ZIP includes its dedicated entry and selected foundation`, async ({
    page,
    context,
  }, info) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await open(page, primitive);
    await page.getByRole("button", { name: "View template source" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    const code = dialog.locator(".template-source-code");
    const path = "src/templates/workflow/signal.tsx";
    const source = await readFile(path, "utf8");
    await expect.poll(() => code.textContent()).toBe(source);
    await dialog.getByRole("button", { name: "Copy", exact: true }).click();
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(source);
    const pendingFile = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download template source file" }).click();
    const single = await pendingFile;
    expect(single.suggestedFilename()).toBe("signal.tsx");
    expect(await readFile((await single.path())!, "utf8")).toBe(source);
    const pending = page.waitForEvent("download");
    await dialog.getByRole("button", { name: "Download project", exact: true }).click();
    const zip = await pending;
    await zip.saveAs(info.outputPath("signal-template.zip"));
    const files = unzipSync(await readFile((await zip.path())!));
    expect(zip.suggestedFilename()).toBe("signal-template.zip");
    expect(strFromU8(files["src/Example.tsx"])).toContain("from '@/templates/workflow/signal'");
    expect(strFromU8(files[path])).toBe(source);
    expect(files["src/templates/workflow/signal-roadmap.tsx"]).toBeTruthy();
    expect(files["src/components/reui/REUI-LICENSE.txt"]).toBeTruthy();
    expect(JSON.parse(strFromU8(files["components.json"])).style).toMatch(
      new RegExp(`^${primitive}-`),
    );
    expect(files["src/templates/workflow/flux.tsx"]).toBeUndefined();
  });
}
