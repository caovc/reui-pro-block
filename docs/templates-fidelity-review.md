# Templates reference review — 2026-10-23

The first implementation covered the routes and basic controls but did not reproduce the public previews closely enough. This pass compares the 18 public ReUI previews at 1440 × 1000 with local pages, then checks meaningful alternate states and a 390 × 844 viewport. Visual review and functional tests are separate: passing browser tests does not establish pixel identity.

## Corrected differences

| Template  | Main corrections                                                                                           | Interaction checked                                                              |
| --------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Mesh      | Five-column launch board, colored status icons, action queue, launch runway details                        | Board, task creation/editing/drag, share popover, canvas                         |
| Flowly    | Reference dashboard spacing, patterned activity bars and header legend, workflow sheet                     | Create workflow, select trigger, return to saved list                            |
| Echo      | Full-height viewport, correct font and content position, compact Projects list                             | Create and rename project, collapse sidebar                                      |
| Verve     | CRM frame, performance card, quota meter, table frame and Create menu                                      | Schedule meeting, deal creation and Kanban                                       |
| Limelight | Archivo typography, hero proportions, pill buttons, three-column feature section and expanded testimonials | CTA scroll, pricing switch, hash preservation                                    |
| Manifest  | 418 × 662 login card, official Alert, product editor as a full page                                        | Create product and variants, retain inventory, upload image                      |
| Lucent    | Service marks, deployment ledger, runbook/traffic panels                                                   | Edit deployment, reopen saved release, rollback                                  |
| Overture  | Geist typography and locally authored wallpaper illustrations                                              | Email validation and local waitlist confirmation                                 |
| Atlas     | Users submenu, official user grid, chart legends, cluster bars and badges                                  | Invite a person with an assigned role                                            |
| Tempo     | Dedicated 24-task, five-column board and official calendar                                                 | Board, create/edit task, calendar view/event                                     |
| Miro      | Nine-field booking sheet, hierarchical heatmap, appointment calendar                                       | Save booking, find it in week and agenda views                                   |
| Cohort    | 440 × 679 login card, calendar, workforce panels and approval flow                                         | Event detail and individual approval decision                                    |
| Filespace | Reference file grid, nine-action menu, sharing/details/move/version panels                                 | Per-file permissions, saved description, move target and version restore persist |
| Roster    | Official calendar, spanning events, review panels and gray headcount curve                                 | Calendar view switch and event details                                           |
| Pulse     | Layered KPI frames, queue cards, escalation grid and right-side sheets                                     | Edit a ticket, save and reopen; board drag                                       |
| Surge     | Patterned inventory bars, metric dividers, table borders                                                   | Full-page product creation and variant inventory                                 |
| Filebox   | Auth/reset pages and suggested folders after sign-in                                                       | Reset navigation, sign-in and drive operations                                   |
| Flux      | Official expandable run grid and approval review sheet                                                     | Approve selected request without changing another                                |

## Actual free-component reuse

- Official ReUI **Frame** / **FramePanel**, **IconTile**, **Badge**, and **Alert** provide the card and status primitives.
- Official **DataGrid** and its header, visibility, pagination, selection, and expansion components replace handwritten tables where applicable.
- Official **Kanban** supplies drag-and-drop boards for Mesh, Tempo, Verve and Pulse.
- Official **EventCalendar**, its nav, content, month/week/agenda views and event handling provide the calendars for Tempo, Miro, Cohort and Roster.
- Official **useFileUpload** handles file selection and media management in drive/product flows. Official **Scrollspy** drives Limelight section navigation without replacing the host hash route.
- Registry URLs, hashes and compatibility adjustments are recorded in [templates-free-component-provenance.md](templates-free-component-provenance.md). The upstream MIT notice is included in source downloads.

Application-specific shells, reference data, product forms and CRM flows combine free primitives and existing project blocks. No premium application source was obtained. Bricklane uses its original brand mark and locally authored avatar, integration and wallpaper illustrations; third-party fonts and licensed assets retain their notices.

## Verified release candidate

On 2026-10-23, the fixed candidate based on `a3e8693` (rechecked after the commerce/chart integration) passed the full TypeScript/Vite production build and 45 browser checks (23 template checks, 18 interaction checks, four existing site checks). The three family source exports also passed independent TypeScript/Vite builds. All 18 final desktop screenshots were captured from this production build. This validation is separate from subsequent GitHub deployment status.

## Reproducible checks

- `tests/templates.spec.ts`: 18 desktop/mobile routes, actual font families, catalog filtering/navigation, clean-preview height, source ZIP contents, unknown-route recovery and theme propagation (23 tests).
- `tests/template-interactions.spec.ts`: one meaningful flow for each of the 18 templates, including write/reopen assertions rather than click-only checks (18 tests).
- Source ZIPs for Echo, Surge and Roster exercise each family independently and are built with TypeScript and Vite.
- A release snapshot is built from the committed base plus only this template milestone so unrelated in-progress edits cannot produce misleading results.

Local reference, before and after screenshots are in `/tmp/reui-template-refinement/`; family interaction evidence is in `/tmp/reui-business-audit/`, `/tmp/workflow-audit/` and `/tmp/reui-collab-audit/`. These temporary evidence directories are not published assets.

## Scope and remaining limits

This is a substantially corrected independent recreation, not a claim of pixel-perfect or complete production equivalence. Some secondary pages and dialogs remain simplified local demonstrations. Small icon, chart-curve, avatar and canvas-position differences remain. CRUD state is session-local unless explicitly stored; authentication, AI generation, email delivery, payments and integrations require real services. Original brand marks and media are intentional visual differences from the reference.

### Specific follow-up differences

The remaining differences below were observed during reference comparison; they are not covered by a claim of full visual equivalence.

- Flowly: at a 1440px viewport the workflow-name column begins around x349, versus x393 in the reference. Chart samples and geometry also differ.
- Mesh: canvas handwriting and connector strokes differ; the adapted editor counts connector segments separately (33 objects versus 29 in the reference). Runway routing and percentage placement still need refinement.
- Echo: project rows are approximately 70px versus 65px; the composer does not yet include the reference's extra-tool menu. Artifact generation and scheduling are local placeholders.
- Lucent: traffic-ring dimensions, chart amplitudes and lower pipeline/feature-flag details remain approximate.
- Tempo: some sidebar icons, row spacing and badges differ; calendar colors use three local categories and do not implement the reference's full recurrence behavior.
- Flux: chart peaks/axes and approval-detail badges differ; several secondary destinations remain simplified.
- Business and collaboration families: some secondary routes and datasets remain abbreviated, and chart curves, avatar loading and small icon choices still differ. Roster's full organization tree and Pulse's secondary datasets need further comparison.

## Second reference pass: component reuse and secondary pages

The second pass opens the live public previews again and follows navigation, filtering, creation and edit states. Screenshots and interaction evidence are kept outside the repository under `/tmp/bricklane-templates-round2/`. Desktop comparisons use 1440 × 1000; narrow checks use 390 × 844. Reference images are audit evidence and are not application assets or download contents.

### Business foundation milestone

- Replaced the custom navigation expansion and child-navigation renderer with the actual free `SidebarNavigation` composition from `src/components/reui/sidebar.tsx` (c-sidebar-3).
- Replaced the custom SVG sparkline with the existing Pro Block's `MiniTrend` implementation from `src/blocks/data/sparkline-primitives.tsx`; replaced duplicate chart stripe definitions with `ReuiStripePattern` (free c-chart-3).
- Removed the twelve stock photos previously selected from the original Surge preview. Eight product illustrations and three store illustrations are locally authored SVGs, with their provenance recorded in `business/assets/LICENSE.md`.
- Corrected remaining business wordmarks to Bricklane. The brand and illustration differences are intentional; card geometry, spacing and behavior continue to be compared with the reference.
- Expanded template ZIP collection to include transitive component, library and data modules used by existing Pro Blocks. Source selection is maintained in `templateImplementationTargets` alongside the block source mappings.

The fixed business foundation candidate passed its production build and 41 existing template/browser interaction checks. The six business screens also passed twelve desktop/narrow viewport checks without page errors or document overflow. These checks verify this milestone; the secondary-page findings below are being addressed separately.

### Findings from actual navigation

- Verve: Quick Stats, Attainment and Quota Plan previously shared the generic activity feed.
- Atlas: several Users submenu entries previously did not navigate to their own pages.
- Flowly: the workflow editor used a static horizontal step mockup; Agents and Runs shared one list.
- Echo: Scheduled and Artifacts used generic cards instead of their distinct reference layouts.
- Pulse: Contacts and Team used abbreviated generic records rather than the reference's distinct schemas and pagination.
- Roster: Hiring repeated people in four columns; the reference has five candidate stages. The organization tree also needs independent node expansion.

These findings are not marked resolved until their corresponding page and interaction milestone is verified.
