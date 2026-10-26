# d8 CI: delivery avatars and Cohort Sheet readiness

This is a test-only correction. Product source, official free REUI compositions, shared primitives, dependencies, media and exported code are unchanged. The original failures remain separate evidence; local passes do not establish that the full CI or Pages deployment succeeded.

## Original evidence

Run `40283302611` on `d8c63058993e7891b7bf2d3ae42e8387e234b232` ended with 1377 passing and six failing tests. This investigation owns only the two new failures below. Flow, Pricing and touch failures have other owners.

The diagnostic artifact `12632774578` was downloaded once to `/tmp/bricklane-ci-d8-original/artifact.zip`: 21,294,573 bytes, SHA-256 `61084f868da7bd02dd7196cab41c27baba391f6fbb4f7fa9184b4ac7caead254`. The exact size and SHA match the upload log. Unmodified contents are under `/tmp/bricklane-ci-d8-original/extracted`. The original complete log is retained separately; no partial download or EOF failure is presented as a complete artifact.

### Delivery crew

Trace `grid-grouping-studio-round-2b821-ains-each-engagement-s-crew/trace.zip`, SHA-256 `57c9d4e2c0e0105115e91c9d7df459249003c6e2f880d95782dddbc16f789c4a`:

- `vnqg@4547`, 579456.673–580001.533 ms: the baseline `innerHTML` contains three Radix avatar fallbacks, `SM`, `RH`, `EB`, and group count `+1`.
- After the native Client sorting action and both existing sorting assertions, `vnqg@4555`, 580246.245–580252.700 ms, contains three actual original `data:image/svg+xml` images and the same group count.
- The snapshot compares an asynchronous presentation placeholder with its loaded image. It does not demonstrate changed crew membership.

The test now waits for the actual three image elements, checks their exact `demoAvatar` sources in fixture-person order (Sora Min, Rina Holt, Evren Blake), awaits native image decoding, and checks `+1` before capturing the HTML baseline. Both existing exact HTML comparisons after sorting remain unchanged, as do all four-group and row-order assertions. No sorting or identity check was removed.

### Cohort editor

Trace `templates-cohort-people-de-7b045-across-edits-and-navigation/trace.zip`, SHA-256 `712dc868160d1c49d8268c4b08c8d246d0dec021b343059d9adb5984a6a0e233`:

- Edit person click `omyc@2721` ends at 909029.012 ms.
- `omyc@2723` at 909052.586–909112.690 ms waits only for the Sheet element to be attached before measuring it.
- The original exact width assertion receives `511.99993896484375` instead of `512`.

The native Sheet uses a 200 ms `enter` animation. The test now waits for visibility and the actual element's `getAnimations().finished` promises before retaining the original exact `toBe(512)` assertion. It does not round, increase a tolerance, change animation styles, disable motion, finish an animation prematurely, or change a timeout.

## Controlled native evidence

`/tmp/bricklane-ci-d8-two-readiness/controlled-native-evidence.json` records two deterministic boundaries against the unchanged production assets at `http://127.0.0.1:56500/`.

For delivery, a private browser harness gates only the original native Image preload source assignment used by Radix. While gated, the actual fallback initials are SM/RH/EB. Releasing the original SVG sources and awaiting their native decode makes the old fallback-vs-image comparison fail. Capturing the ready image state and sorting Crew preserves exact HTML. The harness uses an explicit release, not a timer, substituted picture or mock application state.

For Cohort, the harness pauses the actual existing CSS enter animation and samples its native timeline. At currentTime 1 ms of 200 ms, its native matrix has translateX 51.1973 and bounding width exactly `511.99993896484375`, reproducing the CI value. Resuming the same animation and awaiting its native finished promise returns transform `none` and exact width `512`. The harness does not cancel or force-finish the animation. Timeline samples remain in the evidence rather than being described as repeated test attempts.

The harness is private diagnostic evidence and is not included in product source or the release patch.

## Production validation and limits

A static local-import closure comparison confirms all 134 relevant product files are byte-identical between the clean d8 test candidate and the existing immutable afd-plus-Source5 production harness. The readiness changes affect only two specs.

One production run of both complete specs passes 16/16 in 21.3 seconds with one worker, the original standard 30-second per-test timeout, no retries, no skipped tests and no forced actions. Both original CI failures remain preserved. No install, application compilation, Vite build, new server, source collector modification, product change, shared working-tree write or Git write was performed.

This is synchronization evidence for the two failures. It is not a claim that the full six-failure CI run is fixed, or that visuals, the full suite or deployment have passed.
