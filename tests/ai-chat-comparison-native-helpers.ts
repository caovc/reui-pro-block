import { expect, type Page, type TestInfo } from "@playwright/test";
export type ComparisonPrimitive = "base" | "radix";
export async function openComparison(
  page: Page,
  baseURL: string | undefined,
  primitive: ComparisonPrimitive,
  width = 1440,
  style = "nova",
) {
  if (!baseURL) throw new Error("An exact dual production preview is required");
  const faults: string[] = [];
  page.on("pageerror", (error) => faults.push(error.message));
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type())) faults.push(message.text());
  });
  page.on("requestfailed", (request) =>
    faults.push(
      `${request.method()} ${new URL(request.url()).pathname}: ${request.failure()?.errorText}`,
    ),
  );
  const root = new URL("./", baseURL);
  if (root.pathname.endsWith("/base/")) root.pathname = root.pathname.slice(0, -5);
  const url = new URL(primitive === "base" ? "base/" : "./", root);
  url.hash =
    "/preview/ai-agents/ai-chat/ai-chat-7?" +
    new URLSearchParams({ preset: JSON.stringify({ primitive, style, mode: "light" }) });
  await page.route("**/*", (route) => {
    const request = route.request();
    if (
      new URL(request.url()).origin !== url.origin ||
      !["GET", "HEAD"].includes(request.method())
    ) {
      faults.push(`Blocked unexpected ${request.method()} ${new URL(request.url()).origin}`);
      return route.abort("blockedbyclient");
    }
    return route.continue();
  });
  await page.setViewportSize({ width, height: width === 390 ? 844 : 1000 });
  await page.goto(url.href);
  await expect(page.locator("html")).toHaveAttribute("data-ui-primitive", primitive);
  await expect(page.locator("html")).toHaveAttribute("data-ui-style", style);
  await expect
    .poll(() => page.locator("#preview-preset").textContent())
    .toContain(style === "nova" ? "Bricklane global theme" : `Bricklane: ${style} component style`);
  const shell = page.locator('[data-ai-chat="comparison"]');
  await expect(shell.getByRole("heading", { name: "Model Comparison", exact: true })).toBeVisible();
  await expect(shell.getByRole("button", { name: /^Prefer A,/ })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return { shell, faults };
}
export async function comparisonEvidence(page: Page, info: TestInfo, name: string) {
  await page.screenshot({ path: info.outputPath(name + ".png"), fullPage: false });
  const geometry = await page.locator('[data-ai-chat="comparison"]').evaluate((root) => {
    const rect = (node: Element) => {
      const r = node.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, bottom: r.bottom };
    };
    const visible = (node: Element) =>
      Boolean(node.getClientRects().length) && getComputedStyle(node).visibility !== "hidden";
    return {
      primitive: document.documentElement.dataset.uiPrimitive,
      style: document.documentElement.dataset.uiStyle,
      root: rect(root),
      viewport: {
        width: innerWidth,
        height: innerHeight,
        scrollWidth: document.documentElement.scrollWidth,
        scrollHeight: document.documentElement.scrollHeight,
      },
      header: rect(root.querySelector(".comparison-header")!),
      panes: [...root.querySelectorAll(".comparison-pane")].filter(visible).map(rect),
      score: rect(root.querySelector(".comparison-score")!),
      composer: rect(root.querySelector(".comparison-composer")!),
      controls: [...root.querySelectorAll('button,[role="combobox"],textarea')]
        .filter(visible)
        .map((node) => ({
          name: node.getAttribute("aria-label") || node.textContent,
          rect: rect(node),
        })),
    };
  });
  await info.attach(name + "-geometry", {
    body: JSON.stringify(geometry, null, 2),
    contentType: "application/json",
  });
  expect(geometry.root.x).toBe(0);
  expect(geometry.root.y).toBe(0);
  expect(geometry.root.width).toBe(geometry.viewport.width);
  expect(geometry.root.height).toBe(geometry.viewport.height);
  expect(geometry.viewport.scrollWidth).toBe(geometry.viewport.width);
  expect(geometry.viewport.scrollHeight).toBe(geometry.viewport.height);
  expect(geometry.header.height).toBe(geometry.viewport.width === 390 ? 92 : 112);
  expect(geometry.score.height).toBe(geometry.viewport.width === 390 ? 106 : 90);
  for (const pane of geometry.panes) {
    expect(pane.x).toBeGreaterThan(0);
    expect(pane.right).toBeLessThan(geometry.viewport.width);
    expect(pane.y).toBeGreaterThanOrEqual(geometry.header.bottom);
    expect(pane.bottom).toBeLessThanOrEqual(geometry.score.y);
  }
  expect(geometry.composer.bottom).toBeLessThanOrEqual(geometry.viewport.height);
  const send = geometry.controls.find(
    (control) => control.name === "Send to both models" || control.name === "Stop generating",
  );
  expect(send).toBeTruthy();
  expect(send!.rect.bottom).toBeLessThanOrEqual(geometry.viewport.height);
  expect(send!.rect.right).toBeLessThanOrEqual(geometry.viewport.width);
  return geometry;
}
