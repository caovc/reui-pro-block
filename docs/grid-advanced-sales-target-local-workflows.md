# Sales to Target local workflows

`data-grid-advanced-21` opens an original Bricklane store planning workspace.
Its public functional reference is [Sales to Target](https://reui.io/blocks/data-grid/advanced/data-grid-advanced-21).
No paid component source, product logos, screenshots or media are included.

The twelve authored stores have eighteen complete monthly records from July
2025 through December 2026. The report selector covers January–December 2026;
the prior-year records support the Last 3 Months window across January.
Month, Last 3 Months and Year to Date each show actual, target, variance and
weighted actual/target attainment. A zero target shows “No target”. All stored
amounts are integer cents; charts and CSV use the same facts.

Search, the region quick filter and the actual ReUI Filters query intersect.
Native nested AND/OR queries, negation and the four offered equality operators
are evaluated against store region, format and selected-month pace. Unfinished
rules leave the data unchanged. Region and grand totals include only matching
stores, regardless of expansion. CSV exports three periods per matching store.

The grid uses the actual free ReUI DataGrid table, tree expansion, grouped
headers, sorting, first-column pinning, grand-total row pinning, column visibility
and scroll area. The total is pinned in the native table state; scoped consumer
CSS also keeps its cells below the measured header while scrolling vertically.
ReUI Frame, Badge, Alert and NumberField are composed with the repository's
licensed ChartContainer/Recharts and foundation-specific Sheet, Select, Input,
Button and menu implementations. Component MIT and font OFL notices remain in
the original dependency sources and downloaded project closure.

Open a store by its name or its native row menu. The sheet edits actual/target
for any known month and the store name, manager, region and format. Saving
updates the store, containing region, grand totals and month strips. Modal Undo
stays inside the native sheet. Add Store starts all eighteen months at zero;
validation rejects blank identity fields, duplicate names and invalid amounts.
Undo restores the immediately preceding whole sales plan, so later saves replace
that one Undo slot. This local demo has no server or cross-session persistence.

Custom domain code supplies the original fixtures, period arithmetic, native
query evaluator, row projection, capped attainment heat fill, editor state and
CSV serialization. It does not replace the existing free grid/filter/chart
implementations.

Validation gates are separate: pure model/adapter tests, strict leaf TypeScript,
scoped format/lint, a full dual build, both true-library core suites, exact
source-view/clipboard/file chains and original project archives, then ordinary
fresh installs/builds and actual standalone browser smokes.
