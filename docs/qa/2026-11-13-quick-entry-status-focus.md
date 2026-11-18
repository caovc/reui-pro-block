# Quick Entry Status returns focus inside its native modal

`DIALOG-12-01` is fixed locally for Nova at 1440×1000 under both actual
foundations. Exact-SHA CI and deployment remain separate.

On candidate 5466, the first Base Status Escape closed the child popup but left
focus on the parent dialog DIV throughout the original 5s assertion. Planned
and the parent remained open, with no recorded app error. Radix Escape and
selection passed; Base selection did not run after `maxFailures: 1`. That first
failure is preserved.

The repair changes only the consumer of free ReUI Combobox 21 in
`workspace-final/free/status-picker.tsx`. Its connected trigger ref receives
focus during Escape/item-press closure, before the popup input unmounts. The
existing native `finalFocus`, modality, portal, options, value and search remain
intact. The installed Base restoration queue supports the mechanism hypothesis;
Quick Entry's exact focus-event ordering was not instrumented. No shared
primitive or other picker is claimed repaired.

| Verification on immutable candidate 5467                            | Result                                              |
| ------------------------------------------------------------------- | --------------------------------------------------- |
| Original four: Radix/Base × Escape/selection                        | 4/4 passed; native exit 2026-11-12 23:56:39.385924Z |
| Direct permanent shared-test adapter: Radix selection + Base Escape | 2/2 passed; native exit 2026-11-13 00:03:57.952175Z |

Both runs retain 30s cases, 5s expectations/actions/navigation, zero retries and
full tracing. Native clicks, Enter, Escape and Tab drive two close cycles per
case. The original four verify eight natural Status returns, 24 focused and
connected frame samples, Tab↔Assignee order and four final launcher returns.
The permanent subset verifies four returns, 12 samples and two launcher
returns. It verifies the extraction rather than expanding the product matrix.
No test calls `focus()` or forces an action; recorded app health is clean.

The saved offline audits record individual review of all 16 original-run and
eight permanent-run PNGs. All six successful full traces pass CRC and retain
their exact test source. Their available response bodies match artifacts; the
unembedded bodies are not claimed byte-compared. This report also rechecked
the receipts, results, archived hashes/CRC and the old/fixed Base screenshots.
Permanent-adapter guards passed 2,454 snapshot files, 1,430 artifacts, all 1,629
current runtime hashes with zero exceptions, 10 pinned inputs and 16 actual
HTTP resources before and after. Closure completed at 00:03:59.350451Z, before
later Drive edits.

The shared regression is `tests/quick-entry-status-focus.spec.ts`
(`9292eb53`); the Status consumer remains `82ed5884`. Structural extraction
checks retain the original bodies after the three documented import/expect/
error-message transforms. Regular Playwright used the production artifact
because the Browser plugin was unavailable.

Evidence remains in:

- `/tmp/quick-entry-status-focus-5466-native-20261112-attempt-01/final-handoff.md`
- `/tmp/quick-entry-status-focus-5467-native-20261112-attempt-01/final-handoff.md`
- `/tmp/quick-entry-status-focus-permanent-adapter2-5467-native-20261113-attempt-01/handoff.json`
- `/tmp/quick-entry-status-focus-permanent-proposal-20261112/equivalence.json`

Coverage is Nova desktop Status Escape/selection. Phone, other styles and
pickers, exports, Filebox and full accessibility remain outside this gate.
Actual free ReUI composition, Bricklane assets and MIT/OFL notices remain
intact; no duplicate component implementation was introduced.
