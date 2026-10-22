# Application blocks

The public REUI snapshot contains 305 application references across 23 categories. `src/blocks/application/index.tsx` dispatches every category to a concrete independently authored implementation. Only shadcn/ui, its underlying dependencies, Lucide, and Recharts are used. No Pro registry source or paid assets were downloaded.

## Implemented surfaces

| Module | Categories | Behavior |
| --- | --- | --- |
| auth.tsx | Auth (20) | Explicit per-reference Google/Apple/GitHub configuration, password visibility, username/email validation, login/signup/reset state, magic-link confirmation/resend, two-step method picker/email reveal, SSO/backup/passkey demos, rotating quotes and photo/card/centered treatments |
| cards.tsx | Card (43) | Metric tiles, profiles, integration toggles, setup checklist, delivery stages, service status, logo grid, agenda cards, promotions and resource links |
| workspace.tsx | App Shell (36), Dashboard (8), Navbar (13), Stats (17), List (11) | Collapsing navigation, workspace/section switching, inbox selection, chat, searchable/sortable/selectable project table, creation, chart tooltips, timeframe, quota meters and directories |
| forms.tsx + account.tsx | Form (12), Settings (16), Profile (10), Onboarding (9), Wizard (7) | Profile/business/invoice/deployment/product/ticket/invite forms; roles, keys, billing, integration toggles, notification/security controls; multi-step setup and confirmation; mailboxes, referrals, meeting capture |
| forms.tsx + technical.tsx | Dialog (15), Sheet (24) | Static preview composition and launchable accessible portals; invites, checklists, cancel survey, app directory, support options, audit JSON/diff, cron validation/presets, canary/retry/logs, firewall conditions, SLO previews, masked dataset/schema |
| planning.tsx | Event Calendar (6), Flow (4), Gantt (4), Kanban Board (10), Timeline (9), Whiteboard (2), Empty State (14) | Add calendar events, month/week/day, resource rows, workflow node selection/edit/run, Gantt scale, board drag/drop/move/create/filter/vote/collapse, activity filters, draggable editable notes and zoom, empty-state creation/import |
| editor.tsx + editor.css | Rich Text Editor (5) | Rich HTML contenteditable document, selection formatting, headings, lists/tasks, links/tables/code, undo/redo/export; wiki slash/mentions/outline, contract redlines with accept/reject and typed suggestions, session-local comments/offline state, streamed local writing suggestions with apply/discard |
| schedule.tsx | Schedule (10) | Session durations, calendar/time-slot bookings, agenda filters, team attendance, schedule creation, webinar RSVP, date/time popover |

## Fidelity status

This is an independently implemented layout-family library. All 305 reference entries resolve, but many entries reuse a responsive family with content or structural variations. It is **not** a claim that 305 separate Pro screens have been pixel-matched. The authenticated Pro source is intentionally unused. Public per-block descriptions informed later refinements (particularly schedules, technical sheets, account settings and photo authentication), while more detailed individual arrangements still differ from the public reference.

The editor uses the browser’s native contenteditable/selection model with shadcn controls. It supports real rich HTML and local redline review, but is not Tiptap/ProseMirror and does not provide a production document schema or network collaboration. Presence/offline/comments remain in the current session. AI suggestions are visibly labeled deterministic local transformations with no AI API. Workflow and technical dashboards demonstrate local state, not production execution. Auth providers, billing, API actions and external integrations use demo feedback, with no network backend. Photo auth uses public Unsplash image URLs as replacement editorial assets.

## Validation

Application files are formatted with Prettier. TypeScript `tsc -b` has no errors under `src/blocks/application` at handoff. Root handles exhaustive catalog rendering, browser QA and site release validation.

## Follow-up validation

Headless browser probes verified selection bold, HTML table insertion and undo/redo, slash-table insertion, mentions, contract accept/reject, typed redline insertion, local comment creation and offline toggle, and assistant suggestion application. No page errors were observed. The wiki mobile view had no horizontal page overflow at 390px. The calendar create-event integration test passed. `auth-20` has the specified Google/Apple row and password visibility; method pickers `auth-12` and `auth-17` reveal email fields only after choosing email. Provider selection gives explicit demo feedback without contacting third parties.

Provider configurations were audited against all 20 public `https://reui.io/blocks/application/auth/auth-N.md` briefs. Methods and providers use explicit id configuration rather than modulo-based variants.


## Dedicated whiteboard refinement

The two whiteboards now use a dedicated native SVG canvas composed with shadcn controls. Design Review was compared with the public reference: goals, checkout flow, frames, handwritten labels and sticky notes. Drawing, dragging, text/image insertion, eraser, zoom/pan, frames, local snapshots/restore, view-only state, JSON files and SVG/PNG export are implemented. Sprint Planning adds draggable story lanes, live point counts, local follow-view simulation and decision log. This replaces the earlier note-only approximation; it is not an Excalidraw engine and does not provide live network collaboration.
