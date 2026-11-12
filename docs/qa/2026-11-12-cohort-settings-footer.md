# Cohort phone settings footer

The Sera Working week footer squeezed status text under its action buttons.
The consumer now wraps the existing footer and action group on phones. Its
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

`tests/cohort-settings-footer.spec.ts` preserves every helper and the complete
six-case body after erasing TypeScript annotations. It uses the existing
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

This closes the bounded COHORT-SET-02 status/action overlap. The mobile rule
applies to other Cohort section footers, but their complete behavior and the
other six styles, desktop widths and official exact Sera footer arrangement
were not revalidated here. No full-reference pixel equivalence, source-export
acceptance, CI success or deployed-site update follows from this local result.
The prior weekday 16 and original Base 2 results remain separate; they were not
repeated for this footer change.

Evidence:

- Original red: `/tmp/cohort-set-02-5460-baseline-native-20261112-attempt-01/final-handoff.md`.
- Candidate six: `/tmp/cohort-set-02-5462-candidate-native-20261112-attempt-01/`.
- Permanent extraction: `/tmp/cohort-set-02-permanent-extraction-20261112/`.
- Permanent adapter two: `/tmp/cohort-set-02-5462-permanent-two-native-20261112-attempt-01/`.
- Exact candidate source/artifact/HTTP/font binding: `/tmp/cohort-set-02-5462-native-prep-20261112/`.
