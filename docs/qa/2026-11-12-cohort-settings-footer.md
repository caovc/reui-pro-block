# Cohort phone settings footer

The Sera Working week footer squeezed status text under its action buttons.
The Working week consumer wraps the existing footer and action group on phones. Its
five CSS declarations preserve the actual free ReUI Frame/FrameFooter, Button
and ToggleGroup compositions, both real foundation implementations, labels,
fonts, padding, local saved/draft state and keyboard behavior. Shared primitives,
branding, assets and licenses are unchanged.

## Measured original failure and correction

The unchanged six-case probe first ran only the two Sera 390 cases on old 5460.
Both genuinely failed once with 17 soft geometry errors, while the complete
native Discard/Save/focus/route-persistence flows passed. The status element
was 27.40625px wide; clean text occupied three lines and dirty text two. Actual
Range fragments overlapped Discard by 9.0625px for `changes` and 10.375px for
`Unsaved`. This was status compression beside an intact 282.59375px action
group, separate from the already repaired weekday containment defect.
The final saved-state toast also covered a status fragment center. All original
results, eight inspected images and two complete traces remain unchanged.

On independently built 5462, the same unchanged external spec passed all six
first-run cases in 54.5s: Radix/Base × Sera 390, Sera 320 and Nova 390, all 844px tall.
Cases retain 30s overall, 5s actions/assertions, zero retries and full traces.
Every live clean/dirty/Discard-restored/saved/route-return phase checks full
status and button text Ranges, actual clipping ancestors, non-overlap and
status-fragment hit ownership. Dirty button centers must hit the enabled
native buttons. Disabled free buttons correctly retain pointer-events behavior.

| Both foundations | Status width, clean / dirty    | Action group             | Footer height |
| ---------------- | ------------------------------ | ------------------------ | ------------- |
| Sera 390         | 103.0625 / 101.625px, one line | 282.59375×40px, next row | 84px          |
| Sera 320         | 103.0625 / 101.625px, one line | 252×92px, buttons wrap   | 136px         |
| Nova 390         | 103.0625 / 101.625px, one line | 192.96875×32px, same row | 48px          |

All 30 measured status-fragment centers hit the real status. Native End/Tab/
Shift+Tab/Enter exercised Discard and Save with focus-visible indicators;
clean disabled controls were skipped by Tab, and saved weekdays survived
Policies→Organisation navigation. Browser runtime and blocked-request records
were empty. All 18 new PNGs were individually viewed. Saved images still show
the existing success toast over part of the lower disabled action area; they
are not proof of an entirely unobscured footer. No toast bounds were measured,
and no toast was hidden, dismissed or awaited to alter the oracle.

All six complete traces pass CRC, paired-call, original embedded-spec,
page-fault and response checks:1926 DOM snapshots, 1345 screencast frames and
705 GET 200 responses. All 90 available embedded artifact response bodies match
frozen bytes; the remaining 615 lack embedded bodies. The 18 recorded Inter
requests are 200 but have no embedded bodies, so their exact font bytes come
from the independent HTTP guards. Before and after the native invocation,
full source/public/config 1636, artifact 1391 and harness 12 inventories remained
exact. Both root/Base HTML, actual entry/theme/CSS and Inter/Geist responses
matched frozen artifacts across 12 actual HTTP GETs per guard.

## Permanent regression and scope

`tests/cohort-settings-footer.spec.ts` originally preserved every helper and the
complete six-case body after erasing TypeScript annotations. The two subsequent
sheet-close readiness additions are documented below. It uses the existing
CohortStyle type; the existing runtime style helper checks ToggleGroup items
and cannot replace the footer's button/text geometry oracle. Package imports
replace private absolute imports, and test.use carries the original external
viewport/navigation settings. The original 30s/5s/zero-retry/full-trace settings remain,
with normal repository parallelism/sharding and no serial override.

Format, lint, code-equivalence proof and discovery of six/two cases passed.
The actual permanent TS then passed its first two-case extraction adapter:
Radix/Nova 390 and Base/Sera 320, 21.4s. All six adapter PNGs were individually
viewed, both complete traces audited, and all full 5462/new-TS/helper/adapter
before/after guards passed. Its 642 DOM snapshots, 433 screencast frames,
235 GET 200s and 30 available exact response bodies contain no audit issues.
This validates extraction for two overlapping cases; it is not eight distinct
cases or another full six-case run. A list-reporter-created output directory
was preserved separately after the runner refused it before any native child;
the actual adapter started in a fresh directory, with no native retry.

This closes the bounded COHORT-SET-02 status/action overlap. The follow-up mobile
rule is restricted to the actual `[data-setting-section="working"]` consumer;
other Cohort section footers, the other six styles, desktop widths and the
official exact Sera footer arrangement are outside the verified scope. No full-reference pixel equivalence, source-export
acceptance, CI success or deployed-site update follows from this local result.
The prior weekday 16 and original Base 2 results remain separate; they were not
repeated for this footer change.

Evidence:

- Original red: `/tmp/cohort-set-02-5460-baseline-native-20261112-attempt-01/final-handoff.md`.
- Candidate six: `/tmp/cohort-set-02-5462-candidate-native-20261112-attempt-01/`.
- Permanent extraction: `/tmp/cohort-set-02-permanent-extraction-20261112/`.
- Permanent adapter two: `/tmp/cohort-set-02-5462-permanent-two-native-20261112-attempt-01/`.
- Exact candidate source/artifact/HTTP/font binding: `/tmp/cohort-set-02-5462-native-prep-20261112/`.

## Profile CI regression and sheet close readiness

The broad mobile selectors introduced a real Profile regression in main
`4d0e3eeb36716a58f1b2fa2e41f1e3879ec98e24`: Actions run `43320050985`, browser 1,
failed the original Cohort 390 settings case because its Profile footer was
76px rather than the required 48px (28px delta). The unchanged original case
also failed once on frozen 5458, preserving the failure and trace. The follow-up
changes only the two selector scopes to `[data-setting-section="working"]`;
all five wrapping declarations remain exact, retaining the real free Frame,
Button and ToggleGroup implementations.

Frozen 5466 contains that CSS correction. Its unchanged original phone case
passed once, with an actual Profile footer of x18/y561.75/354×48px and a 52px
header. This is the bounded Profile regression proof; it is not another full
Cohort matrix. The same 5466 first six-case permanent footer invocation produced
four passes and two failures (Base/Sera 320 and Base/Nova 390). All clean, dirty,
Discard-restored and saved geometry/hit checks passed. Only each final
saved-after-route-return status hit failed, with the native closing
`sheet-overlay` still at the measured point.

The retained traces show an exiting backdrop with `data-closed` and
`data-ending-style` after the role-based dialog-hidden check already passed,
then show that backdrop removed without another interaction. Base's installed
`OverlayModalElement` sets the closed popup inert and aria-hidden immediately;
Base UI keeps its portal mounted until the popup animation completes. Dialog
role invisibility therefore does not establish background hit readiness.
The permanent test adds only an auto-retrying zero-count assertion for the
actual `[data-slot="sheet-overlay"]` after each existing Escape/hidden check,
before measuring the background. It uses the existing 5s assertion budget and
preserves all hit ownership, text Range, bounds, keyboard, 0.75px tolerance,
30s whole-case, zero-retry and full-trace requirements. It does not sleep,
change focus, alter runtime code or wait for a toast.

After review, the readiness-corrected permanent test passed its first six-case
invocation on the same frozen 5466 runtime, without a rebuild or phone repeat.
The native child ran from 23:32:38.422653Z to 23:33:27.600705Z, exit 0,
49.177s wall time (Playwright 48.0s; each case 6.9–8.1s). All 30 measured status
fragment centers hit the actual status. Every complete native flow, text Range,
ancestor bound, non-overlap, dirty enabled-button hit and keyboard assertion
passed. All 12 actual-overlay zero-count assertions retained the original
5s budget: Radix took 4.5–7.2ms, Base 188.6–296.0ms. The original phone pass
and original four-pass/two-fail footer invocation remain separate evidence.

All 18 new PNGs were individually viewed. Working week status/actions fit:
Sera 390 retains an 84px footer, Sera 320 wraps buttons within 136px, and Nova
390 retains 48px. The success toast remains visible over part of the lower
disabled action region in saved screenshots; no toast was dismissed or awaited.
Other Sera section footers visible above Working week still show compressed
saved-status text, and Locations actions extend right at 320px. Those consumers
are outside this correction and were not measured by this Working week gate.

All six complete traces passed CRC, paired calls, exact embedded corrected-spec,
page-fault, HTTP and available embedded-artifact-body checks: 1950 DOM snapshots,
1283 screencast frames, 738 GET 200 responses, and 90 available bodies exact to
frozen artifact bytes. Runtime-fault and blocked-request attachments were empty.
Before and after this invocation, all 2453 frozen source files, 1430 artifact
files, 1632 shared runtime files and 12 actual root/Base HTTP/font responses
remained exact; the shared and private corrected test hashes were pinned
separately from the unchanged original test in the source snapshot. One earlier
preflight rejected the expected shared test SHA after the reviewed test apply;
that refusal is preserved and launched no native child. No first-failure
artifact was overwritten. CI and deployed-site outcomes require exact-SHA checks.

Follow-up evidence:

- Original phone red: `/tmp/cohort-profile-original-5458-red-20261112-attempt-01/`.
- Scoped CSS: `/tmp/cohort-profile-footer-ci-scope-20261112/consumer-only.patch`.
- Original 5466 results: `/tmp/cohort-profile-working-5466-seven-native-20261112-attempt-01/`.
- Static lifecycle and minimal test proposal: `/tmp/cohort-footer-overlay-readiness-20261112/`.
- Corrected six first native: `/tmp/cohort-footer-readiness-5466-six-native-20261112-attempt-01/`.
- Guard-only preflight refusal: `/tmp/cohort-footer-readiness-5466-preflight-oldshared-refusal-20261112/`.
