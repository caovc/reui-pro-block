import { test, expect } from "@playwright/test";
import { execFile } from "node:child_process";
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { promisify } from "node:util";
import { unzipSync, strFromU8 } from "fflate";
import ts from "typescript";

const execute = promisify(execFile);

test("downloaded chart starter builds with the language features used by its dependencies", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("./#/block/chart/line-chart/chart-4");
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

  const directory = await mkdtemp(join(tmpdir(), "reui-chart-starter-"));
  try {
    for (const [filename, content] of Object.entries(files)) {
      const destination = join(directory, filename);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, content);
    }
    // Use the same locked dependency versions as the site, without another network install.
    await symlink(resolve("node_modules"), join(directory, "node_modules"), "dir");
    await execute("npm", ["run", "build"], {
      cwd: directory,
      timeout: 90_000,
      maxBuffer: 10 * 1024 * 1024,
    });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
