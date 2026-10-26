# Cohort source selector contract correction (2026-10-26)

The published Cohort source map correctly promotes the People detail and editor implementations before Settings. The old Templates round3 test still assumed the first three options were `cohort`, `cohort-people`, `cohort-settings`, and failed before its source-copy checks. The product source map must remain unchanged.

The actual leading order is:

1. `src/templates/business/cohort.tsx`
2. `src/templates/business/cohort-people.tsx`
3. `src/templates/business/cohort-person-detail.tsx`
4. `src/templates/business/cohort-person-editor-fields.tsx`
5. `src/templates/business/cohort-settings.tsx`

The first three are consequently Cohort, People, and person-detail. The corrected test asserts all five, keeps the original People source/display/clipboard/ZIP checks, and additionally selects detail, editor-fields and Settings, checking each selected filename, full visible source and clipboard bytes against the local implementation. A real project download then checks all four secondary implementations byte-for-byte and all five listed files exist. Flux, Pulse, Roster and Echo retain their original order, source, clipboard and ZIP assertions.

## Evidence and scope

On Root's immutable pre-CodeBlock production server `http://127.0.0.1:5462`, the original Cohort case independently failed at its original line26 with Settings expected versus person-detail received. The original failure and trace are retained, together with the Source owner's earlier original5 log/trace and hashes. An initial CLI grep anchored against the full title matched no tests; its log is retained separately and is not counted as a product test failure.

After the test-only correction, the original five cases passed once in14.4 seconds, with one worker, the original30-second timeout, no retries and no forced actions. The stronger Cohort case completed in3.7 seconds. The actual Cohort ZIP matches all five implementation files. Scoped oxfmt and oxlint passed. Both test executions use only a private derivative of the canonical test that redirects downloaded ZIP save paths into this receipt directory, protecting previous artifacts; assertions and user actions are unchanged.

There were no builds, cold TypeScript runs, product/SourceTarget changes, dependency changes, working-tree source writes or Git writes. This correction establishes source-export behavior on the old production UI; it does not validate the separate new CodeBlock UI or claim original-reference pixel fidelity. Root should publish this narrow test change and coordinate the Source owner's separate5333 validation using the canonical frozen version. Original free ReUI implementations, Bricklane media and MIT/OFL attribution are unchanged.
