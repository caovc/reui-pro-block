# Strata Services budget history

The accessible names on the public Services charts describe budget left per
three days over 90 days. The reference paints positive budget green and negative
budget red around a zero line. The previous Bricklane chart plotted daily
good-event percentages and omitted the negative budget cue.

The local chart derives 30 non-overlapping three-day periods from the local
event ledger. This period alignment is an implementation choice. The tooltip
reports raw remaining budget and its UTC dates, including values outside the
plotted ±100% range. A period without observations stays empty. The chart
reuses the existing free ReUI chart container, axes, area and tooltip.

The first replacement candidate produced three conspicuous dips in each of
the first three rows. Negative color covered roughly 12% of each line, and a
neighboring chart could paint over the tooltip. The revised model preserves
all 18 default SLO evaluations and all 270 tested policy/window evaluations.
The first three rows now show two, one and one contiguous red runs. They occupy
8.71%, 7.70% and 5.43% of the lines against approximately 4% each on the
reference. The local series uses independent fixture data. Checkout retains its
original ledger.

All 16 desktop foundation/style combinations and two responsive flows passed.
The Nova tooltip displayed its UTC range and budget on separate intact lines
above the adjacent charts. Review covered 68 screenshots and 18 traces. The
original candidate and its visual findings are retained separately.

The shipped fixture stores historical daily bad-event counts for three SLO IDs
directly. Compared with the verified candidate, all 2,862 ledger buckets,
including all 1,296 hourly buckets, and the 270 complete policy/window row
results are identical. All 19 domain tests passed on this representation.
