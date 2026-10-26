# Echo native Sidebar and inline Account Settings

This milestone replaces Echo's manual sidebar/Sheet and generic two-field settings screen with the actual ReUI free shell composition and seven independent inline settings sections. It also connects the observed chat-row actions to the same chat records used by history, archives, shared links, scheduling and Markdown export.

Status at freeze: private development candidate. Root owns integration, the next production build, production browser gate, Git and deployment. No new cold/full/ZIP strict build, Vite build or dependency installation was run for this milestone. The actual downloaded project has not been independently built or served. Do not interpret development browser results as production/deployment success.

## Reference and main corrections

Reference: [Echo public template](https://echo-chat.reui.io/chat), including all seven `/settings/*` routes. Live headless Chromium exploration used 1440×1000 and 390×844, DPR1, light theme, networkidle plus positive route/tab checks. The public template changes routes asynchronously: early unsettled samples were superseded by stable, independently opened action flows.

| Entry/state         | Before                                                                                    | Current candidate                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Desktop Ctrl+B      | No shortcut response; Collapse removed the entire sidebar and moved main to x0            | Actual SidebarProvider changes expanded main x249 to collapsed x49, retaining a 48px rail plus separator                                           |
| Mobile chat/sidebar | Only a49px toolbar; manual Sheet returned focus to BODY                                   | 56px brand/search/new-chat header plus48px chat toolbar; native292.5px Sheet at390; Escape/close/navigation return to unique Open chats Trigger    |
| Settings            | Two uncontrolled fields; submit only changed the button label; navigation discarded edits | Seven inline sections;896px desktop content at x389,160px nav/704px panel, independent draft/saved values, immediate defaults and real row actions |

The final visual pass also corrected two consumer CSS causes: the mobile Drawer retained an old28px brand-row rule, moving its Tabs4px upward; shorthand history-row padding suppressed free SidebarMenuAction's reserved end space. The row is now32px and block/start padding preserves the free row/action separation.

## Actual component reuse

- Free ReUI AppShellLayout, AppShellInset, ReuiSidebar, SidebarTrigger, SidebarNavigation and SidebarCollection. Their provider is the only collapsed/mobile-open state. No custom aside, second collapsed flag or independent mobile Sheet remains.
- Existing Pro SearchPalette for global chat-route search. Existing Projects controlled search, EchoComposer, EchoProjects, EchoArtifactList/Panel and scheduled record tuple retain their domains.
- The real extracted Pro SettingsRow, SettingsFields and SettingsChoice. Free Tabs, Frame/Header/Panel/Footer, FieldGroup/FieldSeparator, Input/InputGroup, Textarea, Select/Switch, ToggleGroup, Alert, Dialog/AlertDialog, SidebarMenuAction and DropdownMenu compose the actual screens.
- The official free avatar-upload adapter/useFileUpload provides type/size validation and local upload. Saved avatars are converted to DataURLs so navigation/cancel does not retain a revoked Blob URL. Final testing uses the separately owned adapter80eb snapshot.

The whole SettingsPanel requires onSave and supplies one content/footer layout. Echo has immediate sections, multiple independent cards and row actions, so it reuses its extracted Rows/Fields/Choice with free Tabs/Frame instead of forcing a Dialog or a no-op Save callback. About-you placeholders use the real SettingsRow with free Input/Textarea because the extracted field schema has no placeholder property. The original SettingsPanel freeze was not edited.

Sidebar V3 supplies the exact small shared contracts: label remains a string, headerTrailing renders count/chevron without interactive children, and SidebarTrigger accepts its existing children prop for the mobile Menu icon. Native provider/ref/aria-expanded/Escape behavior remains intact. These shared files are dependencies owned by Root/Theme, not this freeze.

## Data and interactions

General changes appearance through M2's global theme store and applies default model to a new chat. Personalization/Profile preserve separate draft and saved snapshots; Cancel restores saved fields. Memory entries can be deleted. Notifications has compound quiet-hour selects, draft Reset and Save preferences. Security has password validation, independent two-step fields, removable sessions, a disabled current-session action and a local-account deletion confirmation. Billing has vertical plan rows, compound invoice fields, validation, saved billing values and an explicitly local card/plan preview.

History uses stable IDs independent of renamed labels, with per-chat message snapshots. Pin/Unpin moves records between actual collections. Rename validates names and updates the active title. Sharing creates a local URL snapshot that opens the exact transcript in a fresh page and registers in Shared links; clipboard failure provides a selectable real URL. Archive updates history and Archived chats with working Undo/Restore. Delete requires confirmation. Markdown export contains the actual local transcripts, including archived records.

Schedule reuses the existing EchoScheduled `edit` path, form and record tuple. Its only new contract is optional `createFromChat: { id: number; title: string; prompt?: string }`. An effect guards the request ID, calls the original edit function, and supplies the actual latest user message as the prompt. Ordinary New Task still opens empty fields. The original form was not copied and no parallel schedule model was introduced.

All auth, AI, password and billing operations remain honest local preview state; no external provider/account/payment request is sent. Dictation is stored as a preference; this milestone does not introduce a speech service. Original Bricklane branding and local original avatars replace reference branding/portraits. Official screenshots are private QA material only and are not application/download assets.

## Validation and evidence

Private candidate: `/tmp/bricklane-templates-round3/echo-native-settings-a`, clean base `b13170647a49e82a9d6b7cb7fed3d172b4fb6c47`. Only its dev server6349 was used, with unique cacheDir, React dedupe and private TypeScript temporary paths.

- Final functional gate:20/20,1worker. New Sidebar/Settings tests plus existing Echo projects/composer/attachments, scheduled tasks and artifact preview/download all pass. The existing Artifact test changes only the selector role button→tab, reflecting the actual free Tabs semantics; every original assertion remains.
- Native menu Home/ArrowDown/Space, theme dark/light, mobile keyboard End scrolling, real command selection, unique mobile Trigger focus, profile/notification/billing saves, free avatar upload/Cancel, archive/restore/export, exact share snapshots and schedule-form reuse were exercised.
  -25 final visual/geometry states cover both widths, all seven sections, rail, Drawer, account and model popups. Checked states have no console/page errors and no document horizontal overflow. Desktop Tabs has no width/height overflow. Mobile settings navigation genuinely overflows horizontally and retains touch/keyboard scrolling and visible focus; there is no global scrollbar hiding rule.
- Actual template-detail UI Download project produced a222-entry ZIP. Owned runtime, V3, extracted SettingsPanel, avatar adapter, reference.css and M2 dependencies are checked byte-for-byte. The archive includes free ReUI MIT, project MIT, Inter OFL, licensed stock attribution and the actual local font file. The generated Example uses GlobalThemeStore plus applyTheme.
- Scoped oxfmt/oxlint run against owned files. Production/strict and standalone downloaded-app execution remain pending Root's build queue.

Evidence roots:

- `/tmp/bricklane-templates-round3/echo-layout-settings-audit-next/`: reference audit, settled seven-section/options/row-menu flows and private screenshots.
- `/tmp/bricklane-templates-round3/echo-native-settings-qa/final-20.log` and `final-20/`: final20 tests, screenshots/downloads/traces as applicable.
- `/tmp/bricklane-templates-round3/echo-native-settings-qa/final-visual.json` and `final-*.png`: final geometry/state pairs.
- `/tmp/bricklane-templates-round3/echo-native-settings-qa/final-geometry-followup.log`: focused mobile checks after the last two CSS geometry declarations.
- `/tmp/bricklane-templates-round3/echo-native-settings-qa/actual-ui-zip-proof.json`, `download-projects.json`, `echo-template.zip`: actual UI archive and exact-byte/license evidence.

The initial trace run accidentally wrote generated HTML inside the dev root and caused Vite watcher reloads. It was stopped, preserved as invalid tool evidence, and all authoritative runs use a separate output directory. It is not counted as a product regression. A temporary macOS proxy tunnel failure was resolved only for the reference headless process with a direct connection; system settings were not modified.

## Root integration

This freeze owns nine runtime files, one new test, one one-line legacy test adjustment and this ledger. Shared Sidebar V3, SettingsPanel4 and avatar80eb are explicit exact-byte dependencies, not owned changes. Root alone edits source-targets and Git.

Recommended narrow `secondaryModules.echo` value:

```ts
echo: [
  "echo-sidebar",
  "echo-settings",
  "echo-chat-actions",
  "echo-composer",
  "echo-projects",
  "echo-scheduled",
  "echo-artifacts",
],
```

The default remains the actual `echo.tsx` implementation. `.ts` model files and scoped CSS are transitive source dependencies, as confirmed in the actual UI ZIP; do not append them to a helper that unconditionally adds `.tsx`. Do not overwrite unrelated pending work when applying this narrow integration.
