# Lucent infrastructure fidelity review — 26 October 2026

This milestone replaces the Infrastructure deployment-list fallback with Clusters, Hosts and Registry. It is an independent Bricklane reproduction of the public ReUI template. Original branding, portraits and proprietary artwork are not distributed.

## Reference and evidence

Fresh Chromium exploration waited for network idle and hydration at:

- https://lucent-devops.reui.io/infrastructure/clusters
- https://lucent-devops.reui.io/infrastructure/hosts
- https://lucent-devops.reui.io/infrastructure/registry

The browser visits included all four Registry pages, expanded tag groups, row menus, details and edit sheets, new-cluster provisioning, host enrolment and queue/display settings. Original screenshots and DOM measurements remain private QA under `/tmp/bricklane-templates-round3/oct26-reference/` and `infra-measure.json`; they are not application assets.

## Actual reuse and corrected implementations

- Existing `DomainRecordGrid`, `useDomainGrid` and `DomainGridSurface` Pro Blocks supply the official free ReUI DataGrid, expansion, stable row IDs, sorting, column visibility, resizing, movement and pagination. There is no second table engine. The template uses the installed free Frame around all three workspaces.
- The existing `FilterBar` adapter supplies actual official free Filters conditions, values and keyboard behavior for Hosts and Registry. Existing `TabsBar` supplies the line-tab composition and live record counts.
- Cluster provisioning directly reuses `SyncScopeOptions`, the existing controlled adaptation of official free `c-radio-group-3`, for Balanced and Compute-optimised node pools. Existing `DateChoice` uses the actual free CalendarSelect for upgrade dates and host patch windows. Existing `NumericField` uses the actual free NumberField for repository retention.
- Existing `Identity` replaces the separate host name/avatar/email stack. It uses local original avatars and keeps long email text inside its own column. Rating is the existing official free ReUI component. Existing project Sheet, Select, Checkbox, Switch, Badge, Popover and DropdownMenu plumbing supplies surrounding controls.
- Twenty observed clusters are grouped into four regions. Capacity totals are derived: 6,056 vCPU fleet and 976 vCPU at risk. New pool capacity, moving a cluster between regions, deleting a cluster and changing its next-upgrade date update the actual records. Growth summaries retain the observed reporting-period fixtures rather than claiming to recalculate an undocumented metric.
- Fourteen hosts have independent monitoring, selection, filtering and pagination. Enrolment follows the selected cluster, role and agent version; its command can be copied. Editing retains host delivery/operations policies, and decommission removes the selected host. The copied command and resulting entry are local demo behavior; this frontend does not enrol a remote machine.
- Registry uses the sixteen observed repositories and the three observed tag groups. Five-row pagination counts repositories instead of expanded tags. Severity ordering keeps the original tag order. Completion, scan policy, immutable tags, retention, creation, editing, copying paths and deletion update the selected item. A repository name remains fixed when editing. Include-completed filters tags as well as parent repositories.
- Display testing caught and corrected a real column-visibility bug: custom column headers use stable column IDs, so the Clusters visibility state must use those IDs too. A browser assertion verifies that hiding Growth actually removes its column.

## Geometry and verification

At 1440px the measured reference cluster column widths are approximately 260/206/130/163/130/200/61px. The implementation uses those proportions, right-aligned capacity/growth/date cells, 40px headers, 44px region rows and 49px cluster rows. Host rows are 50px; Registry rows are 45px. Header, tabs and toolbar spacing were compared using actual rendered screenshots. Forms were also opened at 390px after their entry transitions settled.

The independent production candidate passes strict TypeScript/Vite, scoped oxfmt and oxlint. Sixteen browser cases cover capacity changes, regional expansion, visibility, calendar updates, selected-record operations, cross-Overview state retention, enrolment clipboard content, registry queue/display behavior, mobile navigation/sheets, and exact code-preview/copy/download bytes. Each independent test run uses its own output directory to prevent concurrent chats deleting trace artifacts.

A second independent browser review found two mobile defects and verified their fixes: host edit dates now each have approximately 146px of usable width instead of clipping in a narrow right column; Registry Settings uses Radix's actual available height, and its Last pulled switch can be reached and toggled. The new assertions operate on those controls rather than checking only document width. Newly provisioned clusters retain stable UUID record IDs while displaying short regional codes, so the identity badge does not wrap.

The actual Lucent project ZIP contains 195 entries. All 184 applicable saved source/font/notice files match the independent candidate byte-for-byte, including all six changed runtime/style files; generated entry files are validated separately. The archive contains the ReUI MIT notice, font OFL notice and the existing global-theme/applyTheme modules. Its independent strict TypeScript/Vite build passes. Six standalone states (Clusters, Hosts and Registry at 1440px and 390px) create a 256-vCPU E8 pool, preserve an independent monitoring change across Overview, and create a repository with retention of 17 tags. All six have no console errors, page errors or document overflow. Final ZIP SHA-256: `8883e3382f11058483036ed8b95aaf66b58999960219acacecbf541b73ea3266`. These checks do not claim that a Git push or Pages deployment has completed; publication is handled by the repository's release coordinator.

## Remaining differences

- Family sidebar, top-bar breadcrumbs, the Filters trigger position and some icon details still differ from the reference. Bricklane branding and original avatar substitutions are intentional.
- Detail sheets expose the modeled identity, capacity and policy fields. Reference host load/OS/uptime metrics and Registry size/pull-drift/timeline aggregates are not yet modeled. Optional unavailable telemetry is shown as unavailable rather than invented. Queue fixtures and local changes are not connected to a backend.
- The table setting called Completed by recency uses timestamps created by local completion actions; existing completed fixtures have no fabricated historical timestamp.
- Changes are retained across template navigation in memory. Refresh persistence, remote provisioning, registry scanning and production integrations are outside this frontend milestone.
- This is a verified infrastructure increment, not a claim of complete template or pixel equivalence. Other recorded Lucent overview, chart and secondary-page differences remain open.
