import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

// Unexecuted narrow regression proposal. Reuses the real free ReUI Badge and
// NumberField; browser CSS parsing compares the live token without fixed colors.
async function badgeSnapshot(badge: Locator) {
  return badge.evaluate((element) => {
    const style = getComputedStyle(element);
    const token = style.getPropertyValue("--success").trim();
    if (
      !token ||
      /var\(/i.test(token) ||
      /^(transparent|currentcolor|inherit|initial|unset|revert(?:-layer)?)$/i.test(token) ||
      !CSS.supports("color", token)
    ) {
      throw new Error("The actual Badge has no resolved, nontransparent --success color token");
    }
    if (
      !style.backgroundColor ||
      /var\(/i.test(style.backgroundColor) ||
      !CSS.supports("color", style.backgroundColor)
    ) {
      throw new Error("The actual Badge computed background color cannot be parsed");
    }
    const rgba = (color: string) => {
      // OffscreenCanvas is not a DOM node. Only its isolated paint buffer changes;
      // no element, attribute, inline style or document state is written.
      const canvas = new OffscreenCanvas(1, 1);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Browser CSS-color parser is unavailable");
      context.fillStyle = color;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    return {
      className: element.className,
      slot: element.getAttribute("data-slot"),
      backgroundColor: style.backgroundColor,
      successToken: token,
      successTokenRGBA: rgba(token),
      backgroundRGBA: rgba(style.backgroundColor),
      backgroundImage: style.backgroundImage,
      boxShadow: style.boxShadow,
      backgroundOrigin: style.backgroundOrigin,
      borderRadius: style.borderRadius,
    };
  });
}

type BadgeProof = Awaited<ReturnType<typeof badgeSnapshot>> & {
  state: string;
  seats: string;
  proPrice: string;
  teamPrice: string;
  documentWidth: number;
  viewportWidth: number;
  screenshot: string;
};

async function assertBadge(
  page: Page,
  section: Locator,
  state: string,
  info: TestInfo,
  initial?: Awaited<ReturnType<typeof badgeSnapshot>>,
): Promise<BadgeProof> {
  const badge = section.locator('.ssp-featured .ssp-popular[data-slot="badge"]');
  await expect(badge).toHaveCount(1);
  await expect(badge).toBeVisible();
  await expect(badge).toHaveText("Most Popular");
  // The actual official free Badge exposes its success variant through CVA classes.
  // It does not expose a data-variant prop; no invented attribute is required.
  await expect(badge).toHaveClass(/(?:^|\s)bg-success(?:\s|$)/);
  await expect(badge).toHaveClass(/(?:^|\s)text-white(?:\s|$)/);
  const snapshot = await badgeSnapshot(badge);
  expect(snapshot.slot).toBe("badge");
  expect(snapshot.successTokenRGBA[3]).toBeGreaterThan(0);
  expect(snapshot.backgroundRGBA).toEqual(snapshot.successTokenRGBA);
  expect(snapshot.backgroundImage).toContain("linear-gradient(");
  expect(snapshot.boxShadow).not.toBe("none");
  expect(snapshot.boxShadow).toMatch(/[1-9][\d.]*px/);
  expect(snapshot.backgroundOrigin).toBe("border-box");
  if (initial) {
    expect(snapshot.backgroundImage).toBe(initial.backgroundImage);
    expect(snapshot.boxShadow).toBe(initial.boxShadow);
    expect(snapshot.successTokenRGBA).toEqual(initial.successTokenRGBA);
  }
  const bounds = await page.evaluate(() => ({
    documentWidth: document.documentElement.scrollWidth,
    viewportWidth: innerWidth,
  }));
  expect(bounds.documentWidth).toBeLessThanOrEqual(bounds.viewportWidth);
  const screenshot = info.outputPath(`${state}.png`);
  await page.screenshot({ path: screenshot, fullPage: true });
  return {
    ...snapshot,
    state,
    seats: await section.getByRole("textbox", { name: "Seats", exact: true }).inputValue(),
    proPrice: (await section.getByLabel("Pro price", { exact: true }).textContent())!,
    teamPrice: (await section.getByLabel("Team price", { exact: true }).textContent())!,
    ...bounds,
    screenshot,
  };
}

async function prices(section: Locator, pro: string, team: string, seats: string) {
  await expect(section.getByLabel("Pro price", { exact: true })).toHaveText(pro);
  await expect(section.getByLabel("Team price", { exact: true })).toHaveText(team);
  await expect(section.getByRole("textbox", { name: "Seats", exact: true })).toHaveValue(seats);
}

for (const width of [1440, 390]) {
  test(`Pricing1 ${width} real success Badge survives billing cycles and native seat increment`, async ({
    page,
    browser,
  }, info) => {
    const proof: BadgeProof[] = [];
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    try {
      await page.setViewportSize({ width, height: width === 390 ? 844 : 1100 });
      // Actual Pricing1 entry and real control locators from pricing-seat-stepper.spec.ts.
      await page.goto("./#/preview/marketing/pricing/pricing-1");
      const section = page.locator(".seat-stepper-pricing");
      await expect(section).toBeVisible();
      const monthly = section.getByRole("tab", { name: "Monthly", exact: true });
      const yearly = section.getByRole("tab", { name: "Yearly Save 20%", exact: true });
      await expect(yearly).toHaveAttribute("aria-selected", "true");
      await prices(section, "$28", "$100", "5");
      const initial = await assertBadge(page, section, "initial-yearly-5", info);
      proof.push(initial);

      await monthly.click();
      await expect(monthly).toHaveAttribute("aria-selected", "true");
      await prices(section, "$35", "$125", "5");
      proof.push(await assertBadge(page, section, "monthly-5", info, initial));

      await yearly.click();
      await expect(yearly).toHaveAttribute("aria-selected", "true");
      await prices(section, "$28", "$100", "5");
      proof.push(await assertBadge(page, section, "yearly-5-again", info, initial));

      await section.getByRole("button", { name: "Increase", exact: true }).click();
      await prices(section, "$28", "$120", "6");
      await expect(
        section.getByRole("button", { name: "6 team seats", exact: true }),
      ).toBeVisible();
      proof.push(await assertBadge(page, section, "yearly-after-increase-6", info, initial));

      await monthly.click();
      await expect(monthly).toHaveAttribute("aria-selected", "true");
      await prices(section, "$35", "$150", "6");
      proof.push(await assertBadge(page, section, "monthly-6", info, initial));

      await yearly.click();
      await expect(yearly).toHaveAttribute("aria-selected", "true");
      await prices(section, "$28", "$120", "6");
      proof.push(await assertBadge(page, section, "final-yearly-6", info, initial));
      expect(errors).toEqual([]);
    } finally {
      const sourceSHA256: Record<string, string> = {};
      for (const filename of [
        "src/blocks/commerce/pricing-seat-stepper.tsx",
        "src/blocks/commerce/pricing-seat-stepper.css",
        "src/components/reui/badge.tsx",
        "src/index.css",
      ]) {
        sourceSHA256[filename] = createHash("sha256")
          .update(await readFile(join(process.cwd(), filename)))
          .digest("hex");
      }
      await writeFile(
        info.outputPath("pricing1-success-badge-proof.json"),
        JSON.stringify(
          {
            width,
            browser: browser.browserType().name(),
            browserVersion: browser.version(),
            testTimeout: info.timeout,
            configuredRetries: info.project.retries,
            sourceSHA256,
            colorComparison:
              "Live computed --success and background converted by isolated OffscreenCanvas; no DOM writes or fixed color.",
            proof,
            errors,
          },
          null,
          2,
        ) + "\n",
        "utf8",
      );
    }
  });
}
