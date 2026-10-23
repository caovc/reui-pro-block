import { test, expect, type Page } from "@playwright/test";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { unzipSync, strFromU8 } from "fflate";
import ts from "typescript";
import { preview, type PreviewServer } from "vite";

const execute = promisify(execFile);
const cases: { name: string; route: string; selectors: Record<string, string> }[] = [
  {
    name: "Data sparkline",
    route: "chart/sparkline/chart-31",
    selectors: { panel: '[data-slot="frame-panel"]', metric: ".p-4" },
  },
  {
    name: "Application auth",
    route: "application/auth/auth-4",
    selectors: { panel: '[data-slot="frame-panel"]' },
  },
];

test.describe.configure({ mode: "serial" });

async function styles(page: Page, selectors: Record<string, string>) {
  const result: Record<string, Record<string, string>> = {};
  for (const [name, selector] of Object.entries(selectors)) {
    const element = page.locator(selector).first();
    await expect(element).toBeVisible();
    result[name] = await element.evaluate((node) => {
      const style = getComputedStyle(node);
      return {
        paddingTop: style.paddingTop,
        paddingRight: style.paddingRight,
        paddingBottom: style.paddingBottom,
        paddingLeft: style.paddingLeft,
        borderTopWidth: style.borderTopWidth,
        borderTopStyle: style.borderTopStyle,
        borderRadius: style.borderRadius,
        display: style.display,
      };
    });
  }
  return result;
}

for (const entry of cases) {
  test(`${entry.name}: downloaded starter builds and preserves preview spacing and Frame borders`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120_000);
    const references: Record<number, Awaited<ReturnType<typeof styles>>> = {};
    for (const width of [1440, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      await page.goto(`./#/preview/${entry.route}`);
      const reference = await styles(page, entry.selectors);
      expect(reference.panel.borderTopWidth).toBe("1px");
      expect(reference.panel.borderTopStyle).toBe("solid");
      if (reference.metric) expect(reference.metric.paddingTop).toBe("16px");
      references[width] = reference;
    }
    await page.setViewportSize({ width: 1440, height: 1000 });

    await page.goto(`./#/block/${entry.route}`);
    await page.getByRole("button", { name: "View code", exact: true }).click();
    const pendingDownload = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download starter", exact: true }).click();
    const download = await pendingDownload;
    const files = unzipSync(new Uint8Array(await readFile((await download.path())!)));
    const config = JSON.parse(strFromU8(files["tsconfig.json"]));
    const project = ts.readConfigFile("tsconfig.app.json", ts.sys.readFile).config;
    expect(config.compilerOptions.target.toLowerCase()).toBe(
      project.compilerOptions.target.toLowerCase(),
    );
    expect(config.compilerOptions.lib).toEqual(expect.arrayContaining(project.compilerOptions.lib));

    const directory = await mkdtemp(join(tmpdir(), "reui-rendered-starter-"));
    let server: PreviewServer | undefined;
    try {
      for (const [filename, content] of Object.entries(files)) {
        const destination = join(directory, filename);
        await mkdir(dirname(destination), { recursive: true });
        await writeFile(destination, content);
      }
      // Reuse the site's locked dependencies while building the actual downloaded source.
      await symlink(resolve("node_modules"), join(directory, "node_modules"), "dir");
      await execute("npm", ["run", "build"], {
        cwd: directory,
        timeout: 90_000,
        maxBuffer: 10 * 1024 * 1024,
      });
      server = await preview({
        root: directory,
        configFile: false,
        preview: { host: "127.0.0.1", port: 0, strictPort: true },
      });
      const address = server.httpServer.address();
      if (!address || typeof address === "string") throw new Error("Starter server did not bind");
      for (const width of [1440, 390]) {
        await page.setViewportSize({ width, height: 1000 });
        await page.goto(`http://127.0.0.1:${address.port}/`);
        const actual = await styles(page, entry.selectors);
        await testInfo.attach(`computed-styles-${width}`, {
          body: JSON.stringify({ reference: references[width], actual }),
          contentType: "application/json",
        });
        await page.screenshot({ path: testInfo.outputPath(`starter-${width}.png`) });
        expect(actual, `${entry.name} at ${width}px`).toEqual(references[width]);
      }
    } finally {
      if (server) {
        await server.close();
      }
      await rm(directory, { recursive: true, force: true });
    }
  });
}
