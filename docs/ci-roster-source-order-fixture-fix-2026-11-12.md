# Roster source-order CI fixture correction

The reported CI failure in `tests/templates-source-round3.spec.ts` expected the old
three-file Roster prefix. The actual source registry correctly promotes Calendar
before Approvals and Import.

The fixture now expects this order:

1. `src/templates/collaboration/roster.tsx`
2. `src/templates/collaboration/roster-calendar.tsx`
3. `src/templates/collaboration/roster-approvals.tsx`
4. `src/templates/collaboration/roster-import.tsx`

The existing source view, real clipboard, and ZIP-content assertions still select
`roster-approvals.tsx`. Calendar source bytes remain covered separately by
`tests/roster-source-original.spec.ts`; this correction does not replace the old
Approvals checks with Calendar checks.

Validation completed: file-scoped oxfmt, oxlint, and Playwright `--list` with
`--grep 'roster promotes' --workers=1` (one test found). A Node check of the actual
`templateFiles` and `downloadTemplate` functions confirmed the four-file prefix and
byte-identical source/ZIP members for all four files. The unmodified exporter ZIP
contains 258 members; evidence is under `/tmp/ci-roster-source-order-2026-11-12/`.
This Node check does not establish browser or clipboard behavior.

The focused formal run at `http://127.0.0.1:5220` passed **1/1** with system
Chromium and one worker: 13.4 seconds for the case, 15.9 seconds total. It preserved
the original 30-second test budget, default assertions/actions, zero retries, and
`retain-on-failure` tracing. The run exercised the actual Approvals source view,
clipboard, and ZIP assertions. Reading the unmodified UI ZIP also confirmed that
all four listed source members match disk bytes; evidence is
`ui-original-zip-proof.json` beside `formal-results.json` in the directory above.

Port 5220 included the main session's uncommitted progressive-viewer candidate;
the focused case passed on that candidate. This is not a result for all Source
tests or a separate main-viewer rerun. No production code, helpers, runtime
configuration, timeouts, retries, or tracing settings were changed.
