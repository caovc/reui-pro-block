# Flow inspector tabs and period controls

Scope: Flow 3–4 inspector tabs and Flow 4's period button group. This is a
separate batch after the frozen Flow 1–2 fidelity corrections; its original
seven files remain unchanged in the shared workspace until the publisher
integrates the next patch.

## Observed issues

The current Flow consumers did **not** reproduce the Templates catalog's visible
vertical scrollbar at either 1440 × 900 or 390 × 900. The old 40px inspector row
had a 39px content box and a 40px child, but overflow was visible and setting
scrollTop had no effect. Giving this fixed row horizontal auto overflow would
make that mismatch a cross-axis scroll risk.

The old inspector controls were ordinary buttons with no tablist/tab/tabpanel
semantics or arrow-key navigation. Flow 4's period group used hidden overflow,
which clipped its keyboard focus outline. The desktop Settings form's own
668px viewport and 672px content represent genuine form scrolling, which is
preserved. Read-only evidence: `/tmp/fg-tabs-audit-20261026/report.md`, metrics,
keyboard records and focus screenshots.

## Correction and free-component reuse

`FlowInspectorTabs` consumes the installed official free Tabs, TabsList line,
TabsTrigger and TabsContent, including controlled selection, roving focus,
associated panels, active indicator and focus styles. The two short labels fit
at both target widths, so no scroll container or scrollbar-hiding rule is added.
The 40px list includes its border, triggers fit the content height, and the
official indicator is positioned at bottom zero inside the row. Independent
classes avoid the old hand-drawn `.fg-tabs` styles.

The period selector is a button group in the public reference, not a tablist.
`FlowPeriodControl` therefore consumes the actual free ButtonGroup and Button
with pressed state, joined borders and full accessible labels. Only visible
labels shorten on phone. Its overflow stays visible so native keyboard focus
survives. No shared Tabs implementation, global CSS, DataGrid, source viewer or
body scrollbar is modified.

The new leaf returns its children directly when disabled, preserving Flow 1–2's
inspector DOM. Graph/run/draft state remains with the existing consumer; no free
Tabs implementation is replaced with custom keyboard logic. Existing MIT/OFL
notices and local original artwork remain intact.

## Integration boundary

The shared workspace's frozen Flow implementation and old regression file are
not edited in this batch. Their candidate-only patches import the new leaf,
replace the inspector button row and period controls, and update only the old
Growth Map test's Settings/Links locators from button to tab roles. There are no
Gantt/Timeline or runner changes. The publisher applies this patch after the
first Flow batch; exact candidate hashes and paths live in the separate release
manifest. Recursive source traversal already includes the new TSX/CSS imports;
the actual Code file list and downloaded starter were checked.

## Validation

Browser plugin not available; the existing Chromium Playwright installation was
used. An isolated production candidate based on `303cc13` plus the first frozen
Flow patch and these consumer corrections passed strict TypeScript/Vite build.
The 40-case run passed 39 cases; the remaining old Growth Map test still queried
Settings as a button after its semantic upgrade. Both affected locators were
corrected to native tab roles. The five new tab/period cases plus that exact old
Growth Map case then passed 6/6; no product behavior or timeout was weakened.
Logs: `/tmp/flow-tabs-production-tests.log`, `/tmp/flow-tabs-targeted-tests.log`.

Verified: 1440/390 list scroll dimensions match their viewport; no vertical or
horizontal list scroll range, native ArrowLeft/Right/Home/End, Tab into the
tabpanel and fields, active underline within row, visible focus ring, period
click/Enter/Space and pressed state, real form scrolling and fixed footer.
Independent leaf production checks include dark mode. Full-page checks confirm
the intended URL/title and meaningful content with no app console errors or
warnings, framework overlay or page overflow:
`/tmp/flow-tabs-page-qa.json`. Native component evidence:
`/tmp/flow-inspector-tabs-production-metrics.json`.

The real Flow 4 Code tab's copy, single-file download and ZIP contain matching
implementation bytes and both new leaf files. The extracted starter passed its
own strict TypeScript/Vite build:
`/tmp/flow-tabs-source-roundtrip.log`, `/tmp/flow-tabs-starter-inventory.json`,
`/tmp/flow-tabs-starter-build.log`. The extracted production starter at port 5327
passed period Enter activation and Settings-to-Links arrow navigation at both
widths. Both lists have matching 39px client/scroll heights and matching widths;
focus and selection remain on the active tab. The desktop Settings body retains
its genuine auto scroll range. There were no console errors/warnings, page
overflow or framework overlays: `/tmp/flow-tabs-starter-qa.json`.

Limits: these two-label consumers have no real horizontal overflow; the shared
catalog's long-list touch scrolling and focus visibility are owned by the
shared Tabs/layout review. This patch does not hide their scrollbars. Flow 3–4
runner, Links/Goal/Save fidelity corrections remain a later batch, as described
in `/tmp/flow-r2-reference-34-20261026/README.md`.
