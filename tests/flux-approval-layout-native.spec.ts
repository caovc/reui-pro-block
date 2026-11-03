import { expect, test, type Locator, type Page, type TestInfo } from "@playwright/test";
import { writeFile } from "node:fs/promises";

const summaries = ["Recent Decisions", "Approval Policy", "Review Coverage"];
const policies = [
  "Auto-Approve Threshold",
  "Finance Second Approval",
  "Bulk Send Cap",
  "Irreversible Action Hold",
  "Review SLA",
];
const coverageNames = [
  "Ops Lead",
  "Finance Desk",
  "Privacy Review",
  "Safety Review",
  "Auto-Approve",
  "SLA Escalation",
];
const decisions = [
  ["APR-7415", "Renewal summary", "Approved", "Maya Perez", "1h ago"],
  ["APR-7412", "$2,150 refund", "Rejected", "Jonas Reed", "1h 30m ago"],
  ["APR-7409", "$42 credit", "Approved", "Maya Perez", "2h ago"],
  ["APR-7404", "Lead purge held", "Rejected", "Jonas Reed", "2h 40m ago"],
];
const help = {
  "Recent Decisions":
    "The last requests to get a decision, newest first, with who made it and how long ago.",
  "Approval Policy": "The rules that decide whether a request needs a human at all, and which one.",
  "Review Coverage":
    "Who is on each policy rule. Pick one to focus the queue on what it gates; a rule reading Unattended has nobody on it by design.",
};

async function navigate(page: Page, name: "Approvals" | "Overview", mobile: boolean) {
  if (mobile) {
    const opener = page.getByRole("button", { name: "Open navigation", exact: true });
    await expect(opener).toBeVisible();
    await opener.click();
    const drawer = page.getByRole("dialog");
    await expect(drawer).toBeVisible();
    await drawer.getByRole("button", { name, exact: true }).click();
    await expect(drawer).toHaveCount(0);
  } else {
    await page.getByRole("button", { name, exact: true }).click();
  }
}

function present<T>(value: T | null): T {
  expect(value).not.toBeNull();
  if (value === null) throw new Error("Required measured approval surface is absent");
  return value;
}

async function recordLayout(page: Page, layout: Locator, info: TestInfo, width: number) {
  const fonts = await page.evaluate(async () => {
    await document.fonts.ready;
    return { status: document.fonts.status, family: getComputedStyle(document.body).fontFamily };
  });
  const evidence = await layout.evaluate((root) => {
    const metric = (element: Element | null) => {
      if (!element) return null;
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return {
        tag: element.tagName,
        slot: element.getAttribute("data-slot"),
        display: style.display,
        gap: Number.parseFloat(style.gap),
        padding: [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft].map(
          Number.parseFloat,
        ),
        fontSize: Number.parseFloat(style.fontSize),
        lineHeight: Number.parseFloat(style.lineHeight),
        fontWeight: Number.parseFloat(style.fontWeight),
        marginTop: Number.parseFloat(style.marginTop),
        background: style.backgroundColor,
        borderColor: style.borderTopColor,
        rect: {
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          right: rect.right,
          bottom: rect.bottom,
        },
      };
    };
    const summary = root.querySelector(".wf-approval-summary-grid");
    const frames = [...(summary?.querySelectorAll(':scope > [data-slot="frame"]') ?? [])];
    const policy = frames.find(
      (frame) =>
        frame.querySelector('[data-slot="frame-panel-title"]')?.textContent === "Approval Policy",
    );
    const panel = policy?.querySelector('[data-slot="frame-panel"]');
    return {
      viewport: { width: innerWidth, height: innerHeight },
      documentWidth: document.documentElement.scrollWidth,
      layout: metric(root),
      queue: metric(root.querySelector(":scope > .wf-edge-table")),
      summary: metric(summary),
      summaryColumns: summary ? getComputedStyle(summary).gridTemplateColumns : "",
      frames: frames.map(metric),
      policyPanel: metric(panel ?? null),
      policyRows: [...(panel?.children ?? [])].map((row) => ({
        row: metric(row),
        title: metric(row.querySelector("a")),
        description: metric(row.querySelector("p")),
        icon: metric(row.querySelector('[data-slot="icon-tile"]')),
      })),
      timeline: [...root.querySelectorAll('[data-slot="timeline-item"]')].map((item) => ({
        item: metric(item),
        indicator: metric(item.querySelector('[data-slot="timeline-indicator"]')),
        separator: metric(item.querySelector('[data-slot="timeline-separator"]')),
      })),
      coverage: [...root.querySelectorAll('button[data-slot="item"]')].map(metric),
    };
  });
  await writeFile(
    info.outputPath("approval-layout-actual.json"),
    JSON.stringify({ fonts, ...evidence }, null, 2) + "\n",
  );
  expect(fonts.status).toBe("loaded");
  expect(evidence.documentWidth).toBeLessThanOrEqual(evidence.viewport.width);
  const root = present(evidence.layout);
  const queue = present(evidence.queue);
  const summary = present(evidence.summary);
  const frames = evidence.frames.map(present);
  expect(Math.abs(queue.rect.width - root.rect.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(queue.rect.x - root.rect.x)).toBeLessThanOrEqual(1);
  expect(Math.abs(summary.rect.width - root.rect.width)).toBeLessThanOrEqual(1);
  expect(Math.abs(summary.rect.y - queue.rect.bottom - 16)).toBeLessThanOrEqual(1);
  expect(frames).toHaveLength(3);
  if (width === 1440) {
    expect(evidence.summaryColumns.trim().split(/\s+/)).toHaveLength(3);
    for (const frame of frames) {
      expect(Math.abs(frame.rect.y - frames[0].rect.y)).toBeLessThanOrEqual(1);
      expect(Math.abs(frame.rect.width - frames[0].rect.width)).toBeLessThanOrEqual(1);
    }
    for (let index = 1; index < frames.length; index++) {
      expect(
        Math.abs(frames[index].rect.x - frames[index - 1].rect.right - 16),
      ).toBeLessThanOrEqual(1);
    }
  } else {
    expect(evidence.summaryColumns.trim().split(/\s+/)).toHaveLength(1);
    for (const frame of frames) {
      expect(Math.abs(frame.rect.x - summary.rect.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(frame.rect.width - summary.rect.width)).toBeLessThanOrEqual(1);
    }
    for (let index = 1; index < frames.length; index++) {
      expect(
        Math.abs(frames[index].rect.y - frames[index - 1].rect.bottom - 16),
      ).toBeLessThanOrEqual(1);
    }
  }
  const panel = present(evidence.policyPanel);
  expect(panel.padding).toEqual([14, 12, 14, 12]);
  expect(panel.gap).toBe(16);
  expect(evidence.policyRows).toHaveLength(5);
  for (const value of evidence.policyRows) {
    const row = present(value.row);
    const title = present(value.title);
    const description = present(value.description);
    const icon = present(value.icon);
    expect(row.gap).toBe(10);
    expect([title.fontSize, title.lineHeight, title.fontWeight]).toEqual([14, 17.5, 500]);
    expect([description.fontSize, description.lineHeight, description.fontWeight]).toEqual([
      12, 16.5, 400,
    ]);
    expect(description.marginTop).toBe(2);
    expect(Math.abs(icon.rect.width - 40)).toBeLessThanOrEqual(1);
    expect(Math.abs(icon.rect.height - 40)).toBeLessThanOrEqual(1);
    expect(title.rect.width).toBeGreaterThan(0);
    expect(description.rect.height).toBeGreaterThan(0);
  }
  expect(evidence.timeline).toHaveLength(4);
  for (let index = 0; index < evidence.timeline.length; index++) {
    const value = evidence.timeline[index];
    const indicator = present(value.indicator);
    const separator = present(value.separator);
    expect(Math.abs(indicator.rect.width - 20)).toBeLessThanOrEqual(1);
    expect(Math.abs(indicator.rect.height - 20)).toBeLessThanOrEqual(1);
    if (index < 3) {
      expect(separator.display).toBe("block");
      expect(Math.abs(separator.rect.width - 2)).toBeLessThanOrEqual(1);
      expect(Math.abs(separator.rect.height - 44)).toBeLessThanOrEqual(1);
    } else {
      expect(separator.display).toBe("none");
      expect(separator.rect.width).toBe(0);
      expect(separator.rect.height).toBe(0);
    }
  }
}

async function captureInfo(page: Page, title: keyof typeof help, info: TestInfo) {
  const trigger = page.getByRole("button", { name: `What ${title} shows`, exact: true });
  // The real click owns scrollIntoView. A natural Tab round-trip then opens the free Tooltip through keyboard focus.
  await trigger.click();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Shift+Tab");
  await expect(trigger).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveText(help[title]);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await expect(trigger).toBeInViewport({ ratio: 1 });
  await expect(page.locator(".wf-header")).toBeInViewport({ ratio: 1 });
  await page.screenshot({
    path: info.outputPath(`${title.toLowerCase().replaceAll(" ", "-")}-viewport.png`),
    fullPage: false,
  });
}

async function pressed(items: Locator, selected: number | null) {
  await expect
    .poll(() =>
      items.evaluateAll((elements) =>
        elements.map((element) => element.getAttribute("aria-pressed")),
      ),
    )
    .toEqual(coverageNames.map((_, index) => (index === selected ? "true" : "false")));
}

async function coverageToast(page: Page, description: string) {
  const toast = page.locator("[data-sonner-toast]").filter({ hasText: description }).first();
  await expect(toast).toBeVisible();
  await expect(toast.getByText("Coverage focused", { exact: true })).toBeVisible();
  await expect(toast.getByText(description, { exact: true })).toBeVisible();
}

for (const width of [1440, 390]) {
  test(`Flux approval layout ${width}: measured lower cards and native coverage without queue mutation`, async ({
    page,
  }, info) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(`pageerror: ${error.message}`));
    page.on("console", (message) => {
      if (["error", "warning"].includes(message.type()))
        faults.push(`${message.type()}: ${message.text()}`);
    });
    const mobile = width === 390;
    await page.setViewportSize({ width, height: mobile ? 844 : 1000 });
    await page.goto("./#/template-preview/flux");
    await navigate(page, "Approvals", mobile);
    const layout = page.locator(".wf-flux-approval-layout");
    await expect(layout).toBeVisible();
    const summary = layout.locator(".wf-approval-summary-grid");
    expect((await summary.getAttribute("class"))?.split(/\s+/)).toEqual(
      expect.arrayContaining(["@2xl:grid-cols-2", "@4xl:grid-cols-3"]),
    );
    const frames = summary.locator(':scope > [data-slot="frame"]');
    await expect(frames).toHaveCount(3);
    await expect(frames.locator('[data-slot="frame-panel-title"]')).toHaveText(summaries);
    const recent = frames.nth(0);
    const policy = frames.nth(1);
    const coverage = frames.nth(2);
    for (const slot of ["switch", "field", "item", "separator"])
      await expect(policy.locator(`[data-slot="${slot}"]`)).toHaveCount(0);
    await expect(policy.locator("label")).toHaveCount(0);
    await expect(policy.locator('[data-slot="icon-tile"]')).toHaveCount(5);
    await expect(policy.getByRole("link")).toHaveText(policies);
    for (const slot of [
      "timeline-item",
      "timeline-indicator",
      "timeline-separator",
      "timeline-header",
      "timeline-title",
      "timeline-content",
    ])
      await expect(recent.locator(`[data-slot="${slot}"]`)).toHaveCount(4);
    await expect(recent.locator('[data-slot="timeline-separator"]').last()).toBeHidden();
    for (let index = 0; index < decisions.length; index++) {
      for (const value of decisions[index])
        await expect(recent.locator('[data-slot="timeline-item"]').nth(index)).toContainText(value);
    }
    const items = coverage.locator('[data-slot="item"]');
    await expect(items).toHaveCount(6);
    expect(
      await items.evaluateAll((elements) => elements.map((element) => element.tagName)),
    ).toEqual(Array(6).fill("BUTTON"));
    for (const slot of ["item-content", "item-title", "item-media", "item-description"])
      await expect(coverage.locator(`[data-slot="${slot}"]`)).toHaveCount(6);
    await pressed(items, null);
    await recordLayout(page, layout, info, width);
    const queue = layout.locator(":scope > .wf-edge-table");
    const search = queue.getByRole("textbox", { name: "Search approvals", exact: true });
    const ops = coverage.getByRole("button", { name: "Focus Ops Lead coverage", exact: true });
    await queue.getByRole("button", { name: "Agent", exact: true }).click();
    await expect(queue.getByRole("columnheader", { name: "Agent", exact: true })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await queue.getByRole("button", { name: "Go to page 2", exact: true }).click();
    await expect(queue.getByText("7 - 8 of 8", { exact: true })).toBeVisible();
    await expect(queue.locator("tbody tr")).toHaveCount(2);
    const secondPageBefore = {
      rows: await queue.locator("tbody").innerText(),
      ids: await queue
        .locator("tbody tr")
        .evaluateAll((rows) => rows.map((row) => row.textContent?.match(/APR-\d+/)?.[0] ?? "")),
      sorting: await queue
        .locator("th")
        .evaluateAll((headers) => headers.map((header) => header.getAttribute("aria-sort"))),
      query: await search.inputValue(),
      risk: await queue.getByRole("combobox", { name: "Risk filter", exact: true }).innerText(),
      status: await queue.getByRole("combobox", { name: "Status filter", exact: true }).innerText(),
    };
    expect(secondPageBefore.ids).toEqual(["APR-7412", "APR-7430"]);
    await ops.click();
    await expect(ops).toBeFocused();
    await pressed(items, 0);
    await expect(queue.getByText("7 - 8 of 8", { exact: true })).toBeVisible();
    await expect(queue.locator("tbody tr")).toHaveCount(2);
    const secondPageAfter = {
      rows: await queue.locator("tbody").innerText(),
      ids: await queue
        .locator("tbody tr")
        .evaluateAll((rows) => rows.map((row) => row.textContent?.match(/APR-\d+/)?.[0] ?? "")),
      sorting: await queue
        .locator("th")
        .evaluateAll((headers) => headers.map((header) => header.getAttribute("aria-sort"))),
      query: await search.inputValue(),
      risk: await queue.getByRole("combobox", { name: "Risk filter", exact: true }).innerText(),
      status: await queue.getByRole("combobox", { name: "Status filter", exact: true }).innerText(),
    };
    expect(secondPageAfter).toEqual(secondPageBefore);
    await writeFile(
      info.outputPath("coverage-keeps-sorted-second-page.json"),
      JSON.stringify({ before: secondPageBefore, after: secondPageAfter }, null, 2) + "\n",
    );
    await search.fill("refund");
    await expect(queue.getByText("1 - 2 of 2", { exact: true })).toBeVisible();
    await expect(queue.locator("tbody tr")).toHaveCount(2);
    const rowsBefore = await queue.locator("tbody").innerText();
    const riskBefore = await queue
      .getByRole("combobox", { name: "Risk filter", exact: true })
      .innerText();
    const statusBefore = await queue
      .getByRole("combobox", { name: "Status filter", exact: true })
      .innerText();
    for (const title of summaries) await captureInfo(page, title as keyof typeof help, info);
    const finance = coverage.getByRole("button", {
      name: "Focus Finance Desk coverage",
      exact: true,
    });
    await ops.click();
    await expect(ops).toBeFocused();
    await expect(page.locator(".wf-header")).toBeInViewport({ ratio: 1 });
    await pressed(items, 0);
    await expect(ops).toHaveClass(/border-primary[/]40/);
    expect((await ops.getAttribute("class"))?.split(/\s+/)).toContain("bg-muted");
    await coverageToast(page, "Ops Lead: Breached high-risk.");
    await ops.click();
    await pressed(items, 0);
    await coverageToast(page, "Ops Lead: Breached high-risk.");
    await finance.click();
    await expect(finance).toBeFocused();
    await pressed(items, 1);
    await coverageToast(page, "Finance Desk: Refunds over $500.");
    await page.keyboard.press("Shift+Tab");
    await expect(ops).toBeFocused();
    await page.keyboard.press("Space");
    await pressed(items, 0);
    await coverageToast(page, "Ops Lead: Breached high-risk.");
    await expect(ops).toBeFocused();
    for (const name of coverageNames.slice(1)) {
      await page.keyboard.press("Tab");
      const card = coverage.getByRole("button", { name: `Focus ${name} coverage`, exact: true });
      await expect(card).toBeFocused();
      await expect(card).toBeInViewport({ ratio: 1 });
    }
    await expect(page.locator(".wf-header")).toBeInViewport({ ratio: 1 });
    const scrollBoundary = await page.evaluate(() => {
      const main = document.querySelector(".wf-main");
      const content = document.querySelector(".wf-content");
      const last = document.querySelector('button[aria-label="Focus SLA Escalation coverage"]');
      if (!main || !content || !last) throw new Error("Missing natural scroll boundary");
      return {
        outerScrollTop: main.scrollTop,
        innerScrollTop: content.scrollTop,
        main: main.getBoundingClientRect().toJSON(),
        content: content.getBoundingClientRect().toJSON(),
        lastCard: last.getBoundingClientRect().toJSON(),
      };
    });
    expect(scrollBoundary.outerScrollTop).toBe(0);
    expect(scrollBoundary.content.bottom).toBeLessThanOrEqual(scrollBoundary.main.bottom + 1);
    expect(scrollBoundary.content.top).toBeGreaterThanOrEqual(scrollBoundary.main.top);
    if (mobile) expect(scrollBoundary.innerScrollTop).toBeGreaterThan(0);
    await writeFile(
      info.outputPath("coverage-bottom-scroll.json"),
      JSON.stringify(scrollBoundary, null, 2) + "\n",
    );
    await page.screenshot({
      path: info.outputPath("coverage-bottom-keyboard-viewport.png"),
      fullPage: false,
    });
    await expect(search).toHaveValue("refund");
    await expect.poll(() => queue.locator("tbody").innerText()).toBe(rowsBefore);
    await expect(queue.getByRole("combobox", { name: "Risk filter", exact: true })).toHaveText(
      riskBefore,
    );
    await expect(queue.getByRole("combobox", { name: "Status filter", exact: true })).toHaveText(
      statusBefore,
    );
    await writeFile(
      info.outputPath("coverage-selected-style.json"),
      JSON.stringify(
        await ops.evaluate((element) => ({
          className: element.className,
          ariaPressed: element.getAttribute("aria-pressed"),
          background: getComputedStyle(element).backgroundColor,
          borderColor: getComputedStyle(element).borderTopColor,
        })),
        null,
        2,
      ) + "\n",
    );
    const originalURL = page.url();
    const firstPolicy = policy.getByRole("link", { name: "Auto-Approve Threshold", exact: true });
    await firstPolicy.click();
    await expect(firstPolicy).toBeFocused();
    expect(page.url()).toBe(originalURL);
    await expect(layout).toBeVisible();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await navigate(page, "Overview", mobile);
    await expect(layout).toHaveCount(0);
    await navigate(page, "Approvals", mobile);
    await expect(layout).toBeVisible();
    await pressed(page.locator('.wf-approval-summary-grid button[data-slot="item"]'), null);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
      width,
    );
    expect(faults).toEqual([]);
  });
}
