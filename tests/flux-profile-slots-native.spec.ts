import { expect, test, type Page } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const help = "Role, time zone, and website show on your public profile.";
const issues = new WeakMap<Page, string[]>();
type ProfileScrollProbe = {
  read: () => {
    initialScrollTop: number;
    initialScrollLeft: number;
    actualScrollTop: number;
    actualScrollLeft: number;
    scrollEvents: number;
    ended: boolean;
    trusted: boolean;
    connected: boolean;
    sameViewport: boolean;
    requiresScrollEnd: boolean;
    ready: boolean;
  };
  dispose: () => void;
};
type ProfileScrollWindow = Window & { __bricklaneProfileScrollProbe?: ProfileScrollProbe };

const originalAvatar = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><rect width="48" height="48" rx="12" fill="#0f766e"/><circle cx="24" cy="24" r="11" fill="#ccfbf1"/></svg>`;

test.beforeEach(async ({ page }) => {
  const errors: string[] = [];
  issues.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (["error", "warning"].includes(message.type())) errors.push(message.text());
  });
});

test.afterEach(async ({ page }, info) => {
  const errors = issues.get(page) ?? [];
  await info.attach("console-and-page-errors", {
    body: Buffer.from(JSON.stringify(errors, null, 2)),
    contentType: "application/json",
  });
  expect(errors).toEqual([]);
});

async function openWorkspace(page: Page, width: number) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto("/#/template-preview/flux");
  await expect(page.getByRole("heading", { name: /Agent Operations/ })).toBeVisible();
  await expect(page.locator("vite-error-overlay")).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  const sheet = page.locator('[data-mobile="true"]');
  if (width === 390) {
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  }
  const sidebar = width === 390 ? sheet : page.locator(".wf-native-sidebar");
  const workspace = sidebar.getByRole("button", { name: "Workspace", exact: true });
  if (!(await workspace.isVisible())) {
    await sidebar.getByRole("button", { name: "Settings", exact: true }).click();
  }
  await workspace.click();
  await expect(page.locator(".flux-settings-page")).toBeVisible();
  if (width === 390) {
    await expect(sheet).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(sheet).toHaveCount(0);
  }
}

for (const width of [1440, 390]) {
  test(`Flux Profile Info keyboard and native avatar chooser/remove at ${width}`, async ({
    page,
  }, info) => {
    await openWorkspace(page, width);
    const trigger = page.getByRole("button", {
      name: "Profile settings for Nick Bold",
      exact: true,
    });
    await trigger.click();
    const dialog = page.locator(".workspace-settings-shell.wf-flux-profile-dialog");
    await expect(dialog).toBeVisible();
    if (width === 390) {
      await page.evaluate(() => {
        const selector = '.wf-flux-profile-dialog [data-slot="scroll-area-viewport"]';
        const viewport = document.querySelector(selector);
        if (!(viewport instanceof HTMLElement)) throw new Error("Profile ScrollArea is missing");
        const initialScrollTop = viewport.scrollTop;
        const initialScrollLeft = viewport.scrollLeft;
        const state = {
          scrollEvents: 0,
          ended: false,
          trusted: false,
          endScrollTop: initialScrollTop,
          endScrollLeft: initialScrollLeft,
        };
        const onScroll = (event: Event) => {
          if (event.target !== viewport) return;
          state.scrollEvents += 1;
          state.ended = false;
          state.trusted = false;
        };
        const onScrollEnd = (event: Event) => {
          if (event.target !== viewport) return;
          state.ended = true;
          state.trusted = event.isTrusted;
          state.endScrollTop = viewport.scrollTop;
          state.endScrollLeft = viewport.scrollLeft;
        };
        viewport.addEventListener("scroll", onScroll, { passive: true });
        viewport.addEventListener("scrollend", onScrollEnd, { passive: true });
        (window as ProfileScrollWindow).__bricklaneProfileScrollProbe = {
          read: () => {
            const actualScrollTop = viewport.scrollTop;
            const actualScrollLeft = viewport.scrollLeft;
            const connected = viewport.isConnected;
            const sameViewport = document.querySelector(selector) === viewport;
            const requiresScrollEnd =
              actualScrollTop !== initialScrollTop ||
              actualScrollLeft !== initialScrollLeft ||
              state.scrollEvents > 0;
            const scrollFinished =
              state.ended &&
              state.trusted &&
              state.endScrollTop === actualScrollTop &&
              state.endScrollLeft === actualScrollLeft;
            return {
              initialScrollTop,
              initialScrollLeft,
              actualScrollTop,
              actualScrollLeft,
              scrollEvents: state.scrollEvents,
              ended: state.ended,
              trusted: state.trusted,
              connected,
              sameViewport,
              requiresScrollEnd,
              ready: connected && sameViewport && (!requiresScrollEnd || scrollFinished),
            };
          },
          dispose: () => {
            viewport.removeEventListener("scroll", onScroll);
            viewport.removeEventListener("scrollend", onScrollEnd);
          },
        };
      });
    }
    await dialog.getByRole("textbox", { name: "Username", exact: true }).click();
    if (width === 390) {
      try {
        await expect(dialog.getByRole("textbox", { name: "Username", exact: true })).toBeFocused();
        await expect
          .poll(() =>
            page.evaluate(() =>
              (window as ProfileScrollWindow).__bricklaneProfileScrollProbe?.read(),
            ),
          )
          .toMatchObject({ connected: true, sameViewport: true, ready: true });
      } finally {
        const observation = await page.evaluate(() => {
          const probe = (window as ProfileScrollWindow).__bricklaneProfileScrollProbe;
          const result = probe?.read();
          probe?.dispose();
          return result;
        });
        const evidence = JSON.stringify(observation ?? null, null, 2);
        await writeFile(info.outputPath("native-username-scroll-readiness.json"), evidence);
        await info.attach("native-username-scroll-readiness", {
          body: Buffer.from(evidence),
          contentType: "application/json",
        });
      }
    }
    await page.keyboard.press("Tab");
    const information = dialog.getByRole("button", { name: help, exact: true });
    await expect(information).toBeFocused();
    const tooltip = page.getByRole("tooltip", { name: help, exact: true });
    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveAttribute("data-slot", "tooltip-content");
    await expect(tooltip.locator(":scope > p")).toHaveText(help);
    const tooltipId = await tooltip.getAttribute("id");
    expect(tooltipId).toBeTruthy();
    await expect(information).toHaveAttribute("aria-describedby", tooltipId!);
    const icon = information.locator("svg");
    await expect(icon).toHaveAttribute("aria-hidden", "true");
    const geometry = JSON.stringify(
      {
        viewport: page.viewportSize(),
        control: await information.boundingBox(),
        icon: await icon.boundingBox(),
        popup: await tooltip.boundingBox(),
      },
      null,
      2,
    );
    await writeFile(info.outputPath(`native-info-geometry-${width}.json`), geometry);
    await info.attach(`native-info-geometry-${width}`, {
      body: Buffer.from(geometry),
      contentType: "application/json",
    });
    await page.screenshot({ path: info.outputPath(`info-focused-${width}.png`) });
    await page.keyboard.press("Escape");
    await expect(tooltip).toHaveCount(0);
    await expect(information).toBeFocused();
    await expect(dialog).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();

    await trigger.click();
    await expect(dialog).toBeVisible();
    const avatar = dialog.locator(".workspace-settings-avatar:visible");
    await expect(avatar).toHaveCount(1);
    const change = avatar.getByRole("button", { name: "Change", exact: true });
    const remove = avatar.getByRole("button", { name: "Remove", exact: true });
    for (const button of [change, remove]) {
      await expect(button.locator('svg[data-icon="inline-start"]')).toHaveCount(1);
      await expect(button.locator("svg")).toHaveAttribute("aria-hidden", "true");
    }
    const pendingChooser = page.waitForEvent("filechooser");
    await change.click();
    const chooser = await pendingChooser;
    expect(chooser.isMultiple()).toBe(false);
    await chooser.setFiles({
      name: `bricklane-original-avatar-${width}.svg`,
      mimeType: "image/svg+xml",
      buffer: Buffer.from(originalAvatar),
    });
    const preview = avatar.getByRole("img", { name: "Avatar", exact: true });
    await expect(preview).toHaveAttribute("src", /^blob:/);
    await expect
      .poll(() =>
        preview.evaluate(
          (image: HTMLImageElement) =>
            image.complete && image.naturalWidth > 0 && image.naturalHeight > 0,
        ),
      )
      .toBe(true);
    await expect(remove).toBeEnabled();
    await page.screenshot({ path: info.outputPath(`avatar-preview-${width}.png`) });
    await remove.click();
    await expect(avatar.locator("img")).toHaveCount(0);
    await expect(remove).toBeDisabled();
    await expect(change).toBeEnabled();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
    await expect(trigger).toBeFocused();
  });
}
