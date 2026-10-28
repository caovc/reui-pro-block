// Static browser-acceptance draft; not executed for this delivery.
// Local Bricklane demo state only. No authentication/backend claim is made.
import { expect, test, type Locator, type Page } from "@playwright/test";

type DriveId = "filespace" | "filebox";
const query = "?theme=Mono%2BSerif&radius=0.75";
const faults = new WeakMap<Page, string[]>();
const blockedWrites = new WeakMap<Page, string[]>();
const base = (id: DriveId) => `#/template-preview/${id}`;
const helpTrigger = (page: Page) => page.getByRole("button", { name: "Help", exact: true });
const notificationTrigger = (page: Page) =>
  page.getByRole("button", { name: "Notifications", exact: true });
const header = (page: Page) => page.locator("header.ct-drive-header");

async function expectHash(page: Page, hash: string) {
  await expect(page).toHaveURL((url) => url.hash === hash);
}

async function focusInside(dialog: Locator) {
  await expect
    .poll(() => dialog.evaluate((element) => element.contains(document.activeElement)))
    .toBe(true);
}

async function closeSheet(page: Page, sheet: Locator, trigger: Locator) {
  await page.keyboard.press("Escape");
  await expect(sheet).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
}

async function openHelp(page: Page) {
  const sheet = page.getByRole("dialog", { name: "Help", exact: true });
  await expect(sheet).toHaveCount(0);
  await expect(helpTrigger(page)).toHaveAttribute("aria-expanded", "false");
  await helpTrigger(page).click();
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("textbox", { name: "Search help", exact: true })).toBeFocused();
  return sheet;
}

async function openNotifications(page: Page, unread: number) {
  const sheet = page.getByRole("dialog", { name: "Notifications", exact: true });
  await expect(sheet).toHaveCount(0);
  await expect(notificationTrigger(page)).toHaveAttribute("aria-expanded", "false");
  await notificationTrigger(page).click();
  await expect(sheet).toBeVisible();
  await focusInside(sheet);
  await expect(sheet.getByLabel(`${unread} unread notifications`, { exact: true })).toBeVisible();
  return sheet;
}

async function load(page: Page, id: DriveId, suffix = "", previewTitle?: string) {
  const initialEntry = page.url() === "about:blank";
  const ready = previewTitle
    ? page.getByRole("dialog", { name: previewTitle, exact: true })
    : helpTrigger(page);
  await page.goto(`/${base(id)}${suffix}${query}`);
  if (id === "filebox") {
    const signIn = page.getByRole("button", { name: "Sign in", exact: true });
    if (initialEntry) {
      // Fresh Filebox entry must retain its real Login screen, including copied deep links.
      await expect(signIn).toBeVisible();
      await expect(helpTrigger(page)).toHaveCount(0);
    } else {
      // Handle both a cold document and an already signed, same-document hash entry.
      await expect(signIn.or(ready)).toBeVisible();
    }
    if (await signIn.isVisible()) await signIn.click();
  }
  await expect(ready).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await expectHash(page, `${base(id)}${suffix}${query}`);
}

async function signOutFromProfile(page: Page, width: number) {
  if (width === 390) {
    const trigger = page.getByRole("button", {
      name: "Open application navigation",
      exact: true,
    });
    await trigger.click();
    const rail = page.getByRole("dialog", { name: "Bricklane Drive applications", exact: true });
    await expect(rail).toBeVisible();
    await focusInside(rail);
  }
  const profile = page.getByRole("button", { name: "Open profile for Alex Rivera", exact: true });
  await profile.click();
  const menu = page.getByRole("menu");
  await expect(menu).toBeVisible();
  await expect(
    page.getByRole("button", {
      name: "Open profile for Alex Rivera",
      exact: true,
      includeHidden: true,
    }),
  ).toHaveAttribute("aria-expanded", "true");
  await focusInside(menu);
  await menu.getByRole("menuitem", { name: /^Sign Out/ }).click();
  await expect(menu).toHaveCount(0);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  faults.set(page, []);
  blockedWrites.set(page, []);
  page.on("pageerror", (error) => faults.get(page)!.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "warning" || message.type() === "error") {
      faults.get(page)!.push(message.text());
    }
  });
  await page.route("**/*", async (route) => {
    const request = route.request();
    if (!["GET", "HEAD"].includes(request.method())) {
      blockedWrites.get(page)!.push(`${request.method()} ${request.url()}`);
      await route.abort("blockedbyclient");
      return;
    }
    await route.continue();
  });
});

test.afterEach(async ({ page }) => {
  expect(faults.get(page)).toEqual([]);
  expect(blockedWrites.get(page)).toEqual([]);
});

for (const id of ["filespace", "filebox"] as const) {
  for (const width of [1440, 390]) {
    test.describe(`${id} native Header at ${width}`, () => {
      test.use({
        viewport: { width, height: width === 390 ? 844 : 1000 },
        deviceScaleFactor: 1,
        colorScheme: "light",
      });

      test("defaults, Help navigation and notification lifetime preserve the local route", async ({
        page,
      }) => {
        await load(page, id);
        const defaultView = id === "filespace" ? "Favourites" : "My Drive";
        await expect(header(page).getByText(defaultView, { exact: true })).toBeVisible();

        let help = await openHelp(page);
        const guides = help.getByRole("navigation", { name: "Help guides", exact: true });
        await expect(guides.getByRole("link")).toHaveCount(8);
        const search = help.getByRole("textbox", { name: "Search help", exact: true });
        await search.fill("no-such-bricklane-guide");
        await expect(help.getByRole("status")).toContainText("No guides found");
        await expect(guides.getByRole("link")).toHaveCount(0);
        await help.getByRole("button", { name: "Clear search", exact: true }).click();
        await expect(search).toHaveValue("");
        await expect(search).toBeFocused();
        await expect(guides.getByRole("link")).toHaveCount(8);
        await closeSheet(page, help, helpTrigger(page));

        help = await openHelp(page);
        const addingFiles = help.getByRole("link").filter({
          has: page.getByText("Adding files", { exact: true }),
        });
        const driveHash = `${base(id)}/drive${query}`;
        await expect(addingFiles).toHaveAttribute("href", driveHash);
        const historyBefore = await page.evaluate(() => history.length);
        await addingFiles.click();
        await expectHash(page, driveHash);
        await expect(help).toHaveCount(0);
        await expect(helpTrigger(page)).toBeFocused();
        await expect(header(page).getByText("My Drive", { exact: true })).toBeVisible();
        await expect.poll(() => page.evaluate(() => history.length)).toBe(historyBefore + 1);
        await page.goBack();
        await expectHash(page, `${base(id)}${query}`);
        await expect(header(page).getByText(defaultView, { exact: true })).toBeVisible();
        expect(await page.evaluate(() => history.length)).toBe(historyBefore + 1);
        await page.goForward();
        await expectHash(page, driveHash);
        await expect(header(page).getByText("My Drive", { exact: true })).toBeVisible();
        expect(await page.evaluate(() => history.length)).toBe(historyBefore + 1);

        let notifications = await openNotifications(page, 4);
        const feed = notifications.getByRole("list", {
          name: "Workspace notifications",
          exact: true,
        });
        await expect(feed.getByRole("listitem")).toHaveCount(11);
        await expect(feed.getByLabel("Unread notification", { exact: true })).toHaveCount(4);
        await notifications.getByRole("button", { name: "Mark all as read", exact: true }).click();
        await expect(
          notifications.getByLabel("0 unread notifications", { exact: true }),
        ).toBeVisible();
        await expect(feed.getByLabel("Unread notification", { exact: true })).toHaveCount(0);
        await expect(
          notifications.getByRole("button", { name: "Mark all as read", exact: true }),
        ).toBeDisabled();
        await notifications
          .getByRole("button", { name: "Dismiss notifications", exact: true })
          .click();
        await expect(notifications).toHaveCount(0);
        await expect(notificationTrigger(page)).toBeFocused();
        notifications = await openNotifications(page, 0);
        const teamHash = `${base(id)}/settings/team${query}`;
        await expect(
          notifications.getByRole("link", { name: "View team", exact: true }),
        ).toHaveAttribute("href", teamHash);
        await notifications.getByRole("link", { name: "View team", exact: true }).click();
        await expectHash(page, teamHash);
        await expect(notifications).toHaveCount(0);
        await expect(notificationTrigger(page)).toBeFocused();
        await expect(
          page.getByRole("heading", { name: "Account Settings", exact: true }),
        ).toBeVisible();
        notifications = await openNotifications(page, 0);
        await closeSheet(page, notifications, notificationTrigger(page));

        // Local demo lifecycle: Login unmounts Header, not a real authorization/session operation.
        await signOutFromProfile(page, width);
        await expectHash(page, `${base(id)}/login${query}`);
        await expect(helpTrigger(page)).toHaveCount(0);
        await expect(notificationTrigger(page)).toHaveCount(0);
        await page.goBack();
        await expectHash(page, teamHash);
        await expect(
          page.getByRole("heading", { name: "Account Settings", exact: true }),
        ).toBeVisible();
        notifications = await openNotifications(page, 4);
        await expect(
          notifications
            .getByRole("list", { name: "Workspace notifications", exact: true })
            .getByRole("listitem"),
        ).toHaveCount(11);
        await closeSheet(page, notifications, notificationTrigger(page));
        await expect
          .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
          .toBe(true);
      });
    });
  }
}

for (const [id, width] of [
  ["filespace", 1440],
  ["filebox", 390],
] as const) {
  test.describe(`${id} direct and unavailable locations at ${width}`, () => {
    test.use({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      deviceScaleFactor: 1,
      colorScheme: "light",
    });

    test("copied previews close locally and history retains settings origins and unavailable records", async ({
      page,
    }) => {
      const fileId = id === "filespace" ? "file-10" : "box-7";
      const fileHash = `${base(id)}/files/${fileId}${query}`;
      await load(page, id, `/files/${fileId}`, "Q3 Studio Plan.pdf");
      let preview = page.getByRole("dialog", { name: "Q3 Studio Plan.pdf", exact: true });
      await expect(preview).toBeVisible();
      await focusInside(preview);
      const origin = new URL(page.url()).origin;
      const historyBeforeClose = await page.evaluate(() => history.length);
      await preview.getByRole("button", { name: "Close", exact: true }).click();
      await expect(preview).toHaveCount(0);
      await expectHash(page, `${base(id)}/drive${query}`);
      expect(new URL(page.url()).origin).toBe(origin);
      expect(await page.evaluate(() => history.length)).toBe(historyBeforeClose);

      const memberHash = `${base(id)}/settings/team/alex-rivera${query}`;
      await load(page, id, "/settings/team/alex-rivera");
      const ownedFile = page.getByRole("button", { name: /^Q3 Studio Plan\.pdf / });
      await expect(ownedFile).toBeVisible();
      await ownedFile.click();
      await expectHash(page, fileHash);
      preview = page.getByRole("dialog", { name: "Q3 Studio Plan.pdf", exact: true });
      await expect(preview).toBeVisible();
      await focusInside(preview);
      const previewHistoryLength = await page.evaluate(() => history.length);
      await page.keyboard.press("Escape");
      await expect(preview).toHaveCount(0);
      await expectHash(page, memberHash);
      await expect(ownedFile).toBeVisible();
      await expect(ownedFile).toBeFocused();
      await page.goForward();
      await expectHash(page, fileHash);
      await expect(preview).toBeVisible();
      await focusInside(preview);
      await page.goBack();
      await expectHash(page, memberHash);
      await expect(preview).toHaveCount(0);
      await expect(ownedFile).toBeVisible();
      expect(await page.evaluate(() => history.length)).toBe(previewHistoryLength);

      await load(page, id, "/unknown-location");
      let unavailable = page.getByRole("alert");
      await expect(unavailable).toContainText("Drive location unavailable");
      await expect(unavailable).toContainText("This link does not match a location");
      await expect(preview).toHaveCount(0);
      await load(page, id, "/files/name/Campaign%20Brief.docx");
      unavailable = page.getByRole("alert");
      await expect(unavailable).toContainText("More than one record has this name");
      await unavailable.getByRole("button", { name: "Back to Drive", exact: true }).click();
      await expectHash(page, `${base(id)}/drive${query}`);
      await expect(unavailable).toHaveCount(0);

      // Establish a real preview Forward entry before deleting within this same Drive mount.
      const rowFile = page
        .locator(".ct-drive-filename")
        .getByRole("button")
        .filter({
          has: page.getByText("Q3 Studio Plan.pdf", { exact: true }),
        });
      await expect(rowFile).toHaveCount(1);
      await expect(rowFile).toBeVisible();
      await rowFile.click();
      await expectHash(page, fileHash);
      await expect(preview).toBeVisible();
      await focusInside(preview);
      const deletionHistoryLength = await page.evaluate(() => history.length);
      await page.keyboard.press("Escape");
      await expect(preview).toHaveCount(0);
      await expectHash(page, `${base(id)}/drive${query}`);
      await expect(rowFile).toBeFocused();

      // Real local UI deletion; no navigation, reload, injected fixtures or backend write.
      const selectedFile = page.getByRole("checkbox", {
        name: "Select Q3 Studio Plan.pdf",
        exact: true,
      });
      await selectedFile.check();
      await page.getByRole("button", { name: "Move to bin", exact: true }).click();
      const confirmation = page.getByRole("dialog", { name: "Move to bin", exact: true });
      await expect(confirmation).toBeVisible();
      await focusInside(confirmation);
      await confirmation.getByRole("button", { name: "Move to bin", exact: true }).click();
      await expect(confirmation).toHaveCount(0);
      await expect(selectedFile).toHaveCount(0);
      await expectHash(page, `${base(id)}/drive${query}`);
      expect(await page.evaluate(() => history.length)).toBe(deletionHistoryLength);
      await page.goForward();
      await expectHash(page, fileHash);
      await expect(page.getByRole("alert")).toContainText(
        "This file is unavailable or has been removed",
      );
      await expect(preview).toHaveCount(0);
      expect(new URL(page.url()).origin).toBe(origin);
    });
  });
}

for (const [id, width] of [
  ["filespace", 1440],
  ["filebox", 390],
] as const) {
  test.describe(`${id} native grid preview focus at ${width}`, () => {
    test.use({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      deviceScaleFactor: 1,
      colorScheme: "light",
    });

    test("grid Close and browser Back restore the real file button without stealing Forward focus", async ({
      page,
    }) => {
      const driveHash = `${base(id)}/drive${query}`;
      const fileId = id === "filespace" ? "file-10" : "box-7";
      const fileHash = `${base(id)}/files/${fileId}${query}`;
      await load(page, id, "/drive");
      await expect(header(page).getByText("My Drive", { exact: true })).toBeVisible();

      const gridView = page.getByRole("radio", { name: "Grid view", exact: true });
      await gridView.click();
      await expect(gridView).toHaveAttribute("aria-checked", "true");
      // Keep the actual grid button addressable while the native Dialog hides background roles.
      const gridFile = page.locator(".ct-drive-grid button.ct-drive-grid-file").filter({
        has: page.getByText("Q3 Studio Plan.pdf", { exact: true }),
      });
      await expect(gridFile).toHaveCount(1);
      await expect(gridFile).toBeVisible();

      await gridFile.click();
      await expectHash(page, fileHash);
      const preview = page.getByRole("dialog", { name: "Q3 Studio Plan.pdf", exact: true });
      await expect(preview).toBeVisible();
      await focusInside(preview);
      await preview.getByRole("button", { name: "Close", exact: true }).click();
      await expect(preview).toHaveCount(0);
      await expectHash(page, driveHash);
      await expect(gridFile).toBeFocused();

      await gridFile.click();
      await expectHash(page, fileHash);
      await expect(preview).toBeVisible();
      await focusInside(preview);
      await page.goBack();
      await expectHash(page, driveHash);
      await expect(preview).toHaveCount(0);
      await expect(gridFile).toBeFocused();

      await page.goForward();
      await expectHash(page, fileHash);
      await expect(preview).toBeVisible();
      await focusInside(preview);
      await expect(gridFile).not.toBeFocused();
      await page.goBack();
      await expectHash(page, driveHash);
      await expect(preview).toHaveCount(0);
      await expect(header(page).getByText("My Drive", { exact: true })).toBeVisible();
    });
  });
}
