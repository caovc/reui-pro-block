# Cohort weekday containment

The phone Working week group could clip Sunday inside its FramePanel. The
consumer now limits the existing group to its available width and lets its
actual items wrap. This six-line CSS change preserves all seven controls,
their existing ReUI composition, foundation primitives, spacing, local state
and keyboard behavior. No artwork, backend or shared primitive changes.

## Actual red and green evidence

The original true-Base desktop/phone behavior tests passed before review, but
did not check full weekday bounds. A newly captured Base/Nova old5422 case
failed its full-containment assertion: Sunday's right edge380.1875px exceeded
the clipping boundary372px by8.1875px. All seven centers still hit correctly,
showing why the new full-box assertion matters. Two images were inspected;
the original failed trace remains unchanged.

Independent5460 then passed all16 first-run phone cases: two real foundations
and Nova, Vega, Maia, Lyra, Mira, Luma, Sera and Rhea. Tests retain30s cases,
5s assertions/actions, zero retries, one worker and full tracing. They check
all seven bounds and center clicks, actual selected-state changes, keyboard
focus and Discard, plus real preset stylesheets and computed item styles.
The original two complete Base desktop/phone flows also passed separately.

All36 PNGs were individually inspected and all18 complete traces audited.
All2082 recorded GETs returned200. The238 available embedded response bodies,
including54 actual font responses, match the frozen artifact; the other1844
JavaScript responses lack embedded bodies and are not claimed byte-compared.
Runtime/error records are empty. Full source/public/config1636 and artifact1391
file inventories, harness and HTTP checks remained unchanged.

Scoped TypeScript passed in9.334s and both production builds passed in9.566s
and9.709s. Candidate5460 contains the independent Settings work described in
the execution record; its Cohort runtime closure matches this milestone.
Uncommitted Source performance work is excluded from this candidate and commit.

Evidence:

- `/tmp/cohort-working-week-v2-old5422-base-nova-red-20261112-or1tgmsa/handoff.md`
- `/tmp/cohort-working-week-v2-5460-first-native-20261112-l5r4j3yv/handoff.md`

## Permanent coverage and limits

Two permanent test files retain the entire validated sixteen-case body and
helper byte for byte after reversing only the documented configuration/import
headers. They explicitly retain the original budgets and full tracing while
following normal repository sharding. Format, lint, inverse comparison and
discovery of16 cases and the Nova/Sera4 subset passed. The extracted Nova/Sera
four-case adapter also passed its first run; all eight images were inspected,
four complete traces and source/artifact/HTTP/font guards passed. This verifies
the extraction without claiming another sixteen native runs or new distinct
functional coverage.
Extraction evidence:
`/tmp/cohort-working-week-permanent16-v2-extraction-20261112/handoff.md` and
`/tmp/cohort-permanent-v2-5460-four-first-native-20261112-zgj9z97o/`.

`COHORT-SET-02` remains open: both Sera foundations visibly crowd the Working
week footer status under its action buttons. The original images and DOM text
are preserved; footer geometry needs separate measurement. This does not close
all Cohort settings or all template/style combinations. Official precise
weekday wrapping was unavailable, so this is a verified local accessibility
repair, not a claim of complete reference pixel equivalence.
