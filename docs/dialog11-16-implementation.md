# Dialog 11–14 and 16 — audit in progress

This independent batch owns only `dialog-variants/workspace-final/`, its focused tests and this new ledger. Dialog 1–10 are frozen. Shared dispatcher, source mappings, UI and package files remain Root-owned.

## Confirmed public catalog

| Catalog index (zero based) | ID        | Public page                                         | Required composition                                                                                                       |
| -------------------------- | --------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| 10                         | dialog-11 | https://reui.io/blocks/application/dialog/dialog-11 | Finance account form beside live card preview; three field limits, safe demo account values.                               |
| 11                         | dialog-12 | https://reui.io/blocks/application/dialog/dialog-12 | Five independent entry drafts in tabs; shared status, single assignee, real due date, priority and multi-label properties. |
| 12                         | dialog-13 | https://reui.io/blocks/application/dialog/dialog-13 | Full-screen project creation; three template prefills, Select properties and checkbox label cards.                         |
| 13                         | dialog-14 | https://reui.io/blocks/application/dialog/dialog-14 | Provider rail, permission notes and two actual sync-scope radio options; local consent draft only.                         |
| 14                         | dialog-16 | https://reui.io/blocks/application/dialog/dialog-16 | Ranked contact candidates, match markers, per-record Link and Create new fallback, honest Undo before final local result.  |

There is no catalog `dialog-15`. Public Markdown reviewed for all five; desktop/mobile native CUA review is pending browser rotation. Do not treat this ledger as readiness evidence.

## Actual free sources inspected before implementation

- Existing unchanged free c-dialog-3/c-dialog-6 composition and free Frame launchers from first-run are available for reuse. Installed actual free Badge/Alert/IconTile remain available; no new shared source needed.
- Existing frozen workspace free c-combobox-21/22/26 supply status/priority/labels. Reuse these exports rather than rewriting their capabilities.
- [Official free c-combobox-23](https://reui.io/r/radix-nova/c-combobox-23.json): actual single-member picker source copied into new `free/assignee-picker.tsx`. Original clear/group/Avatar/Item behavior remains; controlled field id/value/onChange replaces private example state. All remote avatar images replaced by original demoAvatar; IconPlaceholder adapted to installed Lucide. Fixture labels will be aligned only after public preview review.
- [Official free c-combobox-25](https://reui.io/r/radix-nova/c-combobox-25.json): actual date preset + nested custom calendar dialog source copied into new `free/date-picker.tsx`. Original date-fns date calculations, no-date option, preset rows, two-month Calendar and confirm/dismiss mechanics remain. Controlled field id and caller-supplied reference date avoid a fabricated frozen today; draft date initializes on the custom-picker opening event rather than an effect. Source date values are actual Date objects.
- [Official free c-radio-group-3](https://reui.io/r/radix-nova/c-radio-group-3.json) reviewed: RadioGroup + horizontal Field, actual RadioGroupItem, FieldContent/FieldLabel/FieldDescription composition; use it for consent scopes instead of hand-built radio controls.
- [Official free c-item-3](https://reui.io/r/radix-nova/c-item-3.json) reviewed: ItemMedia with Avatar, ItemContent with title/description, ItemActions with Button. Use actual pattern for duplicate candidate rows with original avatars and actual free Badge.

Public free registry search briefly timed out and a full registry transfer ended partially; the five individual official free JSON resources above were retrieved intact. No paid Pro registry was fetched.

## Known interoperability difference to assess

Frozen Dialog9 uses modal=false exactly like the free c-combobox-17 dialog composition because upstream BaseUI Combobox portals otherwise become inaccessible inside a modal Radix dialog. This changes focus trapping/backdrop behavior. This was investigated and corrected for final12 using the Root-authorized optional official Portal destination described below. The earlier frozen Dialog9 stays unchanged.

## Native public observations (2026-10-23, first rotation)

Own Edge tab 986146151 was selected through fresh native AX after Commerce released. All five standalone desktop previews were read; Dialog11 also inspected in official parent Mobile width mode. At the end, clicking Dialog16 first Link returned user-changed; all further browser actions stopped and Data received the next five-minute rotation. **Pending**: mobile12/13/14/16, actual16Undo, plus13assigned/status options. No paid Code tab was opened.

### 11 Finance

Desktop two-pane roughly896px: left header/form/footer, right full-height blue-purple-pink gradient with centered Card. Initial autofocus Account name. Exact seed Cedar Operating / cedar_ops / CEDAR STUDIO. Name updates preview initials (QA Operating→QO). Tag input lowercases and strips hyphen (QA-TEST_2026→qatest_2026). Statement max18 uppercases; tag max22. Card: Available balance $86,240.00, Account type USD operating, Statement label, Routing021000021. Our routing uses DEMO-000021 deliberately. Mobile: title wraps, fields then gradient card in the scrolling body, pinned footer with Terms above side-by-side Not now/Create account. Terms original inert; ours toggles clearly nonbinding local disclosures.

### 12 Entry

Desktop≈672px; title Create entry / Create and assign a quick record.; five tabs in normal TabsList. Title InputGroup with entry icon; Notes Textarea; Status/Assignee, Due date/Priority two pairs, Labels half-width below; fixed Cancel and per-tab primary footer. Default shared fields Planned, Maya Stone, Tomorrow, Medium; labels Billing/Beta. Actual choices: assignee No assignee; Team members Maya Stone (You), Leo Grant, Nora Chen, Samir Park; New user→Invite... (original inert). Labels No label/Billing/Beta/Support/Risk. Date presets exact free25: No date, Tomorrow, End of week, In one week, End of month, In one month, Custom date...; public dates pinned June30,2026. Custom opens actual two-month July/August calendar with Dismiss/Confirm. All five title/notes drafts inspected:

- Action: `Close billing-event gaps before partner beta`; `Confirm upgrade, downgrade, and trial-extension events are mapped before the beta opens.`; placeholders `Name the next action...`, `Add context, acceptance notes, or blockers...`; Create Action.
- Brief: `Partner beta readiness decision`; `Summarize launch criteria, support coverage, and rollout risks for reviewer sign-off.`; placeholders `Title the decision brief...`, `Capture the decision, evidence, and open questions...`; Create Brief.
- Nudge: `Remind support leads about beta cohort`; `Send a short note before launch review so channel coverage is confirmed.`; placeholders `What should the team remember?`, `Add the short prompt that should be sent later...`; Schedule Nudge.
- Canvas: `Map activation handoff`; `Sketch the owner handoff from signup to first successful invitation.`; placeholders `Name the shared canvas...`, `Describe what the canvas should organize...`; Start Canvas.
- Pulse: `Launch room health snapshot`; `Share current readiness, open risks, and the next milestone in one update.`; placeholders `Name the status pulse...`, `Summarize signal, risk, movement, and next readout...`; Publish Pulse.

### 13 Templates

Nearly full viewport white Dialog, 24px inset, top Back / Support bar, bottom full-width footer with Project draft left and Cancel/Create right; centered form max≈640px. Header Create Project and Select template dropdown. Helper Set details, owner, timing, and labels. Name/key about4:1, brief, 2×2 Select properties, label checkbox cards2×2 with count Badge. Templates observed by actually choosing all3:

- Bug Report / Triage defects with owner and severity. Seed Billing Event Cleanup / BEC / Audit subscription event mapping before the partner beta opens to billing admins. Status Planned, High.
- Feature Request / Shape a request into scoped delivery. Invoice Export Builder / IEB / Create a guided export flow for finance teams that need clean invoice bundles. Backlog, Medium.
- Chore / Track maintenance without extra ceremony. Workspace Cleanup / WCL / Remove stale workspace fields and align project defaults before the next release. In Progress, Low.

Templates leave assigneeMayaStone/dueNextFriday and label selection unchanged. Menu includes inert Manage templates. Date menu: Tomorrow / Queue for the next planning review.; Next Friday / Land before the weekly release readout.; End of month / Track with monthly planning closeout. Reference values are labels without real dates; ours must save actual date equivalents. Label cards: Feature / Product-facing capability.; Billing / Revenue or plan logic.; Design / Interface or UX work.; Operations / Process and rollout tasks. First2 initiallychecked. Support link is placeholder#.

### 14 Consent

Narrow≈384px; centered provider logo rail OpenAI ... Google, centered Connect Gmail / Choose what Gmail can share. Two vertically spaced notes with raised IconTiles: Google Review / Approve permissions on Google's page.; Data Control / Disconnect anytime from settings. Separator, Sync Scope heading, two bordered radio cards. Headers Only / Recommended / Sender, subject, and dates.; Messages / Better context / Thread text for answers. Headers initiallyfocused+selected; clicking Messages actually flips group. Equal width Cancel/Continue footer. Our original BL/Mail glyphs replace extracted vendor SVGs intentionally; Continue must only save a local scope and disclose no OAuth.

### 16 Duplicates

Possible Duplicates / 4 existing contacts may match this one. New Contact panel Maya Chen; maya.chen@northwind.io / Northwind Labs / Demo request. Existing Contacts ordered score:

1. Maya L. Chen, Strong97%, maya.chen@northwind.io(matches), Northwind Labs(matches), Customer.
2. Maya Chen-Ruiz, Likely81%, maya.ruiz@gmail.com, Northwind Labs(matches), Lead.
3. M. Chen, Likely74%, mchen@northwind.io, Northwind Labs(matches), Churned.
4. Maya Cheng, Weak58%, maya@chengstudio.co, Cheng Studio, Qualified.

First Link initiallyfocused. Each row real Link to [name] accessible label. Footer Cancel/Create New. Clicking firstLink encountered browser user takeover before result proof; do not claim observedUndo yet. Original avatars must be replaced by demoAvatar. Use safe fixture email domains while retaining logical match markers.

## Implemented consumers and deliberate differences

All five independent modules now exist and are tested in an isolated production candidate. Shared working dispatcher/source-targets remain unchanged; private candidate routing uses zero-based index>=10 for this exact-ID router, source mapping explicitly handles11/12/13/14/**16**. `variant` in the shared source-target helper is parsed from the ID suffix, so16 must not be accidentally treated as15.

- `finance.tsx`: actual upstream Dialog/Card/Field/InputGroup supported by the public REUI free documentation, existing actual free Frame/IconTile/Alert launcher. Custom domain form/live card supplies the missing finance workflow; safe DEMO routing reference, original CSS gradient, no account creation. Terms toggles actual local nonbinding disclosures. Empty preview fields retain the observed default fallback; saving requires all three identity fields.
- `entry.tsx`: actual free status21, priority22, single-assignee23, due-date25, multi-label26 source adapters. Each tab retains its own title/notes, properties remain shared. Date presets calculate against actual opening date; custom two-month calendar confirms a real Date. Invite is corrected from the reference's inert action into a local validated invitation draft; no email/access service. Original portraits. Team list is intentionally flat because the free23 static grouped list failed to filter; official function-child list now performs real filtering, with an assertion that Leo search leaves one option. Decorative avatar alt text is empty to avoid repeating the same label twice in the accessible option name. Domain labels Billing/Beta/Support/Risk match observed public choices.
- `templates.tsx`: actual free Checkbox9 clickable FieldLabel/Field cards; installed upstream Radix Select as prescribed by [REUI's free Select documentation](https://reui.io/components/select). Existing free Badge/Alert/Frame consumers. Three templates prefill observed fields while preserving assignee, due label and chosen cards. Date labels resolve to actual dates. Inert Support/Manage templates/Draft controls become honest local explanatory panels. Some Select menu helper descriptions/dots and property help tooltips are simplified; four assignee labels use the observed shared team fixture and await per-menu public confirmation.
- `consent.tsx`: actual free Radio3 composition plus free IconTile/Badge and Item/Field/Dialog primitives. Original BL/Mail service marks replace vendor SVGs. Selected scope is actually saved; no OAuth, Google redirect or real permission.
- `duplicates.tsx`: actual free Item3 candidate row composition plus actual free Badge, original demo avatars, safe example-domain fixtures. Ranked scores and match markers retained. Sonner action provides a real five-second Undo window; completion occurs only on auto-close/dismiss and only if Undo did not clear the pending local candidate. Separate create-new draft works. There is no remote contact merge or creation. Public Undo final appearance remains unobserved after a user browser takeover; our local Undo and delayed-finalization behaviors are tested independently.

### Official Portal containment correction (Root-authorized shared hunk)

`src/components/ui/combobox.tsx` has exactly one additive API extension: optional `portalContainer`, typed from `React.ComponentProps<typeof ComboboxPrimitive.Portal>["container"]`, passed to the actual official BaseUI Portal. Source: installed `@base-ui/react/combobox/portal/ComboboxPortal.d.ts`, official [Combobox Portal API](https://base-ui.com/react/components/combobox#portal). Default undefined preserves prior behavior. Final12 passes its actual DialogContent ref to the free adapter popups; Radix Dialog keeps its default **modal=true**. No manual overlay, menu, focus trap or pointer implementation was introduced. Existing Dialog9's frozen modal=false code is untouched and covered by its complete previous15-test regression suite.

The new status/priority/labels adapters preserve the actual upstream free sources, with only controlled values, observed labels and the optional Portal destination. Separate modules are necessary because the frozen earlier adapters do not expose a Portal destination; they were not overwritten.

## Verification checkpoint

- Candidate `/var/folders/cq/bm871j297l9bf55pb_q1vysm0000gn/T/reui-dialog-final-production-zovqtcq9`, production build passed.
- `tests/dialog-workspace-final.spec.ts`16 tests + previous `tests/dialog-workspace.spec.ts`15 tests: **31/31 passed42.7s**, one worker, standard30s per case. The delayed-link assertion allows8s specifically for its real5s business Undo timer; test timeout stays30s.
- Covers five routes at1440/390 with actual viewport geometry/no page errors/focus restoration; live finance sanitization; title drafts in all five tabs; status search, priority selection, actual assignee filtering/local invite; custom two-month date confirmation; template prefill and persistent label cards; actual consent scope; Undo and delayed link commit; five exact source leaves; actual ZIP contents; all6–10 behaviors including default Portal destination.
- Modal interaction checks verify visible official overlay, body pointer protection, keyboard Tab staying inside DialogContent, actual menu selection, and focus returned to launcher. Radix's current DOM does not expose aria-modal, so tests verify real behavior rather than asserting an absent attribute.
- A real fullscreen positioning bug was found and fixed: inherited shadcn `--tw-translate-x/y:-50%` shifted13 outside viewport. Dedicated fullscreen CSS overrides those variables to0; final bounding geometry is24px inset at1440 and12px at390.
- Ten stable screenshots at `/tmp/reui-dialog-final-audit` wait for all animations/images. Local mobile rendering passed for all5. **Public original mobile12/13/14/16 remains pending** because the human is using Edge; the only configured browser is Edge and hidden IAB reports unavailable. No claim of pixel-perfect public-mobile comparison is made.
- Scoped oxfmt/oxlint passed; final source ZIP build/render and frozen hashes are recorded in release manifest. No child Git writes, package/dependency modifications, original-site assets or shared routing edits.

Final real Dialog12 ZIP contains302 files /3,534,469 bytes, old ScheduleJPEG paths0, built independently at `/tmp/reui-dialog12-realzip-qwmElG`, and served on5209. Actual Completed selection at1440/390 passed with no page errors or horizontal overflow.
