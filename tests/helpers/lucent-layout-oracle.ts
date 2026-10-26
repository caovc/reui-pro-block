import { expect, type Page } from "@playwright/test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const fontPath = "src/blocks/assets/inter-latin-variable.woff2";
const fontSHA256 = "c940764593d0fe5d596be327ca7558855e018039fb78509aa21921fd3644c3e4";
const sampleText = "The display name for this workspace across the console.";

/** Independent fixture: no target DOM, computed style, text, width or height seeds this sample. */
export async function phoneSettingsWrapOracle(page: Page) {
  const font = await readFile(resolve(process.cwd(), fontPath));
  expect(createHash("sha256").update(font).digest("hex"), "oracle Inter asset identity").toBe(
    fontSHA256,
  );
  const srcdoc = `<!doctype html><html><head><style>
    @font-face {
      font-family: "Lucent Oracle Inter";
      font-style: normal;
      font-weight: 100 900;
      font-display: swap;
      src: url(data:font/woff2;base64,${font.toString("base64")}) format("woff2");
    }
    html, body { margin: 0; padding: 0; }
    #sample {
      box-sizing: content-box;
      display: block;
      width: 324px;
      margin: 0;
      padding: 0;
      border: 0;
      font-family: "Lucent Oracle Inter";
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      font-stretch: normal;
      font-kerning: auto;
      font-optical-sizing: auto;
      font-feature-settings: normal;
      font-variation-settings: normal;
      line-height: 16px;
      letter-spacing: normal;
      word-spacing: normal;
      white-space: normal;
      overflow-wrap: normal;
      word-break: normal;
      text-transform: none;
      text-indent: 0;
      -webkit-font-smoothing: antialiased;
    }
  </style></head><body><p id="sample">${sampleText}</p></body></html>`;
  const handle = await page.evaluateHandle((html) => {
    const iframe = document.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.setAttribute("title", "Independent Lucent typography fixture");
    iframe.style.cssText =
      "position:fixed;left:-10000px;top:0;width:390px;height:100px;border:0;pointer-events:none";
    iframe.srcdoc = html;
    document.body.append(iframe);
    return iframe;
  }, srcdoc);
  const element = handle.asElement()!;
  try {
    const frame = await element.contentFrame();
    expect(frame, "oracle has an isolated browsing document").not.toBeNull();
    await frame!.waitForSelector("#sample", { state: "attached" });
    const sample = await frame!.evaluate(async () => {
      const paragraph = document.getElementById("sample")!;
      // A normal layout read starts the CSS font request; no fonts.load or browser flags.
      paragraph.getBoundingClientRect();
      await document.fonts.ready;
      const box = paragraph.getBoundingClientRect();
      return {
        width: box.width,
        height: box.height,
        fontStatus: document.fonts.status,
        faces: [...document.fonts].map((face) => ({ family: face.family, status: face.status })),
      };
    });
    expect(sample.width, "independent sample width contract").toBe(324);
    expect(sample.fontStatus, "independent sample natural font readiness").toBe("loaded");
    expect(sample.faces).toContainEqual({ family: "Lucent Oracle Inter", status: "loaded" });
    expect(sample.height, "independent sample uses whole 16px line boxes").toBeGreaterThanOrEqual(
      16,
    );
    expect(sample.height % 16, "independent sample uses whole 16px line boxes").toBe(0);
    return { ...sample, delta: sample.height - 16, fontPath, fontSHA256, sampleText };
  } finally {
    await element.evaluate((iframe) => iframe.remove());
    await handle.dispose();
  }
}

/** These are independent typography/structure contracts, not inputs to the oracle. */
export async function assertPhoneSettingsStructure(page: Page) {
  const snapshot = await page.evaluate(() => {
    const paragraph = document.getElementById("lucent-general-projectName-description")!;
    const computed = getComputedStyle(paragraph);
    const rows = [
      ...document.querySelectorAll<HTMLElement>(".wf-lucent-general .workspace-settings-row"),
    ];
    return {
      text: paragraph.textContent,
      width: paragraph.getBoundingClientRect().width,
      fontFamily: computed.fontFamily,
      fontSize: computed.fontSize,
      fontWeight: computed.fontWeight,
      lineHeight: computed.lineHeight,
      letterSpacing: computed.letterSpacing,
      rows: rows.map((row) => {
        const content = row.querySelector(':scope > [data-slot="field-content"]')!;
        const label = content.querySelector(
          '[data-slot="field-label"], [data-slot="field-title"]',
        )!;
        return {
          title: [...label.childNodes]
            .filter((node) => node.nodeType === Node.TEXT_NODE)
            .map((node) => node.textContent)
            .join("")
            .trim(),
          padding: getComputedStyle(row).padding,
        };
      }),
    };
  });
  expect(snapshot.rows.length, "phone Settings row count").toBe(8);
  expect(
    snapshot.rows.map((row) => row.title),
    "phone Settings ordered row identities",
  ).toEqual([
    "Project name",
    "API endpoint",
    "Start of week",
    "Allowed origins",
    "Accent color",
    "Region & currency",
    "Date display format",
    "Interface preferences",
  ]);
  for (const row of snapshot.rows) {
    expect(row.padding, "phone Settings row padding").toBe("16px");
  }
  expect(snapshot.text, "phone Settings canonical description").toBe(sampleText);
  expect(snapshot.width, "phone Settings description available width").toBe(324);
  expect(snapshot.fontFamily, "phone Settings description family").toBe("Inter, Arial, sans-serif");
  expect(snapshot.fontSize, "phone Settings description size").toBe("12px");
  expect(snapshot.fontWeight, "phone Settings description weight").toBe("400");
  expect(snapshot.lineHeight, "phone Settings description line height").toBe("16px");
  expect(snapshot.letterSpacing, "phone Settings description letter spacing").toBe("normal");
  return snapshot;
}
