# Visible selected Settings tabs

The Radix phone Account Security shortcut selected the right route but left
Security clipped in the horizontal tablist. An unchanged old5450 case captured
the trigger ending437.859375px beyond the390px viewport before any action could
auto-scroll it. The earlier26 behavioral passes did not check this geometry.

The Settings consumer now reveals its actual selected trigger inside only its
own horizontal scrollport on mount, selection and size changes. It retains the
existing free Tabs composition and real Radix/Base adapters. A transparent
outline has fixed2px/-2px geometry before focus; keyboard focus changes its
color. This prevents the existing transition-all from briefly interpolating
the outline outside the clipped navigation. Desktop rules, page scroll and
shared primitives are unchanged.

## Retained failures and corrected test assumptions

The first5460 batch stopped0passed/1failed/21unrun at its one-Tab focus premise.
A separate read-only diagnostic preserved that failure and recorded actual
focus on Radix's native tabindex0 list. The reviewed v3 test advances exactly
once more only from that proven native list entry; it never skips another
target, forces selected focus or applies a Base fallback. Final selected focus,
visible paint, bounds, pointer ownership and all budgets remain mandatory.

Base legitimately omits horizontal aria-orientation; the test checks its actual
default and real horizontal geometry. No Radix attribute was added to Base.

V3 on5460 still failed its unchanged immediate paint assertion: outline width2
but offset-1 during the free transition. Its original trace and images remain.
The consumer geometry repair formed a new5461 artifact; neither old batch was
rerun to replace its result.

## Final validation

The original reviewed v3 suite passed all22 cases on5461 at its first run,
95.118s: both foundations, five direct routes, five account shortcuts and native
Right/Left/Home/End sequences. All42 PNGs were individually inspected,22 complete
traces audited,2115 recorded GETs returned200 and runtime fault records were
empty. Twenty unfocused samples had transparent solid2px/-2px outlines;34 real
keyboard-focus samples had full contained geometry, visible focus and all three
hit points owned by the trigger. Base used no keyboard-entry fallback.

Full candidate source/artifact, HTTP and private harness checks passed before
and after. Scoped TypeScript passed on5460 in9.334s. The only5461 runtime change
was CSS; both new production builds passed in12.599s and9.263s. Uncommitted Source
performance work is excluded from these candidates and this milestone.

Evidence:

- `/tmp/strata-settings-selected-tabs-5460-native-20261112/final-two-phase-handoff.md`
- `/tmp/strata-settings-selected-tabs-focus-diagnostic-5460-native-20261112/final-diagnostic-handoff.md`
- `/tmp/strata-settings-selected-tabs-v3-5461-native-20261112/offline-final-audit.json`

This closes the measured390px Nova Settings scope. It does not establish all
Settings behavior in every style, the separate General preference contracts,
all exported projects or the Source performance gate.
