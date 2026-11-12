# Base/Radix implementation and coverage review

The current resolver uses a separate Base build and substitutes actual Base UI
modules. A missing same-name file does not by itself establish a Radix fallback.
The static review found61 shared UI modules,41 Base modules and36 substitutions.
The25 shared modules without a Base counterpart consist of native HTML helpers,
neutral engines and compositions whose Button/Dialog/Select imports themselves
resolve to Base.

The actual resolver functions were extracted from `vite.config.ts` and exercised
for alias, absolute and relative imports. A static local import closure from the
registered template/block renderers contained1005 modules and no direct Radix
runtime imports after Base resolution. The full-site closure contained1024.
These are static module counts, not rendered test coverage or a claim that the
bundle contains no Radix dependency. In particular, shared Command uses cmdk's
generic command engine, while its mounted popup uses the aliased Base Dialog;
the application does not mount cmdk's separate Radix Dialog export.

There is a confirmed test-coverage gap. Under the default CI topology, root
serves Radix and `/base/` serves Base. An absolute `/#/...` navigation discards
the `/base/` part of `baseURL`. Older Manifest whole-layout, Lucent account,
Cohort organization, template interaction and Source CodeBlock specs contain
these root routes. The older workflow helper also does, although its newer Mesh
branch is explicitly parameterized. A separately served Base-only origin can
support these flows, but it must retain real primitive evidence; changing only
the baseURL label is insufficient. Four CI shards partition tests and do not
automatically create a second-foundation or eight-style matrix.

Existing explicit two-foundation/style matrices remain useful within their
scope: shared Field/Select/Sheet/Dialog, host search, responsive toolbars, Atlas
phone headers, Job creation/density, Pulse chart/Sheet flows and Limelight
controls. Their phone/header or representative-flow results do not establish
complete coverage of all679 blocks and18 registered templates. The Strata
private default matrix separately records genuine Base and Radix entry checks.

Next coverage tasks are:

1. Adapt legacy core flows to actual Base entries, asserting the rendered
   primitive and preserving native popup, keyboard, focus and original budgets.
2. Exercise shared Command/Combobox consumers through their real Base overlays.
3. Extend high-risk long-label/overlay cases to non-Nova desktop styles.
4. Keep catalog rendering, original source bytes, downloaded project builds and
   real browser behavior as separate gates.

The review changed no runtime code. Detailed source/caller evidence, resolver
probes, the25-item classification and existing coverage ledger are private at
`/tmp/base-foundation-static-audit-20261112/`. This audit identifies coverage
work; it does not predeclare product failures in those untested flows.
