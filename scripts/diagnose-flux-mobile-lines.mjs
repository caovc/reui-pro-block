import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import { chromium } from "playwright";

const require = createRequire(import.meta.url);
const output = process.env.DIAGNOSTIC_DIR || "/tmp/bricklane-flux-mobile-lines";
const previewURL = process.env.PREVIEW_URL || "http://127.0.0.1:4173";
// Existing phase1.json and phase2/evidence.json record this exact Workspace URL.
const publicURL = "https://flux-agentops.reui.io/settings/workspace";
const titles = [
  "Retry a failed step once",
  "Halt the workspace on a spend spike",
  "Default model",
  "Concurrency ceiling",
  "Step timeout",
  "Workspace operators",
  "Keep full run traces",
  "Redact secrets in traces",
];
const sha256 = (bytes) => createHash("sha256").update(bytes).digest("hex");
const errorRecord = (error) => ({ message: error.message, stack: error.stack });
let previewProcess;
let previewLog = "";

async function startPreview() {
  if (process.env.START_PREVIEW !== "1") return;
  const url = new URL(previewURL);
  previewProcess = spawn(
    "npm",
    ["run", "preview", "--", "--host", url.hostname, "--port", url.port, "--strictPort"],
    {
      detached: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  // Await the official server's listening output, not a layout sleep or test retry.
  await new Promise((resolve, reject) => {
    const deadline = setTimeout(() => reject(new Error("Preview startup exceeded 30000ms")), 30000);
    let settled = false;
    const finish = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(deadline);
      if (error) reject(error);
      else resolve();
    };
    previewProcess.once("error", finish);
    previewProcess.once("exit", (code) =>
      finish(new Error(`Preview exited before probe: ${code}`)),
    );
    for (const stream of [previewProcess.stdout, previewProcess.stderr]) {
      stream.on("data", (chunk) => {
        previewLog += chunk.toString();
        if (/Local:/.test(previewLog)) finish();
      });
    }
  });
}

async function capture(page) {
  return page.evaluate((expectedTitles) => {
    const directText = (element) =>
      [...element.childNodes]
        .filter((node) => node.nodeType === Node.TEXT_NODE)
        .map((node) => node.textContent)
        .join("")
        .trim();
    const allTitles = [...document.querySelectorAll('[data-slot="item-title"]')];
    const selected = expectedTitles.map((title) => {
      const matches = allTitles.filter((element) => directText(element) === title);
      if (matches.length !== 1)
        throw new Error(`True Workspace title ${title}: expected1, found${matches.length}`);
      return matches[0];
    });
    const describe = (element) => {
      if (!element) return null;
      const r = element.getBoundingClientRect();
      const s = getComputedStyle(element);
      return {
        tag: element.tagName,
        text: element.textContent,
        rect: [r.x, r.y, r.width, r.height],
        client: [element.clientWidth, element.clientHeight],
        scroll: [element.scrollWidth, element.scrollHeight],
        font: {
          family: s.fontFamily,
          size: s.fontSize,
          weight: s.fontWeight,
          lineHeight: s.lineHeight,
          letterSpacing: s.letterSpacing,
          variationSettings: s.fontVariationSettings,
          featureSettings: s.fontFeatureSettings,
        },
        display: s.display,
        flex: s.flex,
        gap: s.gap,
        padding: s.padding,
        borderWidth: s.borderWidth,
        boxSizing: s.boxSizing,
        whiteSpace: s.whiteSpace,
        overflow: [s.overflowX, s.overflowY],
        transform: s.transform,
      };
    };
    const textLines = (element, directOnly = false) => {
      if (!element) return null;
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const lines = [];
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (directOnly && node.parentElement !== element) continue;
        for (let i = 0; i < node.textContent.length; i++) {
          const range = document.createRange();
          range.setStart(node, i);
          range.setEnd(node, i + 1);
          const r = range.getBoundingClientRect();
          let line = lines.find((candidate) => Math.abs(candidate.y - r.y) < 0.25);
          if (!line) {
            line = { y: r.y, text: "", characters: [] };
            lines.push(line);
          }
          line.text += node.textContent[i];
          line.characters.push({ text: node.textContent[i], rect: [r.x, r.y, r.width, r.height] });
        }
      }
      return lines;
    };
    const frames = [...new Set(selected.map((title) => title.closest('[data-slot="frame"]')))];
    const rows = selected.map((title) => {
      const row = title.closest('[data-slot="item"]');
      if (!row) throw new Error(`Workspace row missing: ${directText(title)}`);
      const description = row.querySelector('[data-slot="item-description"]');
      const actions = row.querySelector('[data-slot="item-actions"]');
      const ancestors = [];
      for (let parent = title.parentElement; parent; parent = parent.parentElement) {
        ancestors.push({ slot: parent.getAttribute("data-slot"), ...describe(parent) });
        if (parent === document.body) break;
      }
      return {
        titleText: directText(title),
        row: describe(row),
        title: describe(title),
        titleAnonymousTextLines: textLines(title, true),
        badge: describe(title.querySelector('[data-slot="badge"]')),
        content: describe(row.querySelector('[data-slot="item-content"]')),
        icon: describe(row.querySelector('[data-slot="item-media"]')),
        actions: describe(actions),
        actionControl: describe(actions?.querySelector('button,[role="switch"]')),
        description: describe(description),
        descriptionLines: textLines(description),
        ancestors,
      };
    });
    return {
      samplePerformanceNow: performance.now(),
      sampleWallTime: Date.now(),
      url: location.href,
      documentTitle: document.title,
      userAgent: navigator.userAgent,
      language: navigator.language,
      viewport: [innerWidth, innerHeight],
      devicePixelRatio,
      fontFaceSetStatus: document.fonts.status,
      fontFaces: [...document.fonts].map((font) => ({
        family: font.family,
        weight: font.weight,
        style: font.style,
        status: font.status,
      })),
      pageGeometry: describe(document.documentElement),
      frames: frames.map(describe),
      rows,
      nativeAnimations: document.getAnimations().map((animation) => ({
        playState: animation.playState,
        currentTime: animation.currentTime,
        timing: animation.effect?.getComputedTiming(),
      })),
      activeElement: {
        tag: document.activeElement.tagName,
        text: document.activeElement.textContent,
        ariaLabel: document.activeElement.getAttribute("aria-label"),
      },
      fontResources: performance
        .getEntriesByType("resource")
        .filter((entry) => /woff|font/i.test(entry.name))
        .map((entry) => ({
          name: entry.name,
          startTime: entry.startTime,
          duration: entry.duration,
          transferSize: entry.transferSize,
        })),
    };
  }, titles);
}

async function actualFonts(context, page) {
  const cdp = await context.newCDPSession(page);
  try {
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector: '[data-slot="item-title"]',
    });
    const nodes = await Promise.all(
      nodeIds.map(async (nodeId) => ({
        nodeId,
        ...(await cdp.send("DOM.getOuterHTML", { nodeId })),
      })),
    );
    const result = [];
    for (const title of titles) {
      const node = nodes.find((candidate) => candidate.outerHTML.includes(`>${title}<`));
      if (!node) throw new Error(`CDP title missing: ${title}`);
      result.push({
        title,
        ...(await cdp.send("CSS.getPlatformFontsForNode", { nodeId: node.nodeId })),
      });
    }
    return result;
  } finally {
    await cdp.detach();
  }
}

async function probe(browser, kind) {
  const record = {
    kind,
    status: "IN_PROGRESS",
    phases: [],
    console: [],
    pageErrors: [],
    fontResponses: [],
    blockedRequests: [],
  };
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);
  const fontTasks = [];
  page.on("console", (m) => record.console.push({ type: m.type(), text: m.text() }));
  page.on("pageerror", (error) => record.pageErrors.push(errorRecord(error)));
  page.on("response", (response) => {
    if (!/woff|font/i.test(response.url())) return;
    fontTasks.push(
      (async () => {
        const entry = {
          url: response.url(),
          status: response.status(),
          observedUTC: new Date().toISOString(),
          requestTiming: response.request().timing(),
        };
        try {
          const body = await response.body();
          entry.bytes = body.length;
          entry.sha256 = sha256(body);
        } catch (error) {
          entry.bodyReadError = error.message;
        }
        record.fontResponses.push(entry);
      })(),
    );
  });
  try {
    if (kind === "public") {
      await page.route("**/*", async (route) => {
        const request = route.request();
        if (!["GET", "HEAD"].includes(request.method())) {
          record.blockedRequests.push({ method: request.method(), url: request.url() });
          await route.abort();
        } else await route.continue();
      });
      await page.goto(publicURL, { waitUntil: "networkidle" });
      await page
        .getByRole("heading", { name: "Workspace settings", exact: true })
        .waitFor({ state: "attached" });
      await page.getByText("Autonomy", { exact: true }).waitFor({ state: "visible" });
    } else {
      await page.goto(`${previewURL}/#/template-preview/flux`, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      await page.locator(".wf-root.wf-agentops").waitFor({ state: "visible" });
      await page.getByRole("heading", { name: /Agent Operations/ }).waitFor({ state: "visible" });
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      const sheet = page.locator('[data-mobile="true"]');
      const child = sheet.getByRole("button", { name: "Workspace", exact: true });
      if (!(await child.isVisible()))
        await sheet.getByRole("button", { name: "Settings", exact: true }).click();
      await child.click();
      await page.locator(".flux-settings-page").waitFor({ state: "visible" });
      await page.keyboard.press("Escape");
      await sheet.waitFor({ state: "detached" });
    }
    for (const phase of ["original-point", "settled-point"]) {
      if (phase === "settled-point") await page.evaluate(() => document.fonts.ready);
      const snapshot = await capture(page);
      const platformFonts = await actualFonts(context, page);
      record.phases.push({ phase, snapshot, platformFonts });
      await writeFile(
        path.join(output, `${kind}-${phase}.json`),
        JSON.stringify(record.phases.at(-1), null, 2),
      );
      await page.screenshot({ path: path.join(output, `${kind}-${phase}.png`) });
    }
    record.status = "EVIDENCE_COLLECTED_NOT_A_PRODUCTION_ASSERTION_PASS";
  } catch (error) {
    record.status = "DIAGNOSTIC_ERROR";
    record.error = errorRecord(error);
    record.actualURL = page.url();
    record.headings = await page
      .getByRole("heading")
      .allTextContents()
      .catch(() => []);
    await page.screenshot({ path: path.join(output, `${kind}-error.png`) }).catch(() => {});
  } finally {
    await Promise.allSettled(fontTasks);
    await context.close();
    record.contextClosed = true;
    await writeFile(path.join(output, `${kind}-record.json`), JSON.stringify(record, null, 2));
  }
  return record;
}

await mkdir(output, { recursive: true });
const summary = {
  purpose: "Read-only native Linux font and line-layout evidence, not production assertion passes.",
  originalFailure: {
    commit: "1e578edd95e89a490a30c22381b722e228a9fefb",
    run: 40364109290,
    artifact: 12671327307,
    artifactBytes: 39952722,
    artifactSHA256: "99398bc364a54ead7f308a68480c960b6ce2e9094a05e82370b74adbb4230db6",
    passed: 1650,
    failed: 1,
  },
  metadata: {
    platform: os.platform(),
    release: os.release(),
    arch: os.arch(),
    node: process.version,
    playwright: require("playwright/package.json").version,
    imageOS: process.env.ImageOS,
    imageVersion: process.env.ImageVersion,
    githubRun: process.env.GITHUB_RUN_ID,
    githubSHA: process.env.GITHUB_SHA,
  },
  targets: [],
  execution: {
    sequentialContexts: true,
    retries: 0,
    defaultTimeoutMs: 30000,
    fontOverrides: false,
    styleInjection: false,
    clipboard: false,
    fixedHeightWait: false,
    publicMethodsAllowed: ["GET", "HEAD"],
  },
};
let browser;
try {
  summary.metadata.osRelease = await readFile("/etc/os-release", "utf8").catch(() => null);
  await startPreview();
  browser = await chromium.launch({ headless: true });
  summary.metadata.chromium = browser.version();
  for (const kind of ["local", "public"]) summary.targets.push(await probe(browser, kind));
  if (summary.targets.some((target) => target.status === "DIAGNOSTIC_ERROR")) process.exitCode = 1;
} catch (error) {
  summary.error = errorRecord(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  summary.browserClosed = true;
  if (previewProcess?.pid) {
    try {
      process.kill(-previewProcess.pid, "SIGTERM");
    } catch (error) {
      summary.previewShutdownError = error.message;
    }
  }
  await writeFile(path.join(output, "preview.log"), previewLog);
  await writeFile(path.join(output, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(
    JSON.stringify({
      output,
      targets: summary.targets.map(({ kind, status }) => ({ kind, status })),
      error: summary.error,
    }),
  );
}
