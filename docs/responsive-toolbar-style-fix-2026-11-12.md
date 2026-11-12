# Responsive toolbar icon buttons — FSA-06

## Verified outcome — 2026-11-12

The responsive caption buttons now expand to contain their captions and hit targets, while mobile icons retain each official style's square dimensions. The accompanying Handover consumer fix restores focus to its real opener after Escape, using the existing Add Company focus-restoration pattern.

The final 5240 verification is **30 first-run passes, followed by two unchanged-configuration targeted passes**. The first full attempt also contains one Base Rhea desktop post-click synchronization failure and one unexecuted Base Rhea mobile case. This is **not a single uninterrupted 32/32 pass**. The failed click reached the page and opened the Dialog; its retained trace timed out while Playwright waited for scheduled navigation. The two original Rhea cases subsequently passed sequentially with the same source, test, ordinary clicks, 30s test budget, 5s action budget, and zero retries. No `noWaitAfter` was added.

All 32 combinations therefore have a passing execution across the two final batches. The original failure remains part of the evidence and is not counted as a pass. All browsers from these runs are closed and the coordinated browser window has been released.

## Problem and evidence

Prospect Database's desktop Hand Over, Add Company, My Accounts, and Columns controls use the real ReUI Button composition with `size="icon"` and `sm:w-auto`. Their captions are hidden on mobile and shown on desktop. Non-Nova style CSS overrode that explicit responsive width with the style's fixed icon width. Captions could then paint over neighboring controls and point to the wrong action.

The root session authorized this repair after the foundation auditor measured Nova and Vega in both foundations on the unchanged 5220 candidate. This repair independently opened the current Radix Vega/Maia/Lyra returned-block screenshots before editing. It then added a regression test and reproduced the failure in **both Vega desktop cases before changing runtime code**.

The two new baseline cases failed at the intended geometric assertion, with zero page faults:

| Control     | Vega button width | Caption width | Observed hit-test consequence           |
| ----------- | ----------------- | ------------- | --------------------------------------- |
| Hand Over   | 36px              | 71.34375px    | Caption center/end hit Add Company      |
| Add Company | 36px              | 95.03125px    | Caption end hit the surrounding section |
| My Accounts | 36px              | 88.125px      | Caption exceeded its button box         |
| Columns     | 36px              | 59.078125px   | Caption end hit Settings                |

Both foundations failed because Hand Over's caption began at `x=972.328125`, outside its button starting at `x=979`. All four button heights were also 36px. The baseline cases stop before behavioral clicks, so the incorrect hit tests did not trigger those neighboring actions.

Baseline evidence is in `/tmp/responsive-toolbar-style-qa-2026-11-12/baseline-5220`, with a `toolbar-before-actions.json`, PNG, and retained trace for each case. The two PNGs were opened and have identical SHA256 `6c77cadf4c1079e15e5b95eb8c1f2aa2b4542663b2a7240b12fbde478eb43134`; their same visible defect matches the independent auditor's fresh measurements. Summary: `/tmp/responsive-toolbar-style-qa-2026-11-12/baseline-5220-results.json`.

## Root cause and change

The Button variants retain both `size-8` and `sm:w-auto`. The shared style generator's unlayered icon rules write a profile-specific width and height to the original `size-*` class. That width takes precedence over the responsive utility. Nova emits no additional profile stylesheet, explaining its normal behavior.

The repair keeps every existing icon width, height, and radius rule. It adds `min-width: max-content` only when the same native icon button has an explicit `w-auto` or a variant class containing `:w-auto`. This covers viewport and container variants without recreating breakpoint definitions. Hidden captions do not contribute intrinsic width; visible captions expand the actual button hitbox along with the text.

The four current Prospect consumers have no explicit button-level min/max width conflict. Their mobile SVGs and the 20px My Accounts avatar fit within the smallest standard icon profile, so the original square dimensions can be preserved. Other literal icon + responsive-auto consumers include Support Scorecard; this shared fix is not keyed to the Prospect route. Similar Freight/API-request-log controls use a different Button size and are outside the new icon selector.

The width repair does not change consumer padding or labels. Native ReUI Button and CascaderTrigger still own interaction and focus. No replacement control was added. The existing theme generator remains the shared path for live previews and exported theme CSS.

## Handover focus gap found during verification

The first 5230 Nova desktop case passed all caption geometry and hit checks, opened Hand Over by clicking its real caption, and closed the Dialog with Escape. It then failed the retained opener-focus assertion. The suite stopped after that first failure; 31 cases did not run. The same unchanged assertion also failed in one diagnostic Nova desktop case on the previous 5220 candidate, confirming the issue predated this non-Nova width rule. These runs are evidence of an existing consumer focus gap, not a reason to remove the assertion or claim a complete green run.

`ProspectHandover` previously mounted an always-open controlled Dialog and unmounted it immediately on close. Its external Button was not a DialogTrigger, and the consumer had no `onCloseAutoFocus` handling. The existing Add Company editor already records its real opener, retains its closed Sheet through dismissal, and uses `restoreAccountFocus` for a connected, visible, enabled target with Search/Add Company fallbacks.

Root authorized reusing that same consumer pattern for Handover. Its Button now records `event.currentTarget`; the Dialog receives its controlled `open` state and `onCloseAutoFocus`, remains mounted through closing, and restores the actual opener through the existing helper before final unmount. Cancel and commit share the close path. Shared Button/Dialog implementations and all new focus assertions remain unchanged.

The first 5230 attempt is retained in `/tmp/responsive-toolbar-style-qa-2026-11-12/green-5230`, with its result JSON alongside. The one-case old-runtime confirmation is in `focus-diagnostic-5220`. The consumer fix was included in the root-built 5240 candidate used for the final verification below.

The first 5240 attempt passed Handover and Add Company open/close/focus checks, then exhausted the unchanged total test budget after the second My Accounts click. Its trace showed serial readiness and geometry RPCs consuming the available time; it did not establish a My Accounts product failure. That trace and extracted call timings are retained in `green-5240`. Root authorized batching only independent host/frame attributes, then font readiness, and independent button geometry reads. All dependent UI actions, assertions, and budgets remain unchanged. The optimized Nova desktop preflight passed in 18.5s before the subsequent matrix attempts.

## Regression coverage

The new `tests/responsive-toolbar-style-native.spec.ts` declares **32 independent cases**: two foundations × eight styles × 1440px/390px. It uses the real Prospect block host and supported URL presets. On mobile it selects the visible, native Mobile viewport control while the host is desktop-sized, then resizes the host to 390px and checks iframe `innerWidth=390`. Shrinking the host alone would merely scale its desktop iframe and would not test hidden captions. The common accessible label locates the native picker in both foundations.

Each desktop case checks that all four captions are fully inside their own buttons, caption center/end points hit their own target, and the four button boxes do not overlap. Each mobile case checks hidden captions, the official square size of all four controls, and center-point hit ownership. An ordinary Settings icon with no auto-width class must remain square at both widths.

The same cases then exercise the actual actions: Hand Over Dialog and Add Company Sheet open and Escape restores focus; My Accounts changes the pressed state and row filtering, then restores it; Columns opens the native Cascader and Escape restores focus. They also check document overflow and page warnings/errors. The original budgets remain 30s per test, 5s per action, zero retries, with retained failure traces.

Across the passing executions, the retained assertions cover all 128 responsive controls, all 64 desktop caption boxes, all 192 hit-test points, all 64 mobile square controls, and the ordinary Settings icon in all 32 contexts. Every hit-test point belonged to its intended button; no caption exceeded its own button. Both host and iframe document overflow checks passed. Handover, Add Company, My Accounts, Columns, and all retained opener-focus assertions passed in every combination across the final two batches. The passing executions reported no page faults or console warnings/errors.

The two foundations produced identical desktop button widths for each style. These measured widths are in control order Hand Over / Add Company / My Accounts / Columns; the last column is the preserved height and mobile square side.

| Style | Desktop widths (px)                             | Icon side (px) |
| ----- | ----------------------------------------------- | -------------- |
| Nova  | 115.34375 / 139.03125 / 136.125 / 121.078125    | 32             |
| Vega  | 115.34375 / 139.03125 / 136.125 / 121.078125    | 36             |
| Maia  | 115.34375 / 139.03125 / 136.125 / 121.078125    | 36             |
| Lyra  | 105.15625 / 125.453125 / 123.53125 / 112.640625 | 32             |
| Mira  | 105.15625 / 125.453125 / 123.53125 / 112.640625 | 28             |
| Luma  | 115.34375 / 139.03125 / 136.125 / 121.078125    | 36             |
| Sera  | 125.875 / 148.609375 / 152.65625 / 132.078125   | 40             |
| Rhea  | 115.34375 / 139.03125 / 136.125 / 121.078125    | 32             |

The reviewer actually opened all 31 pre-action screenshots captured in the final full attempt, then both Rhea targeted screenshots: 33 files, representing all 32 passing combinations plus the retained failed-attempt desktop duplicate. The targeted Rhea desktop shows captions contained in their rounded buttons with clear spacing; its real 390px mobile screenshot shows the four compact icon controls without visible captions. The other styles retain their distinct fonts, radii, and icon dimensions. These screenshots show the pre-action toolbar state; popup and focus outcomes are established by the behavioral assertions and traces.

## Exact final execution evidence

All paths below share `/tmp/responsive-toolbar-style-qa-2026-11-12/`. The existing frontend-testing-debugging Playwright path used system `/usr/bin/chromium` because no Browser plugin was available. Temporary configs retained the repository's 30s test budget, the test's 5s action budget, zero retries, and failure traces. Each run used one worker. No dependencies or browsers were installed. Candidate 5240 was built by the root session; this report does not claim an independent build.

| Batch                         | Start (UTC)         | Result                                                   | Evidence                                                 |
| ----------------------------- | ------------------- | -------------------------------------------------------- | -------------------------------------------------------- |
| Final full attempt            | 2026-11-12 11:42:23 | 30 passed, 1 failed, 1 not run; 419.160s total           | `verified-v3-5240-results.json`, `verified-v3-5240/`     |
| Original Rhea cases, targeted | 2026-11-12 11:55:56 | 2 passed; desktop 14.099s, mobile 11.758s; 28.235s total | `rhea-targeted-5240-results.json`, `rhea-targeted-5240/` |

The first failure is `base rhea 1440: responsive toolbar bounds and native actions`. Its ordinary Hand Over caption click was visible, enabled, stable, and delivered. The failure snapshot contains the open Hand Over Accounts Dialog with From focused. The action then exceeded its original 5s budget waiting for scheduled navigation to finish. The trace does not establish a real iframe navigation or a product action failure. This remains a synchronization failure in the first full attempt, rather than a green result or a proven browser-wide diagnosis.

Retained failure evidence:

- `verified-v3-5240/responsive-toolbar-style-n-dcbf9-r-bounds-and-native-actions/trace.zip`
- The same directory's `error-context.md` and `toolbar-before-actions.json`/PNG.
- `verified-v3-5240/navigation-barrier-diagnostic.json`, which records the delivered click, open Dialog, and observed frame URLs.

The final commands were:

```sh
PREVIEW_URL=http://127.0.0.1:5240 npm exec playwright test -- tests/responsive-toolbar-style-native.spec.ts --config=/tmp/responsive-toolbar-verified-v3-5240.playwright.config.mts --workers=1 --max-failures=1
PREVIEW_URL=http://127.0.0.1:5240 npm exec playwright test -- tests/responsive-toolbar-style-native.spec.ts --config=/tmp/responsive-toolbar-rhea-targeted-5240.playwright.config.mts --workers=1 --max-failures=1 --grep='base rhea'
```

`effective-32-geometry-summary.json` indexes the 32 passing combinations' JSON and screenshot paths and records the aggregate geometry/hit results. It explicitly identifies its basis as 30 first-run passes plus two unchanged-configuration targeted passes. The first 30 were not rerun. Source and test bytes were unchanged between these two final batches:

| File                                                         | SHA256                                                             |
| ------------------------------------------------------------ | ------------------------------------------------------------------ |
| `src/foundations/styles/index.ts`                            | `78ba63cfc1be69605eb4f8ea73403fecf783c89e457897a600eca0a44285cc59` |
| `src/blocks/data/grid-advanced-prospect-database.tsx`        | `90cf6f058659bdc7614559083bfaf275337e9cf3c427b7541bb72a3b68908656` |
| `src/blocks/data/grid-advanced-prospect-database-panels.tsx` | `d35242e8b4961c38548231ab04c14f7718d7db42ae7aba18587f3600edaf75d6` |
| `tests/responsive-toolbar-style-native.spec.ts`              | `fec95b319d7576ae7f141a873917c47ef68ecd65a7dc3d788980bf560bab00b5` |

## Retained earlier diagnostic runs

All runs listed here occurred on 2026-11-12 and remain in the same evidence root. They are historical evidence, not additional final passing matrix cases.

- `baseline-5220`: two expected Vega desktop geometric failures before the width repair, one per foundation.
- `green-5230` and `focus-diagnostic-5220`: the genuine Handover opener-focus gap on new and old runtime, respectively. The consumer fix addresses it.
- `green-5240`: the initial total-budget exhaustion from cumulative serial RPCs; retained `call-timings.txt` supports the approved independent-read batching. It is not counted as a My Accounts product defect.
- `optimized-nova-5240`: optimized Nova desktop preflight passed.
- `verified-5240`: the phone setup incorrectly tried a viewport picker after the host had hidden it below `sm`. Setup was corrected to select Mobile before shrinking; no product defect is claimed.
- `verified-v2-5240`: five cases passed before a deliberate stop to replace the Radix-specific viewport role with the common native accessible label. Those five are not added to the final 30 + 2 count.
- `base-phone-preflight-5240`: Base Nova real-phone preflight passed after that locator correction.

The red command was:

```sh
PREVIEW_URL=http://127.0.0.1:5220 npm exec playwright test -- tests/responsive-toolbar-style-native.spec.ts --config=/tmp/responsive-toolbar-baseline.playwright.config.mts --workers=1 --grep='vega 1440:'
```

## Ownership and limits

This repair owns only:

- `src/foundations/styles/index.ts`
- `src/blocks/data/grid-advanced-prospect-database.tsx`
- `src/blocks/data/grid-advanced-prospect-database-panels.tsx`
- `tests/responsive-toolbar-style-native.spec.ts`
- `docs/responsive-toolbar-style-fix-2026-11-12.md`

It does not edit the foundation product matrix, Host CSS, shared/vendor primitives, or source/download routing. A scoped search found no frozen-hash assertion for the two Prospect leaves; the existing Prospect source/export tests compare against current file bytes and remain intact. Scoped format, format-check, lint, and diff whitespace checks passed for this owned change.

The implementation continues to reuse the official free ReUI Button, Dialog/DialogContent, Sheet, and Cascader composition. The only new custom behavior is the narrow generated sizing rule and the existing consumer focus-restoration pattern applied to Handover's external opener. No free component was replaced with an approximation.

This verification covers light mode in system Chromium at the stated desktop and real iframe phone widths. It does not establish Handover commit/save behavior, backend persistence, every keyboard path, or full accessibility conformance. Explicit min/max-width constraints and mismatched caption/padding breakpoints would need separate review if introduced. Root retains Git commit/push and deployment ownership; this agent performed no Git writes.
