# Atlas mobile header repair — 2026-11-12

## Evidence and cause

This follow-up addresses visual finding `VT-ATL-001` (P2) from the [baseline visual audit](qa/2026-11-12-template-visual-audit.md). The source and local 390 × 844 captures were inspected before editing:

- `/tmp/reui-visual-audit/templates/17-atlas-source-home-390.png` and its JSON.
- `/tmp/reui-visual-audit/templates/18-atlas-local-home-390.png` and its JSON.

The local header was 64px high. Its wrapped date and Export actions occupied 72px and were centered vertically, putting the date at `y=-4`, height 32, and Export at `y=36`, height 32. Export therefore extended below the header and over the first dashboard card. The breadcrumb could also intersect the date action.

The source keeps the date at `y=16`, but its Export action extends to `x=412` on a 390px viewport; its document `scrollWidth` is 412. That overflow is not an acceptance target.

## Repair

At widths below 768px, Atlas alone now lets its header grow naturally with wrapped content, retaining its existing 64px minimum and adding 12px vertical padding. A nonempty action area occupies a full row. The existing ReUI Button actions wrap within the available header width. This resolves the fixed-height conflict without hiding Export, moving controls with transforms, replacing native controls, or changing shared Shell APIs.

Desktop header geometry remains 64px. Account pages with no header actions retain the existing 64px minimum. Native Sidebar, Sheet, account-menu, and focus ownership are unchanged.

The date action in the existing shared `Heading` is a Button that displays the current demo-period toast; it is not an implemented date filter. This repair preserves that existing behavior and does not claim working report filtering. Export continues to call the existing CSV download implementation.

The coordinated axis task has prepared an Atlas Threat Vectors opt-in to `BusinessBars responsiveAxis`. Its `atlas.tsx` consumer edit stays with that chart milestone while the chart owner finishes the Manifest phone edge-spacing gate. The header milestone consists of the CSS, regression tests and this record. All nine category labels and both data series remain with their existing fixtures. The source/local chart evidence was `/tmp/reui-visual-audit/templates/37-atlas-source-home-charts-settled-390.png` and `38-atlas-local-home-charts-settled-390.png`, plus their JSON.

## Verified candidate and scope

The root session's immutable candidate at `http://127.0.0.1:5210` passed **32 cases in two batches**:

| Batch        | Scope                                                        | Result                                   | Duration | Result JSON                                                |
| ------------ | ------------------------------------------------------------ | ---------------------------------------- | -------- | ---------------------------------------------------------- |
| Nova         | Nine original/new Atlas cases × Radix and Base UI            | 18 passed, zero skipped/flaky/unexpected | 115.5s   | `/tmp/atlas-header-formal-qa-2026-11-12/nova-results.json` |
| Other styles | Seven styles × Radix and Base UI; 390px home header geometry | 14 passed, zero skipped/flaky/unexpected | 87.4s    | `/tmp/atlas-header-style-qa-2026-11-12/results.json`       |

The committed spec now parameterizes real foundation entries: `/` for Radix and `/base/` for Base UI. All eight styles have mobile home-header coverage. Non-Nova cases use the actual URL `preset` mechanism, verify the generated stylesheet's `textContent` style marker and matching control-radius rules, and record computed typography, padding, radius, and geometry. They do not mutate `data-*` attributes to simulate style selection.

Both runs used one worker, zero retries, the unchanged 30s test / 5s action budgets, DPR 1, light mode, Inter, and `trace: retain-on-failure`. The Browser plugin and its browser skill were absent, so the read frontend-testing-debugging workflow used existing Playwright with `/usr/bin/chromium`. The temporary configs only supplied that executable and independent `/tmp` outputs. No dependencies or browser packages were installed. Both runners have exited and their browsers are closed.

The eight Nova home/Profile captures and fourteen non-Nova home captures were opened with `view_image` in this round. They show the intended page, meaningful content, and no framework error overlay. Evidence records the title `Bricklane — Blocks & Templates`, exact route and viewport, loaded fonts, and zero relevant console warnings/errors or page errors. Document width equals the 390px or 1440px viewport width.

The Nova cases verify control containment, no breadcrumb/body overlap, the existing demo-period toast, Tab/Shift+Tab focus order, and Enter on Export producing `report.csv` with actual `"Metric","Value"` content. Original desktop Sidebar collapse/shortcut/scrolling, Profile geometry, account themes, native layered Escape, Sheet/workspace/account navigation, and Collapsible assertions also passed in both foundations. Profile explicitly has no `.bt-actions` and retains its 64px header at both widths.

## Measured mobile outcome

The geometry below is the same in Radix and Base UI. Height grows with the actual style; the tests do not require a fixed mobile header height. Every action stays within its header and viewport, and the breadcrumb and body do not overlap it.

| Style | Header height | Date y / height | Export y / height | Export computed radius |
| ----- | ------------- | --------------- | ----------------- | ---------------------- |
| Nova  | 96px          | 52 / 32px       | 52 / 32px         | Not recorded           |
| Vega  | 100px         | 52 / 36px       | 52 / 36px         | 8px                    |
| Maia  | 100px         | 52 / 36px       | 52 / 36px         | 26px                   |
| Lyra  | 96px          | 52 / 32px       | 52 / 32px         | 0px                    |
| Mira  | 96px          | 52 / 32px       | 52 / 32px         | 8px                    |
| Luma  | 100px         | 52 / 36px       | 52 / 36px         | 26px                   |
| Sera  | 156px         | 56 / 40px       | 104 / 40px        | 0px                    |
| Rhea  | 96px          | 52 / 32px       | 52 / 32px         | 18px                   |

Nova's date is `x=24,w=237.671875`; Export is `x=269.671875,w=91.78125`. Sera's larger controls naturally wrap onto two action rows. At 1440px, Nova retains a 64px header, with date and Export at `y=16,h=32`; expanded Sidebar remains 256px and its collapsed state 48px. Account headers remain 64px at both tested widths.

## Reproduction commands and evidence

From the repository, the successful runs were:

```sh
PREVIEW_URL=http://127.0.0.1:5210 npm exec playwright test -- tests/atlas-whole-layout-native.spec.ts --config=/tmp/atlas-header-formal-qa.playwright.config.mts --workers=1
PREVIEW_URL=http://127.0.0.1:5210 npm exec playwright test -- tests/atlas-whole-layout-native.spec.ts --config=/tmp/atlas-header-style-qa.playwright.config.mts --workers=1 --grep='phone style preset'
```

The first command ran the eighteen Nova cases before the fourteen additional style cases were added; the original eighteen assertions and runtime did not change afterward. Scoped `oxfmt`, `format:check`, and `oxlint` passed. The temporary configs extend the repository Playwright config.

An initial private harness failed before opening any page because the default Playwright browser cache was absent; it is not product evidence. The first additional-style attempt also exposed a test-oracle error: `toContainText` excludes `<style>` content, yielding an empty string despite a populated stylesheet and visibly applied style. Its screenshots/traces remain in `/tmp/atlas-header-style-qa-2026-11-12/artifacts`. The corrected oracle polls `style.textContent` for the same marker, with the same budget and geometry checks; the successful fourteen-case evidence is in `verified-artifacts`.

Each screenshot below has a same-name JSON containing the exact preset URL, rectangles, typography, and zero-fault evidence. These `/tmp` artifacts are local verification evidence, not published website assets.

| Mobile style | Radix                                                                                                                                                     | Base UI                                                                                                                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nova         | [Screenshot](/tmp/atlas-header-formal-qa-2026-11-12/artifacts/atlas-whole-layout-native--6552f-d-preserves-keyboard-export/home-header-contained.png)     | [Screenshot](/tmp/atlas-header-formal-qa-2026-11-12/artifacts/atlas-whole-layout-native--b2ffb-d-preserves-keyboard-export/home-header-contained.png)     |
| Vega         | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--adc78-eader-contains-its-controls/phone-header-vega.png) | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--ad87a-eader-contains-its-controls/phone-header-vega.png) |
| Maia         | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--5d4f3-eader-contains-its-controls/phone-header-maia.png) | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--909e2-eader-contains-its-controls/phone-header-maia.png) |
| Lyra         | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--4866f-eader-contains-its-controls/phone-header-lyra.png) | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--308f2-eader-contains-its-controls/phone-header-lyra.png) |
| Mira         | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--56c6b-eader-contains-its-controls/phone-header-mira.png) | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--436f3-eader-contains-its-controls/phone-header-mira.png) |
| Luma         | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--423ab-eader-contains-its-controls/phone-header-luma.png) | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--77513-eader-contains-its-controls/phone-header-luma.png) |
| Sera         | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--47252-eader-contains-its-controls/phone-header-sera.png) | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--6204e-eader-contains-its-controls/phone-header-sera.png) |
| Rhea         | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--32c34-eader-contains-its-controls/phone-header-rhea.png) | [Screenshot](/tmp/atlas-header-style-qa-2026-11-12/verified-artifacts/atlas-whole-layout-native--04fc0-eader-contains-its-controls/phone-header-rhea.png) |

Desktop and Account screenshots are in `/tmp/atlas-header-formal-qa-2026-11-12/artifacts`: `home-header-contained.png` and `profile-header-no-actions.png`, with the route and viewport in their adjacent JSON. All eight were visually inspected.

## Exact ownership and limits

The independently releasable header milestone contains three files:

- `src/templates/business/atlas-shell-chrome.css`: Atlas-only natural mobile header layout.
- `tests/atlas-whole-layout-native.spec.ts`: two real foundations, eighteen Nova cases and fourteen additional mobile-header style cases.
- `docs/atlas-mobile-header-fix-2026-11-12.md`: this fix/verification record.

The change reuses the existing ReUI Button and Sidebar composition. No duplicate control implementation was added. Shared chart implementation/axis verification and the baseline audit remain owned by the coordinated agents; this record does not independently claim their results. There is no claim of full Atlas functionality across all sixteen foundation/style combinations: only mobile home-header geometry spans all sixteen. Non-Nova account pages, other widths, other browsers, and business date filtering are outside this verification. Git commit/push and deployment verification remain with the root session.
