import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

const route = (id: number) => `./#/preview/application/empty-state/empty-state-${id}`;

for (const width of [1440, 390]) {
  test(`empty6–10 preserve their individual initial layouts at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (let id = 6; id <= 10; id++) {
      await page.goto(route(id));
      await expect(page.locator(`[data-empty-variant="${id}"]`)).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `empty${id} overflow`,
      ).toBeLessThanOrEqual(width);
      expect(await page.locator("vite-error-overlay").count()).toBe(0);
      if (id === 6) {
        await expect(page.locator('[data-slot="icon-stack"]')).toHaveCount(0);
        await expect(page.locator("[data-step]")).toHaveCount(3);
        const colors = await page.locator("[data-step]").evaluateAll((elements) =>
          elements.map((element) => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = 1;
            const context = canvas.getContext("2d")!;
            context.fillStyle = getComputedStyle(element).backgroundColor;
            context.fillRect(0, 0, 1, 1);
            return [...context.getImageData(0, 0, 1, 1).data];
          }),
        );
        expect(colors[0][0]).toBeGreaterThan(colors[0][1]);
        expect(colors[1][2]).toBeGreaterThan(colors[1][0]);
        expect(colors[2][1]).toBeGreaterThan(colors[2][0]);
      }
      if (id === 7) await expect(page.locator('[data-slot="icon-stack"]')).toHaveCount(0);
      if ([8, 9, 10].includes(id))
        await expect(page.locator('[data-slot="icon-stack"]')).toHaveCount(1);
      if (id === 10) await expect(page.locator('[data-slot="card"]')).toHaveCount(1);
    }
    expect(errors).toEqual([]);
  });
}

for (const id of [7, 9]) {
  test(`empty${id} uses the actual free clipboard Hook success state and copies the example URL`, async ({
    page,
    context,
  }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await page.goto(route(id));
    const copyButton = page.getByRole("button", { name: "Copy invite link", exact: true });
    await expect(copyButton).toBeVisible();
    // Freeze only after the lazy preview has mounted; its React suspense timer must settle first.
    await page.clock.install({ time: new Date("2026-10-23T10:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-23T10:00:01Z"));
    await copyButton.click();
    await expect(
      page.getByRole("button", { name: "Invite link copied", exact: true }),
    ).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => navigator.clipboard.readText()))
      .toBe("https://workspace.example/join/demo-team");
    await expect(page.getByRole("alert")).toContainText("no workspace access is granted");
    await page.clock.fastForward(2100);
    await expect(page.getByRole("button", { name: "Copy invite link", exact: true })).toBeVisible();
  });

  test(`empty${id} stores the entered role locally and can restore its distinct empty media`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto(route(id));
    await page.getByRole("button", { name: "Invite members", exact: true }).click();
    await expect(page.getByRole("dialog")).toContainText("No email is sent");
    await page.getByLabel("Email address", { exact: true }).fill("qa-reviewer@example.com");
    await page.getByRole("combobox").click();
    await page.getByRole("option", { name: "Reviewer", exact: true }).click();
    await page.getByRole("button", { name: "Create local invite", exact: true }).click();
    await expect(
      page.getByRole("heading", { name: "Workspace invitations", exact: true }),
    ).toBeVisible();
    await expect(page.getByText("qa-reviewer@example.com", { exact: true })).toBeVisible();
    await expect(page.getByText("Reviewer", { exact: true })).toBeVisible();
    await expect(
      page.getByText("1 local invitation drafts · No emails sent", { exact: true }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
    await page.getByRole("button", { name: "Reset invitations", exact: true }).click();
    await expect(page.getByText("Invite the first people in", { exact: true })).toBeVisible();
    await expect(page.locator('[data-slot="icon-stack"]')).toHaveCount(id === 9 ? 1 : 0);
  });
}

test("team launch links a named milestone, saves brief notes, and starts the entered local check-in", async ({
  page,
}) => {
  await page.goto(route(6));
  await page.getByRole("button", { name: "Link Deliverables", exact: true }).click();
  await page.getByLabel("Milestone name", { exact: true }).fill("QA release milestone");
  await page.getByRole("button", { name: "Link milestone", exact: true }).click();
  await expect(page.getByRole("button", { name: "Link Deliverables", exact: true })).toContainText(
    "QA release milestone",
  );
  await page.getByRole("button", { name: "Open Brief", exact: true }).click();
  await page
    .getByLabel("Brief notes", { exact: true })
    .fill("Review mobile navigation before handoff.");
  await page.getByRole("button", { name: "Save brief", exact: true }).click();
  await expect(page.getByRole("button", { name: "Open Brief", exact: true })).toContainText(
    "Review mobile navigation before handoff.",
  );
  await page.getByRole("button", { name: "Start Check-In", exact: true }).click();
  await page
    .getByLabel("Check-in question", { exact: true })
    .fill("Is the release checklist complete?");
  await page.getByRole("button", { name: "Open local check-in", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start Check-In", exact: true })).toContainText(
    "Is the release checklist complete?",
  );
});

test("team launch adds the supplied core member and merges the sample directory locally", async ({
  page,
}) => {
  await page.goto(route(6));
  await page.getByRole("button", { name: "Add Core Team", exact: true }).click();
  await page.getByLabel("Email address", { exact: true }).fill("release-owner@example.com");
  await page.getByRole("button", { name: "Create local invite", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Core Team · 1 members", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Sync Directory", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("does not request OAuth access");
  await page.getByRole("button", { name: "Sync sample directory", exact: true }).click();
  await page.getByRole("button", { name: "Core Team · 4 members", exact: true }).click();
  for (const email of [
    "release-owner@example.com",
    "olivia@example.com",
    "phoenix@example.com",
    "lana@example.com",
  ])
    await expect(page.getByRole("dialog").getByText(email, { exact: true })).toBeVisible();
});

test("project tabs keep independent setup state, validate duplicate names and support keyboard switching", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(route(8));
  await page.getByRole("button", { name: "Enable", exact: true }).click();
  await page.getByLabel("New state name", { exact: true }).fill("Ready for review");
  await page.getByRole("button", { name: "Add state", exact: true }).click();
  await expect(page.getByText("Ready for review", { exact: true })).toBeVisible();
  await page.getByLabel("New state name", { exact: true }).fill("planned");
  await page.getByRole("button", { name: "Add state", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("already exists");
  await page.getByRole("tab", { name: "Project labels", exact: true }).click();
  await expect(page.getByText("Set up project labels", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Enable", exact: true }).click();
  await page.getByLabel("New label name", { exact: true }).fill("Release QA");
  await page.getByRole("button", { name: "Add label", exact: true }).click();
  await expect(page.getByText("Release QA", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Project labels", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  await expect(page.getByRole("tab", { name: "Project states", exact: true })).toHaveAttribute(
    "data-state",
    "active",
  );
  await expect(page.getByText("Ready for review", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Remove state Ready for review", exact: true }).click();
  await expect(page.getByText("Ready for review", { exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("blueprint creation keeps the entered fields and individual starter tasks", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(route(10));
  await page.getByRole("button", { name: "Create blueprint", exact: true }).click();
  await page.getByLabel("Blueprint name", { exact: true }).fill("QA customer onboarding");
  await page.getByLabel("Description", { exact: true }).fill("Reusable customer setup checklist.");
  await page
    .getByLabel("Starter tasks", { exact: true })
    .fill("Assign onboarding owner\nSchedule kickoff\nReview access");
  await page.getByRole("button", { name: "Save blueprint", exact: true }).click();
  await page
    .getByRole("button", { name: /QA customer onboarding Reusable customer setup checklist/ })
    .click();
  await expect(page.getByRole("dialog")).toContainText("Assign onboarding owner");
  await expect(page.getByRole("dialog")).toContainText("Schedule kickoff");
  await expect(page.getByRole("dialog")).toContainText("Review access");
  await expect(page.getByRole("dialog")).toContainText("No project has been created");
});

test("actual free upload Hook imports validated blueprint JSON and rejects the wrong domain shape", async ({
  page,
}) => {
  await page.goto(route(10));
  const input = page.getByLabel("Import blueprint JSON", { exact: true });
  await input.setInputFiles({
    name: "invalid.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ name: "Wrong shape", description: "invalid tasks", tasks: [42] }),
    ),
  });
  await expect(page.getByRole("alert")).toContainText("non-empty text items");
  await expect(page.getByText("No blueprints yet", { exact: true })).toBeVisible();
  await input.setInputFiles({
    name: "release.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        name: "Imported release",
        description: "Release handoff",
        tasks: ["Review production preview", "Confirm source export"],
      }),
    ),
  });
  await page.getByRole("button", { name: /Imported release Release handoff/ }).click();
  await expect(page.getByRole("dialog")).toContainText("Confirm source export");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.getByRole("button", { name: "Reset library", exact: true }).click();
  await expect(page.getByText("No blueprints yet", { exact: true })).toBeVisible();
});

test("team setup source viewer and actual ZIP contain the official clipboard Hook and IconStack", async ({
  page,
}) => {
  const modules = ["launch", "invite", "settings", "invite", "blueprints"];
  for (let id = 6; id <= 10; id++) {
    await page.goto(`./#/block/application/empty-state/empty-state-${id}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      `src/blocks/application/empty-variants/team-setup/${modules[id - 6]}.tsx`,
    );
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
  }
  await page.goto("./#/block/application/empty-state/empty-state-9");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await pending;
  const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const path of [
    "src/blocks/application/empty-variants/team-setup/invite.tsx",
    "src/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard.ts",
    "src/blocks/application/empty-variants/team-setup/team-setup.css",
    "src/components/reui/icon-stack.tsx",
    "src/components/reui/REUI-LICENSE.txt",
  ])
    expect(files[path], path).toBeDefined();
  expect(
    strFromU8(
      files["src/blocks/application/empty-variants/team-setup/free/use-copy-to-clipboard.ts"],
    ),
  ).toContain("navigator.clipboard.writeText(value).then");
});

test("long imported blueprint text stays inside the mobile page and preview dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(route(10));
  const longName = "Q".repeat(80);
  await page.getByLabel("Import blueprint JSON", { exact: true }).setInputFiles({
    name: "long-content.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({ name: longName, description: "D".repeat(500), tasks: ["T".repeat(120)] }),
    ),
  });
  const blueprint = page.getByRole("button").filter({ hasText: longName });
  await expect(blueprint).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
  await blueprint.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("T".repeat(120));
  expect(await dialog.evaluate((element) => element.scrollWidth)).toBeLessThanOrEqual(358);
});
