import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { strFromU8, unzipSync } from "fflate";

const entries = [
  { id: 1, launch: "Open duration picker", title: "Select duration" },
  { id: 2, launch: "Open team invite", title: "Invite teammates Workspace access" },
  { id: 3, launch: "Open cancellation survey", title: "Cancel Your Plan" },
  { id: 4, launch: "Open launch checklist", title: "Launch checklist" },
  { id: 5, launch: "Open template library", title: "Starter library" },
];
const preview = (id: number) => `./#/preview/application/dialog/dialog-${id}`;

for (const width of [1440, 390]) {
  test(`five dialog launchers and opened surfaces remain bounded at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const entry of entries) {
      await page.goto(preview(entry.id));
      await expect(page.locator(`[data-dialog-variant="${entry.id}"]`)).toBeVisible();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.locator('[data-slot="frame"]')).toHaveCount(1);
      await page.getByRole("button", { name: entry.launch, exact: true }).click();
      const dialog = page.getByRole("dialog", { name: entry.title, exact: true });
      await expect(dialog).toBeVisible();
      await expect
        .poll(async () => {
          const bounds = await dialog.boundingBox();
          return (
            !!bounds &&
            bounds.x >= 0 &&
            bounds.y >= 0 &&
            bounds.x + bounds.width <= width &&
            bounds.y + bounds.height <= 900
          );
        })
        .toBe(true);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
        `dialog${entry.id}`,
      ).toBe(width);
      await dialog.getByRole("button", { name: "Close", exact: true }).click();
      await expect(dialog).toHaveCount(0);
      await expect(page.getByRole("button", { name: entry.launch, exact: true })).toBeFocused();
    }
    expect(errors).toEqual([]);
  });
}

test("duration presets preserve the start, wrap midnight and apply the actual local span", async ({
  page,
}) => {
  await page.goto(preview(1));
  await page.getByRole("button", { name: "Open duration picker", exact: true }).click();
  await page.getByRole("combobox", { name: "Start time (optional)", exact: true }).click();
  await expect(page.getByRole("option")).toHaveCount(48);
  await page.getByRole("option", { name: "11:30 PM", exact: true }).click();
  await page.getByRole("radio", { name: "2 hours", exact: true }).click();
  await expect(
    page.getByRole("combobox", { name: "Start time (optional)", exact: true }),
  ).toHaveText("11:30 PM");
  await expect(page.getByRole("combobox", { name: "End time (optional)", exact: true })).toHaveText(
    "01:30 AM",
  );
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("11:30 PM → 01:30 AM · 120 minutes");
  await expect(page.getByRole("alert")).toContainText("no event was scheduled");
  await page.getByRole("button", { name: "Open duration picker", exact: true }).click();
  await page.getByRole("radio", { name: "1 day", exact: true }).click();
  await expect(page.getByRole("combobox", { name: "End time (optional)", exact: true })).toHaveText(
    "11:30 PM",
  );
  await page.getByRole("button", { name: "Apply", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("1440 minutes");
});

test("bulk invite dedupes case-insensitively and saves the selected shared role without sending mail", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(preview(2));
  await page.getByRole("button", { name: "Open team invite", exact: true }).click();
  await expect(page.getByRole("button", { name: "Send invite", exact: true })).toBeDisabled();
  await page
    .getByLabel("Invite by email", { exact: true })
    .fill("QA@example.com, qa@example.com SECOND@example.com");
  await page.getByRole("combobox", { name: "Invite as", exact: true }).click();
  await page
    .getByRole("option", { name: "Guest reviewer Review shared work.", exact: true })
    .click();
  await page.getByRole("button", { name: "Send 2 invites", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "qa@example.com, second@example.com · Guest reviewer",
  );
  await expect(page.getByRole("alert")).toContainText(
    "no email was sent and no access was granted",
  );
});

test("invalid bulk addresses keep the dialog open and expose real field validation", async ({
  page,
}) => {
  await page.goto(preview(2));
  await page.getByRole("button", { name: "Open team invite", exact: true }).click();
  await page
    .getByLabel("Invite by email", { exact: true })
    .fill("not-an-address valid@example.com");
  await page.getByRole("button", { name: "Send 2 invites", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByLabel("Invite by email", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.getByRole("alert")).toHaveText(
    "Check each email address before saving the invitation draft.",
  );
  await page.getByLabel("Invite by email", { exact: true }).fill("fixed@example.com");
  await expect(page.getByLabel("Invite by email", { exact: true })).toHaveAttribute(
    "aria-invalid",
    "false",
  );
});

test("cancellation initially focuses Keep plan and gates its actual local survey on reasons", async ({
  page,
}) => {
  await page.goto(preview(3));
  await page.getByRole("button", { name: "Open cancellation survey", exact: true }).click();
  await expect(page.getByRole("button", { name: "Keep plan", exact: true })).toBeFocused();
  await expect(page.getByRole("button", { name: "Cancel plan", exact: true })).toBeDisabled();
  await expect(page.getByRole("checkbox")).toHaveCount(8);
  await page.getByLabel("Budget changed", { exact: true }).check();
  await page.getByLabel("Missing a few patterns", { exact: true }).check();
  await page.getByLabel("Additional feedback", { exact: true }).fill("Need a smaller team plan.");
  await page.getByRole("button", { name: "Cancel plan", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Budget changed · Missing a few patterns — Need a smaller team plan.",
  );
  await expect(page.getByRole("alert")).toContainText(
    "actual plan, billing and access are unchanged",
  );
});

test("cancellation warning dismiss and Manage operate independently without real billing", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(preview(3));
  await page.getByRole("button", { name: "Open cancellation survey", exact: true }).click();
  await page.getByRole("button", { name: "Manage", exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Local plan summary" })).toContainText(
    "No billing account is connected",
  );
  await page.getByRole("button", { name: "Dismiss", exact: true }).click();
  await expect(page.getByText("Shared access pauses after expiry.", { exact: true })).toHaveCount(
    0,
  );
  await expect(page.getByText("Local plan summary", { exact: true })).toBeVisible();
});

test("checklist inline rows save on Enter and discard on Escape without closing the dialog", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(preview(4));
  await page.getByRole("button", { name: "Open launch checklist", exact: true }).click();
  await page.getByRole("button", { name: "Edit Launch owner", exact: true }).click();
  await page.getByRole("textbox", { name: "Launch owner", exact: true }).fill("QA coordinator");
  await page.getByRole("textbox", { name: "Launch owner", exact: true }).press("Enter");
  await expect(page.getByRole("button", { name: "Edit Launch owner", exact: true })).toContainText(
    "QA coordinator",
  );
  await page.getByRole("button", { name: "Edit Workspace alias", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Workspace alias", exact: true })
    .fill("discard-this-draft");
  await page.getByRole("textbox", { name: "Workspace alias", exact: true }).press("Escape");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Edit Workspace alias", exact: true }),
  ).toContainText("growth-command");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("QA coordinator · growth-command");
});

test("checklist searches apps and changes real local connection/manage states", async ({
  page,
}) => {
  await page.goto(preview(4));
  await page.getByRole("button", { name: "Open launch checklist", exact: true }).click();
  await page.getByRole("button", { name: "Connected apps", exact: true }).click();
  await page.getByRole("textbox", { name: "Search apps", exact: true }).fill("calendar");
  await expect(page.getByRole("button", { name: "Manage Slack", exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Connect Google Calendar", exact: true }).click();
  await page.getByRole("button", { name: "Manage Google Calendar", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("No OAuth permission has been granted");
  await page.getByRole("button", { name: "Disconnect Google Calendar", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Connect Google Calendar", exact: true }),
  ).toBeVisible();
  await page.getByRole("textbox", { name: "Search apps", exact: true }).fill("");
  await page.getByRole("button", { name: "Add app", exact: true }).click();
  await page.getByRole("textbox", { name: "App name", exact: true }).fill("QA connector");
  await page.getByRole("button", { name: "Add local app", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Connect QA connector", exact: true }),
  ).toBeVisible();
});

test("template category/search uses the observed visible-selection fallback and opens that choice locally", async ({
  page,
}) => {
  await page.goto(preview(5));
  await page.getByRole("button", { name: "Open template library", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Select / })).toHaveCount(7);
  await page.getByRole("button", { name: "Select Forecast bridge", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Select Forecast bridge", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByText("Research loops", { exact: true }).click();
  await expect(
    page.getByRole("radio", { name: "Research loops Interviews and synthesis", exact: true }),
  ).toBeChecked();
  await expect(page.getByRole("button", { name: /^Select / })).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "Select Interview signal hub", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Open template", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Interview signal hub selected locally");
  await expect(page.getByRole("alert")).toContainText(
    "No project or remote workspace has been created",
  );
});

test("template zero results disable Open while Build from blank produces a distinct local result", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(preview(5));
  await page.getByRole("button", { name: "Open template library", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Search templates", exact: true })
    .fill("nonexistent-starter");
  await expect(page.getByText("No templates match", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open template", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Build from blank", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Blank workspace selected locally");
});

test("starter thumbnails and app marks use original data artwork, with footer reachable at short mobile height", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 640 });
  await page.goto(preview(5));
  await page.getByRole("button", { name: "Open template library", exact: true }).click();
  for (const image of await page.getByRole("dialog").getByRole("img").all())
    await expect(image).toHaveAttribute("src", /^data:image\/svg\+xml,/);
  await expect(page.getByRole("button", { name: "Open template", exact: true })).toBeVisible();
  const footer = await page.locator(".refined-dialog-footer").boundingBox();
  expect(footer!.y + footer!.height).toBeLessThanOrEqual(640);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(390);
});

test("five source defaults and actual starter ZIP include the reused free composition and original artwork", async ({
  page,
}) => {
  const modules = ["duration", "invites", "cancellation", "checklist", "library"];
  for (let id = 1; id <= 5; id++) {
    await page.goto(`./#/block/application/dialog/dialog-${id}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("combobox", { name: "Source file", exact: true })).toHaveText(
      `src/blocks/application/dialog-variants/first-run/${modules[id - 1]}.tsx`,
    );
    await dialog.getByRole("button", { name: "Close", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  }
  await page.goto("./#/block/application/dialog/dialog-5");
  const pending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download source", exact: true }).click();
  const download = await pending;
  const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
  for (const path of [
    "src/blocks/application/dialog-variants/first-run/library.tsx",
    "src/blocks/application/dialog-variants/first-run/free/dialog-surface.tsx",
    "src/components/ui/dialog.tsx",
    "src/components/reui/icon-tile.tsx",
    "src/components/reui/alert.tsx",
    "src/components/reui/badge.tsx",
    "src/components/reui/frame.tsx",
    "src/lib/demo-artwork.ts",
    "src/components/reui/REUI-LICENSE.txt",
  ])
    expect(files[path], path).toBeDefined();
  expect(
    strFromU8(files["src/blocks/application/dialog-variants/first-run/free/dialog-surface.tsx"]),
  ).toContain("Official free REUI c-dialog-3 / c-dialog-6 composition");
  expect(
    strFromU8(files["src/blocks/application/dialog-variants/first-run/library.tsx"]),
  ).not.toContain("picsum.photos");
});
