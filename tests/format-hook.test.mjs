import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { test } from "node:test";

test("staged formatting preserves unfinished changes without adding them to the commit", () => {
  const directory = mkdtempSync(join(tmpdir(), "reui-format-hook-"));
  const bin = resolve("node_modules/.bin");
  const options = {
    cwd: directory,
    encoding: "utf8",
    env: { ...process.env, PATH: `${bin}:${process.env.PATH}` },
  };
  const git = (...args) => execFileSync("git", args, options);
  try {
    git("init", "--quiet");
    git(
      "-c",
      "user.name=Formatter Test",
      "-c",
      "user.email=formatter@example.invalid",
      "-c",
      "commit.gpgsign=false",
      "-c",
      "core.hooksPath=/dev/null",
      "commit",
      "--allow-empty",
      "--quiet",
      "-m",
      "Fixture baseline",
    );
    copyFileSync(".oxfmtrc.json", join(directory, ".oxfmtrc.json"));
    copyFileSync("package.json", join(directory, "package.json"));
    writeFileSync(
      join(directory, "example.tsx"),
      "export function Example(){return <div>Ready</div>}\n",
    );
    git("add", "example.tsx");
    writeFileSync(
      join(directory, "example.tsx"),
      "export function Example(){return <div>Ready</div>}\n// Unfinished work must remain unstaged\n",
    );
    execFileSync("sh", [resolve(".husky/pre-commit")], options);
    const staged = git("show", ":example.tsx");
    assert.equal(staged, "export function Example() {\n  return <div>Ready</div>;\n}\n");
    assert.match(
      readFileSync(join(directory, "example.tsx"), "utf8"),
      /Unfinished work must remain unstaged/,
    );
    assert.match(git("diff", "--", "example.tsx"), /Unfinished work must remain unstaged/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
