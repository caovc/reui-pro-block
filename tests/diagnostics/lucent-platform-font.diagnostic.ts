import { expect, test, type Page, type CDPSession } from "@playwright/test";
import { writeFile } from "node:fs/promises";

test.use({ viewport: { width: 390, height: 844 } });

/** Read-only evidence: a completed diagnostic is not a production geometry assertion. */
async function observe(page: Page, cdp: CDPSession) {
  const dom = await page.evaluate(() => {
    function bounds(element: HTMLElement) {
      const box = element.getBoundingClientRect();
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
        clientWidth: element.clientWidth,
        clientHeight: element.clientHeight,
        scrollWidth: element.scrollWidth,
        scrollHeight: element.scrollHeight,
        offsetWidth: element.offsetWidth,
        offsetHeight: element.offsetHeight,
      };
    }

    function describe(element: HTMLElement) {
      const computed = getComputedStyle(element);
      const properties = [
        "font",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStretch",
        "fontKerning",
        "fontOpticalSizing",
        "fontFeatureSettings",
        "fontVariationSettings",
        "letterSpacing",
        "lineHeight",
        "padding",
        "borderWidth",
        "width",
        "minWidth",
        "maxWidth",
        "overflow",
        "overflowX",
        "overflowY",
        "display",
        "gridTemplateColumns",
        "gap",
      ] as const;
      return {
        tag: element.tagName,
        id: element.id,
        className: element.className,
        text: element.textContent,
        bounds: bounds(element),
        computed: Object.fromEntries(properties.map((key) => [key, computed[key]])),
      };
    }

    function textLines(element: HTMLElement) {
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      const lines: {
        y: number;
        x: number;
        height: number;
        right: number;
        text: string;
      }[] = [];
      let current: Node | null;
      while ((current = walker.nextNode())) {
        const node = current as Text;
        for (let index = 0; index < node.length; index++) {
          const range = document.createRange();
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          const box = range.getBoundingClientRect();
          if (!box.height) continue;
          let line = lines.find((entry) => Math.abs(entry.y - box.y) < 0.1);
          if (!line) {
            line = { y: box.y, x: box.x, height: box.height, right: box.right, text: "" };
            lines.push(line);
          }
          line.text += node.data[index];
          line.x = Math.min(line.x, box.x);
          line.right = Math.max(line.right, box.right);
        }
      }
      return lines.map((line) => ({ ...line, width: line.right - line.x }));
    }

    function descriptions(element: HTMLElement) {
      return [...element.querySelectorAll<HTMLElement>("p")].map((paragraph) => ({
        ...describe(paragraph),
        lines: textLines(paragraph),
      }));
    }

    const target = document.getElementById("lucent-general-projectName-description")!;
    const parents = [];
    for (let parent: HTMLElement | null = target; parent; parent = parent.parentElement) {
      parents.push(describe(parent));
    }
    const frame = document.querySelector<HTMLElement>('.wf-lucent-general > [data-slot="frame"]')!;
    return {
      at: performance.now(),
      viewport: {
        innerWidth,
        innerHeight,
        devicePixelRatio,
        scrollX,
        scrollY,
        documentWidth: document.documentElement.clientWidth,
      },
      navigator: { userAgent: navigator.userAgent, language: navigator.language },
      fontSet: {
        status: document.fonts.status,
        faces: [...document.fonts].map((face) => ({
          family: face.family,
          status: face.status,
          weight: face.weight,
          style: face.style,
          stretch: face.stretch,
        })),
      },
      frame: describe(frame),
      target: { ...describe(target), lines: textLines(target) },
      parents,
      rows: [
        ...document.querySelectorAll<HTMLElement>(".wf-lucent-general .workspace-settings-row"),
      ].map((element) => ({ ...describe(element), descriptions: descriptions(element) })),
      interfaceRows: [...document.querySelectorAll<HTMLElement>(".wf-lucent-interface > div")].map(
        (element) => ({ ...describe(element), descriptions: descriptions(element) }),
      ),
      sections: [
        ...document.querySelectorAll<HTMLElement>(
          '.wf-lucent-general [data-slot="frame-panel-header"], ' +
            '.wf-lucent-general [data-slot="frame-panel"], ' +
            '.wf-lucent-general [data-slot="frame-panel-footer"]',
        ),
      ].map(describe),
    };
  });
  const documentNode = await cdp.send("DOM.getDocument", { depth: 0 });
  const targetNode = await cdp.send("DOM.querySelector", {
    nodeId: documentNode.root.nodeId,
    selector: "#lucent-general-projectName-description",
  });
  const actualFonts = await cdp.send("CSS.getPlatformFontsForNode", {
    nodeId: targetNode.nodeId,
  });
  return { dom, actualFonts };
}

for (const prefix of ["template-preview", "templates"] as const) {
  test(`Lucent platform-font evidence at 390 on ${prefix}`, async ({ page, context }, info) => {
    const network: { url: string; status: number; at: number }[] = [];
    const consoleEvents: { type: string; text: string }[] = [];
    page.on("response", (response) => {
      if (/woff|\.css(?:$|\?)/.test(response.url())) {
        network.push({ url: response.url(), status: response.status(), at: Date.now() });
      }
    });
    page.on("console", (message) => {
      consoleEvents.push({ type: message.type(), text: message.text() });
    });
    page.on("pageerror", (error) => {
      consoleEvents.push({ type: "pageerror", text: error.message });
    });
    const evidence: Record<string, unknown> = {
      purpose:
        "Read-only diagnostic; completion does not assert a production height or font match.",
      prefix,
      fontHintingEnvironment: process.env.BRICKLANE_FONT_HINTING ?? null,
      viewport: { width: 390, height: 844 },
      contextLocale: "default, no diagnostic override",
      network,
      consoleEvents,
    };
    const cdp = await context.newCDPSession(page);
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    try {
      await page.goto(`/#/${prefix}/lucent`);
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      await page.getByRole("button", { name: "Settings", exact: true }).click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      await expect(page.getByText("General Settings", { exact: true })).toBeVisible();
      const paragraph = page.locator("#lucent-general-projectName-description");
      await expect(paragraph).toHaveText("The display name for this workspace across the console.");
      await expect(paragraph).toBeVisible();
      evidence.firstVisible = await observe(page, cdp);
      await page.screenshot({ path: info.outputPath("first-visible.png"), fullPage: true });
      await info.attach("first-visible", {
        path: info.outputPath("first-visible.png"),
        contentType: "image/png",
      });
      await page.evaluate(() => document.fonts.ready);
      await page.evaluate(() => window.scrollTo(0, 0));
      evidence.afterNaturalFontsReady = await observe(page, cdp);
      await page.screenshot({
        path: info.outputPath("after-natural-fonts-ready.png"),
        fullPage: true,
      });
      await info.attach("after-natural-fonts-ready", {
        path: info.outputPath("after-natural-fonts-ready.png"),
        contentType: "image/png",
      });
    } finally {
      await cdp.detach();
      const json = JSON.stringify(evidence, null, 2);
      await writeFile(info.outputPath("platform-font-evidence.json"), json);
      await info.attach("platform-font-evidence", {
        body: Buffer.from(json),
        contentType: "application/json",
      });
    }
  });
}
