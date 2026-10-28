// Actual business settings source, real clipboard/downloads, and original project acceptance.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { basename, join, posix } from "node:path";
import { expect, test } from "@playwright/test";
import { strFromU8, unzipSync } from "fflate";
import ts from "typescript";

const configs = [
  {
    id: "surge",
    name: "Surge",
    defaultPath: "src/templates/business/commerce.tsx",
    runtimePaths: [
      "src/templates/business/commerce.tsx",
      "src/templates/business/commerce-settings-billing.tsx",
      "src/templates/business/commerce-settings-data.ts",
      "src/templates/business/commerce-settings-demo-data.ts",
      "src/templates/business/commerce-settings-domains.css",
      "src/templates/business/commerce-settings-domains.tsx",
      "src/templates/business/commerce-settings-general-data.ts",
      "src/templates/business/commerce-settings-general-model.ts",
      "src/templates/business/commerce-settings-general.css",
      "src/templates/business/commerce-settings-general.tsx",
      "src/templates/business/commerce-settings-model.ts",
      "src/templates/business/commerce-settings-notifications.tsx",
      "src/templates/business/commerce-settings-payments.tsx",
      "src/templates/business/commerce-settings-records.tsx",
      "src/templates/business/commerce-settings-route-model.ts",
      "src/templates/business/commerce-settings-route.ts",
      "src/templates/business/commerce-settings-team.tsx",
      "src/templates/business/commerce-settings-header.css",
      "src/templates/business/shared.tsx",
    ],
  },
  {
    id: "manifest",
    name: "Manifest",
    defaultPath: "src/templates/business/commerce.tsx",
    runtimePaths: [
      "src/templates/business/commerce.tsx",
      "src/templates/business/commerce-settings-billing.tsx",
      "src/templates/business/commerce-settings-data.ts",
      "src/templates/business/commerce-settings-demo-data.ts",
      "src/templates/business/commerce-settings-domains.css",
      "src/templates/business/commerce-settings-domains.tsx",
      "src/templates/business/commerce-settings-general-data.ts",
      "src/templates/business/commerce-settings-general-model.ts",
      "src/templates/business/commerce-settings-general.css",
      "src/templates/business/commerce-settings-general.tsx",
      "src/templates/business/commerce-settings-model.ts",
      "src/templates/business/commerce-settings-notifications.tsx",
      "src/templates/business/commerce-settings-payments.tsx",
      "src/templates/business/commerce-settings-records.tsx",
      "src/templates/business/commerce-settings-route-model.ts",
      "src/templates/business/commerce-settings-route.ts",
      "src/templates/business/commerce-settings-team.tsx",
      "src/templates/business/commerce-settings-header.css",
      "src/templates/business/shared.tsx",
    ],
  },
  {
    id: "miro",
    name: "Miro",
    defaultPath: "src/templates/business/miro.tsx",
    runtimePaths: [
      "src/templates/business/miro.tsx",
      "src/templates/business/miro-calendar.tsx",
      "src/templates/business/miro-detail.tsx",
      "src/templates/business/miro-notifications.css",
      "src/templates/business/miro-notifications.tsx",
      "src/templates/business/miro-settings-controls.tsx",
      "src/templates/business/miro-settings-data.ts",
      "src/templates/business/miro-settings-integration.ts",
      "src/templates/business/miro-settings-model.ts",
      "src/templates/business/miro-settings-profile.tsx",
      "src/templates/business/miro-settings.css",
      "src/templates/business/miro-settings.tsx",
      "src/templates/business/miro-workspace.tsx",
      "src/templates/business/shared.tsx",
    ],
  },
  {
    id: "verve",
    name: "Verve",
    defaultPath: "src/templates/business/verve.tsx",
    runtimePaths: [
      "src/templates/business/verve.tsx",
      "src/templates/business/verve-account-settings-data.ts",
      "src/templates/business/verve-account-settings-model.ts",
      "src/templates/business/verve-account-settings.css",
      "src/templates/business/verve-account-settings.tsx",
      "src/templates/business/verve-configuration-data.ts",
      "src/templates/business/verve-configuration-model.ts",
      "src/templates/business/verve-configuration.css",
      "src/templates/business/verve-key-dialog.tsx",
      "src/templates/business/verve-settings-api-keys.tsx",
      "src/templates/business/verve-settings-integrations.tsx",
      "src/templates/business/verve-settings-navigation.tsx",
      "src/templates/business/verve-settings-people-billing-data.ts",
      "src/templates/business/verve-settings-people-billing-model.ts",
      "src/templates/business/verve-settings-people-billing-surfaces.tsx",
      "src/templates/business/verve-settings-people-billing.css",
      "src/templates/business/verve-settings-people-billing.tsx",
      "src/templates/business/verve-settings-route.ts",
      "src/templates/business/verve-settings-webhooks.tsx",
      "src/templates/business/verve-workspace-settings.tsx",
      "src/templates/business/shared.tsx",
    ],
  },
] as const;

function hash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}

// Existing templates-settings-drive-source/receipt acceptance style: inspect the
// actual downloaded archive; never build a replacement ZIP in the test.
function imports(filename: string, source: string): string[] {
  if (filename.endsWith(".css")) {
    return [...source.matchAll(/(?:url\(\s*|@import\s*)["']([^"']+)["']/g)].map(
      (match) => match[1],
    );
  }
  const targets: string[] = [];
  const tree = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true);
  function visit(node: ts.Node) {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteralLike(node.moduleSpecifier)
    ) {
      targets.push(node.moduleSpecifier.text);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteralLike(node.arguments[0])
    ) {
      targets.push(node.arguments[0].text);
    }
    ts.forEachChild(node, visit);
  }
  visit(tree);
  return targets;
}

for (const { id, name, defaultPath, runtimePaths: initialRuntimePaths } of configs) {
  const runtimePaths = [
    ...initialRuntimePaths,
    ...(id === "verve"
      ? [
          "src/templates/business/verve-settings-layout.css",
          "src/templates/collaboration/drive-settings-components.tsx",
        ]
      : []),
  ];
  test(`${id} settings Source view, real Copy, single file and original project ZIP match`, async ({
    page,
    context,
  }, testInfo) => {
    const faults: string[] = [];
    page.on("pageerror", (error) => faults.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "warning" || message.type() === "error") faults.push(message.text());
    });
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    const fresh = new Map<string, Buffer>();
    for (const filename of runtimePaths) {
      fresh.set(filename, await readFile(join(process.cwd(), filename)));
    }
    const checked: Record<string, unknown>[] = [];
    await page.goto(`/#/templates/${id}`, { waitUntil: "networkidle" });
    const sourceTrigger = page.getByRole("button", { name: "View template source", exact: true });
    await expect(sourceTrigger).toBeVisible();
    await sourceTrigger.click();
    const dialog = page.getByRole("dialog", {
      name: new RegExp(`^${name} source$`, "i"),
    });
    await expect(dialog).toBeVisible();
    const choice = dialog.getByRole("combobox", { name: "Template source file", exact: true });
    await expect(choice).toHaveText(defaultPath);
    for (const filename of runtimePaths) {
      if (filename !== defaultPath) {
        await expect(page.getByRole("listbox")).toHaveCount(0);
        await expect(choice).toHaveAttribute("aria-expanded", "false");
        await choice.click();
        const options = page.getByRole("listbox");
        await expect(options).toBeVisible();
        await options.getByRole("option", { name: filename, exact: true }).click();
        // Selection replaces keyed CodeBlock/Trigger. Wait for native close and the live trigger.
        await expect(options).toHaveCount(0);
        await expect(choice).toHaveAttribute("aria-expanded", "false");
        await expect(choice).toHaveText(filename);
        await expect(choice).toBeFocused();
      }
      const expected = fresh.get(filename)!;
      const code = dialog.locator('code[data-slot="code-block-code"].template-source-code');
      await expect(
        dialog.getByRole("region", { name: `Template source code: ${filename}`, exact: true }),
      ).toBeVisible();
      await expect(code.locator("span[data-code-line]").first()).toBeAttached();
      await expect
        .poll(async () => (await code.textContent()) ?? "")
        .toBe(expected.toString("utf8"));
      const viewBytes = Buffer.from((await code.textContent())!, "utf8");
      expect(viewBytes.equals(expected), `${filename}: rendered UTF-8 bytes`).toBe(true);

      await dialog.getByRole("button", { name: "Copy", exact: true }).click();
      await expect(dialog.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
      const copied = await page.evaluate(() => navigator.clipboard.readText());
      const copyBytes = Buffer.from(copied, "utf8");
      expect(copyBytes.equals(expected), `${filename}: real clipboard UTF-8 bytes`).toBe(true);

      const pending = page.waitForEvent("download");
      await dialog
        .getByRole("button", { name: "Download template source file", exact: true })
        .click();
      const single = await pending;
      expect(single.suggestedFilename()).toBe(basename(filename));
      expect(await single.failure()).toBeNull();
      const downloadedPath = await single.path();
      expect(downloadedPath).toBeTruthy();
      const singleBytes = await readFile(downloadedPath!);
      expect(singleBytes.equals(expected), `${filename}: real single-file raw bytes`).toBe(true);
      const artifact = testInfo.outputPath(`${id}-${basename(filename)}`);
      await single.saveAs(artifact);
      checked.push({
        filename,
        bytes: expected.length,
        freshSHA256: hash(expected),
        viewSHA256: hash(viewBytes),
        clipboardSHA256: hash(copyBytes),
        singleSHA256: hash(singleBytes),
        singleArtifact: artifact,
      });
    }

    const project = dialog.getByRole("button", { name: "Download project", exact: true });
    await expect(project).toBeEnabled();
    const pending = page.waitForEvent("download");
    await project.click();
    const archive = await pending;
    expect(archive.suggestedFilename()).toBe(`${id}-template.zip`);
    expect(await archive.failure()).toBeNull();
    const archivePath = await archive.path();
    expect(archivePath).toBeTruthy();
    const archiveBytes = await readFile(archivePath!);
    const files = unzipSync(new Uint8Array(archiveBytes));
    const earlyArchive = testInfo.outputPath(`${id}-original-project.zip`);
    await archive.saveAs(earlyArchive);
    await writeFile(
      testInfo.outputPath("original-archive-inventory.json"),
      JSON.stringify(
        {
          archive: earlyArchive,
          sha256: hash(archiveBytes),
          members: Object.entries(files).map(([path, bytes]) => ({
            path,
            bytes: bytes.length,
            sha256: hash(bytes),
          })),
        },
        null,
        2,
      ),
    );
    const zipChecked: Record<string, unknown>[] = [];
    for (const [filename, expected] of fresh) {
      expect(files[filename], `${filename}: actual ZIP member exists`).toBeTruthy();
      const member = Buffer.from(files[filename]!);
      expect(member.equals(expected), `${filename}: actual ZIP member raw bytes`).toBe(true);
      // Detect a changed input during the UI round, rather than calling old byte equality fresh.
      expect((await readFile(join(process.cwd(), filename))).equals(expected)).toBe(true);
      zipChecked.push({ filename, bytes: member.length, sha256: hash(member) });
    }
    // Check the raw native implementation members actually exported by this
    // project. Do not require unused components merely copied from another protocol.
    const nativeDependencies = Object.keys(files).filter(
      (filename) =>
        /\.(?:tsx?|css)$/.test(filename) &&
        (filename.startsWith("src/components/") ||
          filename.startsWith("src/hooks/") ||
          filename.startsWith("src/blocks/application/dialog-variants/") ||
          filename.startsWith("src/templates/collaboration/drive-settings-free/") ||
          filename === "src/templates/collaboration/drive-settings-components.tsx"),
    );
    expect(nativeDependencies.length).toBeGreaterThan(10);
    for (const filename of nativeDependencies) {
      expect(
        Buffer.from(files[filename]!).equals(await readFile(join(process.cwd(), filename))),
        `${filename}: actual native implementation bytes`,
      ).toBe(true);
    }
    const rootPackage = JSON.parse(await readFile(join(process.cwd(), "package.json"), "utf8"));
    const projectPackage = JSON.parse(strFromU8(files["package.json"]!));
    expect(projectPackage.dependencies).toEqual(rootPackage.dependencies);
    expect(projectPackage.devDependencies).toEqual(rootPackage.devDependencies);
    expect(projectPackage.overrides).toEqual(rootPackage.overrides);
    const licenses = [
      "src/components/reui/REUI-LICENSE.txt",
      "src/blocks/assets/Inter-LICENSE.txt",
      "LICENSE",
      "THIRD_PARTY_NOTICES.md",
    ];
    const phonePath = "src/templates/collaboration/drive-settings-free/phone-input.tsx";
    if (id === "verve") expect(files[phonePath]).toBeTruthy();
    if (files[phonePath]) {
      // Every original archive that collects this actual free cross-family
      // implementation must retain its existing license metadata.
      licenses.push("src/templates/collaboration/assets/drive-phone-LICENSES.txt");
    }
    for (const filename of licenses) {
      expect(files[filename], `${filename}: actual license/notice`).toBeTruthy();
      expect(
        Buffer.from(files[filename]!).equals(await readFile(join(process.cwd(), filename))),
        filename,
      ).toBe(true);
    }
    // The actual local Inter font and its original OFL remain export dependencies.
    const fontAssets = ["src/blocks/assets/inter-latin-variable.woff2"];
    const fontChecked: Record<string, unknown>[] = [];
    for (const filename of fontAssets) {
      expect(files[filename], `${filename}: actual bundled font`).toBeTruthy();
      const member = Buffer.from(files[filename]!);
      expect(member.equals(await readFile(join(process.cwd(), filename))), filename).toBe(true);
      fontChecked.push({ filename, bytes: member.length, sha256: hash(member) });
    }
    expect(files["src/Example.tsx"]).toBeTruthy();
    const example = strFromU8(files["src/Example.tsx"]!);
    expect(example).toContain("import Template from '@/templates/business'");
    expect(example).toContain(`<TemplateSurface id="${id}">`);
    expect(example).toContain(`<Template id="${id}" />`);
    expect(example).toContain("applyTheme(theme, dark)");
    const missing: string[] = [];
    for (const [filename, bytes] of Object.entries(files)) {
      if (!/\.(?:tsx?|css)$/.test(filename)) continue;
      for (const target of imports(filename, strFromU8(bytes))) {
        if (!target.startsWith("@/") && !target.startsWith(".")) continue;
        const resolved = target.startsWith("@/")
          ? `src/${target.slice(2)}`
          : posix.normalize(posix.join(posix.dirname(filename), target));
        if (
          ![
            resolved,
            `${resolved}.tsx`,
            `${resolved}.ts`,
            `${resolved}.css`,
            `${resolved}.json`,
            `${resolved}/index.tsx`,
            `${resolved}/index.ts`,
          ].some((path) => files[path])
        ) {
          missing.push(`${filename} imports ${target}`);
        }
      }
    }
    expect(missing).toEqual([]);
    const artifact = testInfo.outputPath(`${id}-settings-project.zip`);
    await archive.saveAs(artifact);
    await writeFile(
      testInfo.outputPath(`${id}-settings-source-proof.json`),
      `${JSON.stringify({ id, defaultPath, checked, zipChecked, nativeDependencies, licenses, fontChecked, archive: artifact, archiveSHA256: hash(archiveBytes), memberCount: Object.keys(files).length, missingLocalImports: missing }, null, 2)}\n`,
      "utf8",
    );
    await page.keyboard.press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(sourceTrigger).toBeFocused();
    expect(faults).toEqual([]);
  });
}
