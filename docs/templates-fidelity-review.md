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

### Workflow and helpdesk milestone

- Flowly's Workflow and Agent Builder now directly reuse the existing `FlowCanvas` Pro Block instead of the static horizontal step mockup. Agents has its own twelve-record grid, state tabs and creation sheet.
- Echo Scheduled has five distinct tasks, enable/disable controls, filters, edit/delete actions, four task suggestions and a complete scheduling sheet.
- Lucent Security and Integrations have separate policy controls, a nine-card integration grid and a webhook form. Connection and policy changes remain independent.
- Pulse Contacts and Team directly reuse the existing `DomainRecordGrid` Pro Block and actual free DataGrid sorting, selection and pagination. Contacts has eleven records and its account/owner/lifecycle schema; Team has fifteen members and its role/status schema. Creation, editing and member activation update the selected record.
- Actual downloaded Flowly and Pulse starter ZIPs contain 113 and 87 files respectively and each passes an independent TypeScript/Vite build. The dependency-closure browser tests use the real downloaded ZIPs and TypeScript's parser to check local imports.

The fixed combined candidate passes its production build. Of 49 browser cases, the first run passed 48 and identified a missing accessible heading after Flowly creation. The title was corrected without changing its appearance; the failed case and three related workflow cases then passed. The existing flow assertion was retained.

### Domain pages and document reuse milestone

Atlas now has separate Roles, Access and Audit pages; Verve has distinct Quick Stats, Attainment and Quota Plan pages; Cohort Hiring uses five actual Kanban stages. Miro has separate patient, doctor-visit and payment views. Roster uses real hierarchical DataGrid expansion and candidate-specific Kanban stages. Drive uses the free Tree and derives inherited access from the parent folder.

Flux Flags has its own registry; Tempo Analytics uses ReuiDonut and a cohort grid. Echo Artifacts preserves the conversation while changing its sidebar. Mesh Documents directly reuses the repository's existing RichEditorBlock with original replacement content and two optional input props. The shared undo/redo fix refreshes the outline; default standalone behavior has a compatibility test.

The fixed combined candidate passed 67 browser cases and a strict production build. Actual Echo (126 files), Roster (102 files) and Miro (119 files) source ZIPs each passed an independent TypeScript/Vite build. Eighteen desktop dark-theme states rendered without page errors or document overflow. Product/marketing corrections and cross-navigation state checks form later milestones.

#### Free-editor lookup and specific gap

Checked on 2026-10-23:

- The [official free component index](https://reui.io/components) lists Code Block, Color Picker, Frame, Button Group and Textarea among its families. No complete document-editor family was found in that index.
- [Free c-color-picker-10](https://reui.io/components/color-picker/c-color-picker-10) supplies color/highlight toolbar controls for a static paragraph. Its agent notes require connecting those values to an editor's commands, and direct complete writing surfaces to Rich Text Editor blocks.
- The [official Rich Text Editor block page](https://reui.io/blocks/application/rich-text-editor) identifies its document/wiki editors as Pro or Ultimate blocks on Tiptap. This is reference material, not free registry source used here.

This milestone consequently reuses the repository's independently implemented Pro Block. It does not claim an official free editor implementation. The retained custom contentEditable engine supplies document editing, undo/redo and outline behavior that the checked free examples do not supply. Its toolbar layout still differs from Mesh's minimal document interface. This reuse does not establish Tiptap or original Pro source equivalence; available free primitives remain preferred for surrounding layout, status, grids and navigation.

### Final round-two release verification

The final candidate based on 13ddf79 passes the strict production build and all 77 template browser cases. Tests include page identity and font checks, desktop/mobile document width, forbidden original-media requests, creation/editing, independent record actions, cross-Dashboard state retention, real ZIP dependency closure and original editor compatibility. Final Flowly (127 files), Surge (118 files) and Filespace (109 files) ZIPs each build independently. Scope oxfmt passes; oxlint has no errors and reports two development-only Fast Refresh export warnings for shared model hooks.

Final corrections include complete product metadata/media persistence, free DataGrid variants, full-page order editing with free NumberField and cent-based 8% tax/shipping calculation, one-click Atlas approval, all changed domain models retained across navigation, and narrow-view typography, KPI stacking, authentication buttons and file-name metadata/actions. Local original branding and media are intentional differences.

Remaining observed scope: Pulse Knowledge Base and Reports, Roster approvals and parts of settings, Cohort People, Flux Evals/Memory/Providers/Costs, Tempo AI Ops and several infrastructure routes are still simplified. Some chart series, precise dimensions and editor chrome differ. This pass does not claim complete page-by-page or pixel equivalence. Details and state evidence are kept in the three family HANDOFF.md files under the temporary audit directory. Git push and Pages status are checked separately from these local results.

## Round three: resolve recorded secondary-page differences

The new pass starts from the deployed round-two result and checks the remaining routes against fresh public-reference browser states on 2026-10-23. Browser plugin is not available in this session; independent Playwright Chromium supplies the reference and rendered checks. Evidence stays outside the repository in `/tmp/bricklane-templates-round3/`. Original reference media is used only as private comparison evidence, never bundled application content.

### First milestone: workflow health, evaluation, memory and helpdesk content

- Flowly's health grid now uses the actual free DataGrid fixed-column sizing and dense-header options. Reference column proportions are 210/300/180/126/104. At 1440px the workflow text starts at x392.4 versus reference x393, replacing the previous x351; header height is 32px and rows remain 64px. All twelve observed health records and their namespace metadata replace the abbreviated five-record list. Editing a record on the third page retains that page; search and filter changes reset pagination.
- WorkflowGrid's optional expansion delegates to the existing free DataGridTableRowExpand and `meta.expandedContent` implementation. Flux Evals uses ten cases, default-expanded findings, regressions filtering and independent create/edit state. Pass Rate Trend directly consumes the existing ReuiTrend Pro Block foundation derived from the documented official free chart examples.
- Flux Memory has eighteen distinct entries, four scopes, pinned entries and trust states. Creating, editing, pinning and unpinning operate on individual records and survive navigation through Overview.
- Pulse Knowledge Base now has six categories and eighteen original replacement runbooks with independent sections, a scrollspy outline, copied article links/text and real local CSV attachments. Article hash links also open correctly without remounting the template.
- Pulse Reports now has three KPI cards using the existing MiniTrend implementation and a ten-agent scorecard with five-row pagination, independent expanded coaching notes, coaching-only filtering and actual CSV/JSON exports. Its table, expansion, filtering and pagination directly reuse the existing DomainRecordGrid Pro Block and free ReUI DataGrid family.
- Source selection lists the main template entry first and the relevant secondary implementations immediately afterwards. Previewed text, copied text and ZIP bytes are checked against the actual saved source. The template-only source target function is handed to the Git coordinator as a small patch so concurrent block mappings remain intact.

The fixed first candidate passed its strict production build and all 58 selected browser cases, including every template's existing desktop/mobile and meaningful interaction checks. After source-order changes the candidate rebuilt successfully and all five source checks passed (two new identity/copy/ZIP cases and three existing dependency-closure cases). Actual browser downloads of Pulse (142 files) and Flux (136 files) each passed independent strict TypeScript/Vite builds. Both exported apps then rendered their target interactions at 1440px and 390px (four states), with no page errors or document overflow. Git commit, push and Pages deployment are verified separately by the coordinating release session.

This milestone does not resolve all remaining differences. Roster approvals/import/settings, Cohort People/Time/settings, provider/cost/infrastructure pages, exact chart series, calendar recurrence and several editor/canvas details remain tracked until their own frozen implementation and browser evidence pass review. No final pixel-equivalence claim is made.
