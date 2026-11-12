# Preserve original SVG bytes in template projects

Template project downloads used Vite's asset URL when collecting SVG files.
Vite can inline and serialize small SVGs: the original Bricklane Drive mark
became319 bytes instead of its333 source bytes. The downloaded graphic remained
visually equivalent, but its source bytes no longer matched the repository.

The collector now reads SVG assets from their actual raw modules and encodes
those strings as UTF-8. An absent raw module fails explicitly. Fonts and other
binary assets retain their existing byte-fetch path; asset discovery and source
file ordering are unchanged.

## Validation

- Isolated5400 contains only this runtime change over the previously tested5390
  baseline. Semantic TypeScript and both production foundation builds passed.
- The actual Radix/Nova Pulse source dialog downloaded an untouched project in
  one native test, with the existing30s case /5s action budgets, no retry, one
  worker and tracing retained. It passed in10.117s with no console, page,
  request or HTTP faults. The new screenshot was inspected.
- All258 ZIP members passed CRC/SHA checks. All249 repository-derived members,
  including both fonts and all eight license/attribution files, exactly match
  the frozen source. The remaining nine are generated starter files.
- The project's only SVG is333 bytes and has SHA256
  `99a081aa51bd1c403998323e6b8ea65323d1a15401ac838b7898618a0d34b67c`,
  exactly matching the source, including the final LF. The inline favicon is
  also strictly333 bytes. No trimming or XML-equivalence exception was used.
- Literal-import closure covers233 source files,829 local edges and388
  external edges, with no missing local or undeclared package dependency.
- Against the preserved5390 ZIP, only that SVG member changed; all other257
  members are byte-identical. Source, artifact and extracted member hashes
  stayed unchanged throughout the native download and offline audit.

The new ZIP is951406 bytes, SHA256
`3bc0ea677579e904a51c3b446864c697736edc19e352c784fdc613c7142f7582`.
Private evidence is in
`/tmp/pulse-export02-fresh-5400-20261112-jbr9w1gq/final-native-audit-evidence.json`.
Browser plugin not available; the native test used system Chromium through
Playwright.

Normal fresh installation, the original strict build and built-artifact smoke
passed for the prior5390 package. They were not repeated on5400: its only
changed project member is the SVG asset, with no code or dependency change.
This result covers this template export, not all foundations/styles or block
exports. The analogous block collector remains a separate tracked task.
