# Data, charts, AI, and solution implementations

Reference: public REUI category metadata and public `.md` briefs, snapshot 2026-10-22. Only public metadata was inspected; no Pro source, paid assets, or premium icons were retrieved. Components are independent React compositions of the installed shadcn primitives, Lucide icons, and Recharts through shadcn Chart.

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
- Plot families are implemented, but bespoke 3D prism bars and lollipop/pill microplots, animated Sankey pulses, drag-to-select chart ranges and every original live feed are approximated by standard Recharts variants and controls. No claim of matching the original chart geometry is made.
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
