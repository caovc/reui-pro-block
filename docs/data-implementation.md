# Data, charts, AI, and solution implementations

Reference: public REUI category metadata and public `.md` briefs, snapshot 2026-10-22. Public metadata and rendered public previews were inspected; no Pro source, paid assets, or premium icons were retrieved. Components are independent React compositions of the installed shadcn primitives, Lucide icons, Recharts through shadcn Chart, and native SVG for bespoke geometry.

## Coverage

All 203 public entries in these four groups are routed through `src/blocks/data/index.tsx`:

| Group | Public entries | Implementation |
| --- | ---: | --- |
| Data Grid | 48 | Configured record grids, column sets, grouping, expansion, ordering, editing, and native scroll windowing |
| Charts | 52 | Area, bar, composed, line, pie, radial, Sankey, slope, sparklines, and segmented status histories |
| AI & Agents | 22 | Chat shells/panels, model comparison, activity consoles, token planning, spend maps and local hardware illustrations |
| Solutions | 81 | Domain dashboards, operations, CRM boards, workflows, settings, queues, bookings, files, inventory, identity, travel and digital twin demos |

The entry count measures reference-route coverage. It does not mean that 203 independent source files or 203 pixel-identical clones exist. Shared modules and layout families are deliberate; each public entry selects a family with its title, category, index and domain configuration.

## Working local behavior

- Grid: search across record fields; status filtering; ascending/descending column sorts; column visibility; row selection; add/edit/delete dialog; CSV export; pagination. Category-specific drag/reorder, grouped sections and expandable subtasks are enabled. The two virtualization entries have 1,200 records and native 520px scrolling; 16 visible/overscan rows plus spacer rows are mounted, with a current-range indicator.
- Charts: period and metric switches update sample data; prior-period toggle; accent selection; hover readouts; CSV export; status history selection; run/promote actions. Pie slices and legends can focus a segment.
- AI chat: prompt starters, keyboard submit, scoped-source/model menus, attachment chips, extended-thinking toggle, local response generation, copy/feedback, draft insertion/undo, comparison votes, local branch counter, panel open/close. Voice mode is explicitly a demo input visualization and does not record audio. Responses are deterministic sample replies, not API calls.
- Agent activity: pause/resume, raw/detailed views, approval/deny/revise states, access-grant and retry actions. Usage planner recomputes estimated cost from model/token/cache controls; local hardware demos expose node, power, context and enable states.
- CRM: draggable deal cards, stage changes, new-deal dialog, search, activity notes, detail inspector and import wizard with required fields and column mapping.
- Operations: cron job switches/run actions and editor sheet; draggable firewall rules and IPv4 test trace; deploy freeze/promote; provider connection states; routing/feature-policy controls; agent run retry, approval, memory pin/forget and trace inspector.
- Billing/identity: coupon duplicate-code validation and copying, pause/activate; invitation queues with multi-email validation, resend/revoke and bulk actions; access approvals and rejection reasons; failed-payment retry/history; subscription state changes; role-permission matrix; plan selections, usage meters and member-session signout.
- Business: booking creation/check-in/no-show, date/view switches, drag reservations; file grid/list, local file metadata upload, search, starred folders, move/trash/restore, details and sharing demo; order quantities and totals, shipment status/tracking copy; reorderable travel stops and per-person/group totals.
- Digital twins: SVG stadium with sector selection, rotation, seat availability/selection and quantity/total; a race timing simulation with pause/resume, driver following, standings and CSV export. No payment or real ticket reservations occur.

## Fidelity limits

These are independent reference-inspired compositions. They preserve the broad category and interaction intent, but are not a one-to-one reproduction of every original block:

- Records, values, avatars and chart data are synthetic. Repeated entries reuse domain layouts, not the original REUI per-block data models and specialized column sets.
- Some reference controls are simplified. Grid grouping is single-level; cash-flow expansion uses a generic related-task panel; dashboards reuse metrics/chart/table compositions. Settings tabs share the underlying form rather than implementing every reference subpage. The CSV wizard validates a sample schema; it does not parse arbitrary uploaded CSV into production records.
- Unrefined plot families still approximate bespoke 3D prism bars, lollipop/pill microplots, drag-to-select ranges and original live feeds with standard Recharts variants. The dedicated area, pie, radial, slope and Sankey refinements below use independently authored geometry informed by public previews; their remaining differences are recorded per entry.
- Branching chat is a local version counter rather than a persistent tree; voice does not capture audio; citations/sources are synthetic labels; connected apps do not authenticate to external services. Some assistant layout modes share the docked-panel family.
- Digital twins use editable vector perspectives instead of a WebGL stadium/circuit. The race is a visual simulation and marker motion approximates a lap rather than exact physical track geometry.
- No backend, payment processor, identity provider or external messaging service is called. Share/invite/publish controls demonstrate local state and do not send external messages. Local preview state resets on remount.

## Validation

- `npx tsc -b --pretty false`: passes after integration.
- `npx oxlint src/blocks/data`: passes with no warnings.
- Browser check at 1100×800: virtual-grid DOM remains bounded (17 rows before scrolling, 18 including spacer rows after scrolling to row 98); range updates to `Rows 98–113 of 1,200`.
- Browser smoke checks for the stadium, live race, file explorer, coupon manager, room board and retention cohort chart: no page errors and no preview error boundary.
- Parent integration owns the full catalog route sweep, website controls, desktop/mobile review, production build and Pages checks.

## Area chart fidelity follow-up

All four area-chart entries now have dedicated, independently authored implementations based on rendered public REUI previews, inspected in Edge after the in-app browser was unavailable. No premium source was fetched.

| Reference | Dedicated file / layout | Verified behavior | Remaining differences |
| --- | --- | --- | --- |
| Generation Mix (`chart-16`) | `generation-mix.tsx`; centered 900px frame, six colored SVG ridgelines in depth, hourly axes and source chips | 3D/2D, source presets/toggles, grid/floor/peak layers, three comparison baselines, hover/arrow-key readout, refresh, CSV/JSON, summary copy, expanded dialog | Curve data is independent; peak output/hour differs slightly. SVG perspective approximates the reference projection; source interpolation is custom. |
| Campaign Impressions (`chart-17`) | `area-panels.tsx`; 1024px frame, four metric cells, dashed point-marked current/prior areas | Period selection, four channel filters, current/prior toggles, channel-mix tooltip, accent selection, CSV and summary copy | Sample channel totals and prior windows are independently generated rather than the reference dataset. |
| Orders Overview (`chart-18`) | `area-panels.tsx`; 768px frame, revenue-default metric tabs, blue/purple/pink curve, hatched fill, pinned prior-period readout | Metric and period switching, display layers, hover point, refresh, CSV, summary and expanded dialog | Hatch is a uniform lilac stroke rather than a per-column color gradient; data and tooltip positioning differ slightly. |
| Inbound Leads (`chart-52`) | `area-panels.tsx`; 900px card, month/quarter data, current/prior areas and fitted trend | Quarter aggregation, linear regression / three-point average / no trend, previous-series/grid/point layers, keyboard readout, accent, refresh, CSV, copy and expanded dialog | Decorative plot particles from the reference are omitted; sample year data follows the publicly visible table values. |

Visual inspection compared each dedicated local rendering with its public isolated reference preview. TypeScript and scoped lint checks pass. These four entries are no longer mapped to the generic area chart renderer.


## Pie, radial, slope and Sankey fidelity follow-up

Each of these 11 public isolated previews was individually opened in Edge and inspected through rendered pixels and visible DOM on 2026-10-22. The local implementation was then rendered and compared at 1200×850. The chart groups now dispatch to dedicated entry components before the generic chart renderer. Native SVG implements the bespoke geometry; controls and framing use shadcn. No original source or paid assets were retrieved.

| Entry and public visual evidence | Implemented correction and behavior | Remaining differences |
| --- | --- | --- |
| [Capital Inflows, chart-13](https://reui.io/preview/radix/chart-13): compact 576px frame; purple top-three donut with hatched remainder, $12.4M metric and source rows | `pie-charts.tsx`: independent compact composition, segmented rounded donut, 85% center, source hover readout, Week/Month/Year values, CSV and copy | Period values are synthetic; exact arc gaps, typography and header/footer spacing differ slightly. |
| [Browser Usage, chart-27](https://reui.io/preview/radix/chart-27): 900px hatched six-color donut beside visitors/share/change table, version drilldown | `pie-charts.tsx`: icon header, 7D/30D/90D, comparison layer, support-line/hatch display options, six browser rows, version selection and back navigation | Chrome version proportions match the visible reference; other version numbers and proportions are independent demo data. Comparison uses a dotted prior ring rather than original historical slice data. |
| [Cloud Spend, chart-54](https://reui.io/preview/radix/chart-54): 900px budget rose; wedge width is budget, radial extent is use, red overspend arcs, spend/category panel | `pie-charts.tsx`: variable-angle and variable-radius rose, budget threshold ring, over/at-risk states, period selection, sorting, category-specific service drilldown and back | Geometry and gradient placement are approximations; service cost splits use independent sample ratios. No billing API is connected. |
| [Error Budgets, chart-7](https://reui.io/preview/radix/chart-7): 1024px four concentric partial rings beside an objective table | `radial-charts.tsx`: Availability/Latency/Error/Freshness rings, target/attained/budget/burn/status columns, service selector, rolling periods, display layers and export | Service/window projections are synthetic; ring dash texture and radius spacing approximate the reference. |
| [API Health, chart-8](https://reui.io/preview/radix/chart-8): four horizontally arranged metric tiles with small tick rings and limits | `radial-charts.tsx`: Availability/Latency/Error/Throughput tiles, segmented mini-rings, latest/peak/over-SLO details, region/period switch and refresh | Regional/time-window telemetry and refresh progression are independent. Tick geometry is authored SVG rather than the original renderer. |
| [Cash Inflows, chart-12](https://reui.io/preview/radix/chart-12): 31-day radial clock, future spokes, target-progress arc/pace bead; forecast metrics and four source rows | `radial-charts.tsx`: stacked daily spokes, source focusing, settled/in-transit/pace/prior layers, period, refresh, hover and keyboard day readout, CSV | Daily history is independently generated; prior-month ghost bars, bead timing and source projections approximate the visible reference. Selected-source totals work locally. |
| [Error Budget Runway, chart-50](https://reui.io/preview/radix/chart-50): 14 services ranked from traffic to runway, critical/watch/healthy curves, four headline metrics | `slope-charts.tsx`: traffic-weighted cubic curves, mathematical marker positions, current/baseline ranks, live/pause option, service selection, status details and export | Simulated live telemetry updates every eight seconds; marker motion and some aggregate values are approximations. Public service names and first-view runway values are retained. |
| [Retention Crossover, chart-51](https://reui.io/preview/radix/chart-51): 11 acquisition channels from signup order to kept-rate order; day slider/play, rank movement | `slope-charts.tsx`: weighted neutral-to-green/red curves, left/right small bars, calculated curve-intersection rings on hover, day-driven reranking, play/pause and insight footer | Public Day 30 values are retained; other days follow independent retention curves. Playback speed, crossing animation and precise stroke widths differ. |
| [Revenue Flow, chart-48](https://reui.io/preview/radix/chart-48): five-column financial Sankey with neutral revenue, green income, red costs and four summary metrics | `sankey-charts.tsx`: independently positioned flow ribbons, quarter selection, Revenue/Costs/Profit focus, keyboard/click lineage tracing, amount/share layers and CSV | Native SVG positions replace the original layout engine; non-default quarters scale sample values and can differ by rounding. Ribbon shading, node spacing and label placement differ slightly. |
| [Trial Journey, chart-49](https://reui.io/preview/radix/chart-49): four channels into signup/onboarding/invite/upgrade stages; named red drop branches and volume pulses | `sankey-charts.tsx`: separate journey topology, stage totals, incoming-source volumes, green conversion/red drop branches, volume-based SVG motion, pause/resume/replay and periods | Pulse phases and density approximate the reference. Alternative periods are synthetic. Initial motion honors reduced-motion preference; pausing shows static pulse positions. |
| [Pipeline Leakage, chart-53](https://reui.io/preview/radix/chart-53): 768px frame, three green narrowing source ribbons across six stages, loss percentages and scattered red drops | `sankey-charts.tsx`: six distinct stage totals, biggest-leak metric, weighted source ribbons, source filtering, loss readout, display layers, periods and CSV | Lost-deal particles are static decorative points, rather than continuously animated drops. Alternative periods scale independent sample values. |

### Follow-up verification

- All 11 routes render at 1200×850 and 390×850 without page errors, preview boundaries or document-level horizontal overflow. Wide slope/Sankey plots retain internal horizontal scrolling on narrow screens.
- Targeted browser checks passed: Capital period updates; Browser version drilldown/back; Cloud service drilldown/back; Error Budget service switching; API region/refresh; Cash clock arrow-key readout; Runway baseline switching; Retention named-slider keyboard operation and play/pause; Revenue quarter/focus/node trace; Trial pause/replay/period; Pipeline source filter and real CSV download.
- `src/components/ui/slider.tsx` now forwards `aria-label` and `aria-labelledby` to its actual slider thumb. This small shared accessibility correction was authorized by the parent agent; the Retention slider exposes its name and updates `aria-valuenow` from 30 to 29 with ArrowLeft.
- Scoped TypeScript diagnostics and oxlint are clean for the six new chart files. Full-repository TypeScript during the parallel pass reported unrelated work-in-progress application/grid diagnostics; parent integration owns the final combined build.
- Visual checks compare public and local rendered structures. This ledger records the remaining differences and does not claim a pixel-identical or original-data reproduction.


### Persistent interaction regression suite

`tests/chart-refinement.spec.ts` contains 12 Playwright tests: one meaningful interaction case for each of the 11 entries above, plus a 390px viewport sweep across all 11 routes. The suite covers Browser/Cloud drilldown and back navigation, period/service/region data changes, clock arrow keys and Escape, runway baseline/keyboard selection, Retention slider naming/keyboard/play/pause, Sankey quarter/focus/lineage, Trial pulse pause/replay, and a real Pipeline CSV download with content/count assertions. Each test captures page errors.

Validated against the current dev server with `npx playwright test tests/chart-refinement.spec.ts --workers=1 --output=/tmp/reui-chart-persistent-tests`: **12 passed in 14.0 seconds**. An initial three-worker attempt encountered shared dev-server navigation timeouts during parallel integration; the complete single-worker rerun passed without retries or chart implementation changes. `npx oxlint tests/chart-refinement.spec.ts` also passes. Browser plugin was unavailable; the existing repository Playwright workflow was used.

The same persistent suite also passes against the parent’s isolated production snapshot: `PREVIEW_URL=http://127.0.0.1:4185 npx playwright test tests/chart-refinement.spec.ts --workers=2 --output=/tmp/reui-chart-prod-persistent` — **12 passed in 5.9 seconds**, without retries or implementation changes.
