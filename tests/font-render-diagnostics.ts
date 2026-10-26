import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import type { Page, TestInfo } from "@playwright/test";

/** Read-only evidence: never loads fonts, changes styles, or changes assertions. */
export async function attachFontRenderDiagnostics(
  page: Page,
  testInfo: TestInfo,
  name: string,
  selector: string,
) {
  const evidence: Record<string, unknown> = { selector, url: page.url() };
  const sample = () =>
    page.locator(selector).evaluate((element) => {
      const started = performance.now();
      const style = getComputedStyle(element);
      const width = style.width;
      const rect = element.getBoundingClientRect();
      const text = element.textContent ?? "";
      const rectData = (value: DOMRect) => ({
        x: value.x,
        y: value.y,
        width: value.width,
        height: value.height,
      });
      const properties = [
        "width",
        "height",
        "font",
        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "fontStretch",
        "fontKerning",
        "fontOpticalSizing",
        "fontFeatureSettings",
        "fontVariationSettings",
        "fontSizeAdjust",
        "fontSynthesis",
        "textRendering",
        "letterSpacing",
        "wordSpacing",
        "lineHeight",
        "padding",
        "gap",
        "borderWidth",
        "transform",
        "zoom",
      ];
      const computed = Object.fromEntries(properties.map((key) => [key, Reflect.get(style, key)]));
      const ranges = [];
      const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.textContent?.trim()) continue;
        const range = document.createRange();
        range.selectNodeContents(node);
        ranges.push({ text: node.textContent, rect: rectData(range.getBoundingClientRect()) });
      }
      const context = document.createElement("canvas").getContext("2d");
      let canvas;
      if (context) {
        context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        context.fontKerning = style.fontKerning as typeof context.fontKerning;
        context.letterSpacing = style.letterSpacing === "normal" ? "0px" : style.letterSpacing;
        context.wordSpacing = style.wordSpacing === "normal" ? "0px" : style.wordSpacing;
        const metrics = context.measureText(text);
        canvas = {
          font: context.font,
          width: metrics.width,
          left: metrics.actualBoundingBoxLeft,
          right: metrics.actualBoundingBoxRight,
          ascent: metrics.fontBoundingBoxAscent,
          descent: metrics.fontBoundingBoxDescent,
        };
      }
      const faceProperties = [
        "family",
        "status",
        "weight",
        "style",
        "stretch",
        "display",
        "unicodeRange",
        "featureSettings",
        "variationSettings",
        "sizeAdjust",
        "ascentOverride",
        "descentOverride",
        "lineGapOverride",
      ];
      const fontQuery = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      return {
        started,
        finished: performance.now(),
        cssWidth: width,
        numericCssWidth: parseFloat(width),
        rect: rectData(rect),
        text,
        tag: element.tagName,
        className: element.getAttribute("class"),
        computed,
        ranges,
        canvas,
        svg: [...element.querySelectorAll("svg")].map((node) => {
          const svgStyle = getComputedStyle(node);
          return {
            rect: rectData(node.getBoundingClientRect()),
            width: svgStyle.width,
            height: svgStyle.height,
          };
        }),
        fonts: {
          status: document.fonts.status,
          query: fontQuery,
          check: document.fonts.check(fontQuery, text),
          faces: [...document.fonts].map((face) =>
            Object.fromEntries(faceProperties.map((key) => [key, Reflect.get(face, key)])),
          ),
        },
        resources: performance
          .getEntriesByType("resource")
          .filter((entry) => /\.(woff2?|ttf|otf)(?:[?#]|$)/i.test(entry.name))
          .map((entry) => {
            const resource = entry as PerformanceResourceTiming;
            return {
              url: entry.name,
              start: entry.startTime,
              responseEnd: resource.responseEnd,
              duration: entry.duration,
              transferSize: resource.transferSize,
              decodedSize: resource.decodedBodySize,
            };
          }),
        stylesheets: [...document.styleSheets].map((sheet) => ({
          href: sheet.href,
          disabled: sheet.disabled,
        })),
        platform: navigator.platform,
        userAgent: navigator.userAgent,
        devicePixelRatio,
      };
    });

  try {
    // Capture the original layout synchronously before any CDP/asset I/O awaits.
    const before = await sample();
    evidence.before = before;
    const client = await page.context().newCDPSession(page);
    try {
      await client.send("DOM.enable");
      await client.send("CSS.enable");
      const { root } = await client.send("DOM.getDocument");
      const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector });
      evidence.platformFonts = await client.send("CSS.getPlatformFontsForNode", { nodeId });
      evidence.browser = await client.send("Browser.getVersion");
    } catch (error) {
      evidence.cdpError = String(error);
    } finally {
      await client.detach();
    }
    evidence.after = await sample();
    evidence.buildFontFiles = await Promise.all(
      before.resources.map(async ({ url }) => {
        const fileName = basename(new URL(url).pathname);
        try {
          const bytes = await readFile(join(process.cwd(), "dist", "assets", fileName));
          return {
            url,
            fileName,
            bytes: bytes.length,
            sha256: createHash("sha256").update(bytes).digest("hex"),
          };
        } catch (error) {
          return { url, fileName, unavailable: String(error) };
        }
      }),
    );
  } catch (error) {
    evidence.captureError = String(error);
  }
  // Keep the JSON even when the original assertion passes and no trace is retained.
  const outputPath = testInfo.outputPath(`${name}.json`);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, JSON.stringify(evidence, null, 2));
  await testInfo.attach(name, { path: outputPath, contentType: "application/json" });
  return evidence;
}

const referenceTextContracts = {
  "flow-success": {
    text: "Success",
    fontSize: "12px",
    lineHeight: "16px",
    letterSpacing: "normal",
  },
  "pricing-upgrade-title": {
    text: "Upgrade Your Plan",
    fontSize: "14px",
    lineHeight: "20px",
    letterSpacing: "-0.35px",
  },
} as const;

/**
 * Measure official text constants using this platform's actual font metrics.
 * This fixture never reads the target's CSS or imports a product component.
 */
export async function measureReferenceText(
  page: Page,
  testInfo: TestInfo,
  name: string,
  contract: keyof typeof referenceTextContracts,
) {
  const fixture = await page.evaluate((reference) => {
    const element = document.createElement("span");
    element.id = `bricklane-reference-text-${crypto.randomUUID()}`;
    element.setAttribute("aria-hidden", "true");
    element.inert = true;
    element.textContent = reference.text;
    const properties = {
      all: "initial",
      display: "inline-block",
      position: "fixed",
      left: "-10000px",
      top: "0px",
      opacity: "0",
      "pointer-events": "none",
      "box-sizing": "content-box",
      width: "max-content",
      "min-width": "0px",
      "max-width": "none",
      height: "auto",
      margin: "0px",
      padding: "0px",
      border: "0px",
      font: `normal 500 ${reference.fontSize}/${reference.lineHeight} Inter, Arial, sans-serif`,
      "font-stretch": "100%",
      "font-kerning": "auto",
      "font-optical-sizing": "auto",
      "font-feature-settings": "normal",
      "font-variation-settings": "normal",
      "font-size-adjust": "none",
      "font-synthesis": "weight style small-caps",
      "letter-spacing": reference.letterSpacing,
      "word-spacing": "0px",
      "text-rendering": "auto",
      "text-transform": "none",
      "white-space": "nowrap",
      direction: "ltr",
      "writing-mode": "horizontal-tb",
      transform: "none",
      zoom: "1",
    };
    for (const [property, value] of Object.entries(properties)) {
      element.style.setProperty(property, value, "important");
    }
    document.body.append(element);
    const style = getComputedStyle(element);
    const bounds = element.getBoundingClientRect();
    return {
      id: element.id,
      text: element.textContent,
      width: bounds.width,
      height: bounds.height,
      computed: {
        fontFamily: style.fontFamily,
        fontWeight: style.fontWeight,
        fontSize: style.fontSize,
        lineHeight: style.lineHeight,
        letterSpacing: style.letterSpacing,
        padding: style.padding,
        borderWidth: style.borderWidth,
      },
    };
  }, referenceTextContracts[contract]);
  try {
    const diagnostics = await attachFontRenderDiagnostics(page, testInfo, name, `#${fixture.id}`);
    return { ...fixture, diagnostics };
  } finally {
    await page.evaluate((id) => document.getElementById(id)?.remove(), fixture.id);
  }
}
