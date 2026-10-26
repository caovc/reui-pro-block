# Navbar 12 Company menu: CI state synchronization

## Scope and provenance

This is a test-only correction in `tests/navbar-final-bars.spec.ts`. No navbar,
shared primitive, asset, dependency, route, or source-export code changes.
The consumer continues to compose the actual free ReUI `c-navigation-menu-4`
implementation in `final-bars/free/mega-menu.tsx`, using the existing native
Radix NavigationMenu. The free example's raw upstream SHA256 is
`3659aad74e95edd0fccf5613adeda41de76d28e6c6fa18c96df515ddbd3b2de7`;
its MIT provenance remains in that source. The upstream primitive wrapper is
unchanged. There is no replacement menu engine or custom open/close behavior.

## Preserved failure

- Run: [40267574102](https://github.com/caovc/reui-pro-block/actions/runs/40267574102).
- CI commit: `4e39f639324b570542fbf83b33a5a87e679b096e`.
- Result: 1,178 passed, one failed. The failing desktop case waits for Contact
  at the former line 40; the original failure is retained, not reclassified as a pass.
- Diagnostic artifact: `12627433960`, `playwright-diagnostics-40267574102`.
- Downloaded ZIP SHA256:
  `d6089f7b6d92cc1b346cd9f2f50a5d8c22bec2b0aefcc52404c3552e00fe607b`,
  equal to GitHub's artifact digest.
- Evidence root: `/tmp/bricklane-navbar-company-ci-audit/original-ci/`.
  This contains the unmodified downloaded ZIP, extracted trace/context, and full
  failed run log. `native-state-evidence.json` is a derived, timestamped extract;
  the raw trace is authoritative.

CodeGraph was consulted before inspecting the test/consumer. Its index did not
contain the anonymous top-level test callbacks, so the missing test body was
read from disk. The GitHub connector transport failed; read-only `gh api` fetched
this exact run's artifact. No workflow was rerun.

## Trace diagnosis

The trace establishes a closed, animating-out menu, not a delayed Contact effect:

| Trace event                     | Monotonic milliseconds | Observed native state                                                             |
| ------------------------------- | ---------------------: | --------------------------------------------------------------------------------- |
| Company click begins            |             735927.878 | Unconditional trigger click                                                       |
| Company click ends              |             736088.200 | Action completed                                                                  |
| Post-click snapshot             |             736095.530 | Viewport and Company content `data-state=closed`; viewport `pointer-events: none` |
| Visibility expectation begins   |             736096.983 | Exit-presence content still rendered                                              |
| Before visibility snapshot      |             736109.670 | Company trigger `aria-expanded=false`, `data-state=closed`                        |
| Visibility expectation succeeds |             736114.439 | Visibility alone accepts the exiting panel                                        |
| Link-count expectation succeeds |             736129.857 | Six links remain during exit presence                                             |
| Contact click starts            |             736161.912 | Link is unstable, then detached; no input event occurs                            |
| Test teardown                   |             763941.861 | Original 30-second test budget exhausted                                          |

The trace does not sample every intermediate hover event, so it is not claimed
to show an exact hover-open timestamp before the Company click. The native
controlled experiment below independently demonstrates the toggle transition
that the former unconditional click permits. The directly observed defect in
the test is accepting exit-presence visibility as input readiness.

## Correction and native controlled evidence

Both initial Product and Company page-selection paths explicitly hover the
actual trigger and await `aria-expanded=true` and `data-state=open`. Only then
do they inspect bounds/counts and click the destination. No conditional
getAttribute-then-click branch, forced click, sleep, retry, animation disabling,
or timeout increase is introduced.

The existing native-behavior case now checks Company as well as Product:
hover opens, clicking the already-open trigger closes, moving away and hovering
again opens, moving away closes, and the original Product keyboard/ArrowDown/
Escape/focus-return checks remain. This preserves native behavior rather than
changing the application to accommodate a test.

The private real-browser experiment at
`/tmp/bricklane-navbar-company-ci-audit/controlled-native.cjs` uses the stable
5459 production build without changing its source or assets:

1. Company hover reaches `expanded=true`, `data-state=open`, visible panel.
2. The former extra trigger click deterministically reaches `expanded=false`,
   `data-state=closed`, hidden panel, no selected destination. This is a controlled
   invalid precondition, not a newly generated CI-load failure.
3. Moving away, then using the corrected hover/open path, retains all six links;
   clicking Contact selects the actual local Contact content and closes the menu.

The state receipt, real browser trace, and two local screenshots are retained as
`controlled-native.json`, `controlled-native-trace.zip`,
`controlled-company-open.png`, and `controlled-contact-selected.png` beneath
`/tmp/bricklane-navbar-company-ci-audit/`.

## Validation

The complete six-file Navbar regression passed **77/77** in **2.2 minutes**, with
one worker and the standard 30-second per-case budget. The original affected
1440px case, 390px counterpart, all fourteen destinations, expanded Company
native toggle contract, keyboard/Escape/focus checks, and source/download cases
all passed. There were zero retries. The scoped two-file formatting check and
scoped test lint also passed. Exact frozen hashes and the production log are
recorded in the external integration receipt. The private Playwright configuration keeps the repository's standard
30-second test timeout, one worker, no retries, and an isolated output directory.
The production server is the pre-existing combined candidate at port 5459;
there is no new strict build or application change in this batch.

All original eight Product links, six Company links, Contact selection, icon
sizes, desktop/390px bounds, all fourteen destinations, native hover/click and
keyboard/Escape behavior, editor effects, clipboard, source-file bytes, and
starter-export assertions are retained. Passing these checks is evidence of
test synchronization and functional regression coverage; it does not certify
new visual fidelity against the public reference. No original-site media is
introduced or distributed.
