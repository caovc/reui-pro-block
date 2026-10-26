# Flux Settings header: native Pro component integration

Status: private static candidate. No build, browser, Source dialog, ZIP, exported-runtime or deployment pass is claimed for this header revision.

## Reference and concrete corrections

Private reference evidence is retained at `/tmp/bricklane-templates-layout/flux-settings-5fcd-reference-review/phase2/`. It is not distributed in the site or download. The actual reference System Monitor is a native Popover, not the generic run-detail panel previously opened by Settings' System Status button. The actual Nick Bold breadcrumb is an interactive trigger opening the complete five-tab profile dialog, not static Person text.

The Settings header now directly composes the existing Pro `SystemMonitor` and `AccountSettingsDialog`. The real native Popover/Dialog own their open state, portal, keyboard close and trigger focus. No copied overlay, focus manager or SettingsPanel has been introduced.

The observed reference monitor is 320 × 423 at the desktop and phone viewports. It has four resource metrics, four trends and six per-agent memory rows, with the memory section collapsible. Its values are explicitly local simulation. The observed profile dialog is 960 × 768 on a 1440 × 1000 desktop and 366 × 742.72 on a 390 × 844 phone. Consumer-only mobile CSS supplies 12px side insets and 88svh height. These are reference targets; the integrated runtime is still unmeasured.

## Actual reuse and smallest extensions

- Layout retains the existing actual free `AppShellLayout`, `AppShellInset`, `ReuiSidebar`, Sidebar navigation/provider and native mobile Sheet through the published workflow Shell. This header batch adds no Sidebar API or substitute layout.
- The Settings screens retain free ReUI Frame, Item, IconTile, AvatarGroup, Badge and dense DataGrid, plus the existing Pro SettingsFields, SettingsRow and SettingsChoice from the original frozen Settings milestone.
- Header Breadcrumb, Button and Avatar reuse the project's existing official free implementations. `Person` remains the existing noninteractive Avatar composition inside a real native Button trigger.
- `SystemMonitor` gets only `trigger?: ReactElement` and `presentation?: "default" | "flux"`. Its existing state and open-only timer are retained. Default no-prop caller projection is unchanged. Flux opts into its measured presentation.
- The Sparkline page is a paid Pro block, and no independent official free ReUI Sparkline API was found. With Root's explicit approval of this gap, Flux trends use the existing `MiniTrend` composition of actual shadcn ChartContainer and Recharts Area. Official free `@reui/c-chart-16` registry and existing MIT provenance are recorded in the child artifact. MiniTrend is not mislabeled as an official free ReUI Sparkline. The old default monitor SVG remains unchanged for caller compatibility and is not claimed as migrated.
- `AccountSettingsDialog` gets an optional real trigger, mount seed, copied save callback, initial avatar, confirmed Role choices and consumer portal class. The unchanged complete Pro form retains free Tabs, Field, Select, Input/InputGroup, Switch, Textarea, ScrollArea and the actual official free c-file-upload-2 adapter/useFileUpload, plus ReUI Badge and existing notices.

The independent Flux seed is Nick Bold / Atlas / Owner, with Bricklane example addresses and local generated artwork. Only Owner has been observed in the reference Role list; no other reference role is invented. The complete saved fields snapshot belongs to Flux parent state and is supplied on remount, so saved identity fields can survive Settings navigation and leaving/reentering Settings. Upload previews/files retain the Pro dialog's own lifetime and are not claimed to persist across route unmounts. Cancel preserves the Pro dialog's existing unsaved-draft behavior but does not call the save callback. The Verified badge only compares with the mounted local demo seed, and does not claim remote email verification. Sidebar/footer identity synchronization remains outside this batch.

## Static evidence and compatibility

The frozen Monitor package is `/tmp/bricklane-flux-monitor-static-v1/manifest.json`, SHA `e25f1005b295aebf157f046e93bd451b2bd56f71994bfbe218d7e4504fb0c0ad`. It retains a zero-difference normalized default DOM projection, unchanged NewsCard/EnvironmentShell and unchanged Inventory caller. The Profile package is `/tmp/bricklane-flux-profile-static-v1/manifest.json`, SHA `ca840adf1768157654c8f3aa615f9605c3a5366f8324f6c76b859410e26b8756`. It retains 30 matching AST comparisons and seven byte-identical dependencies. Both actual runtime inputs are copied without alteration into this integration.

The existing Shell change remains only the previously supplied AgentOps header-title host from span to div, allowing the real Breadcrumb nav. All five published optional props and default callers are preserved; no future Mesh headerContent proposal is overwritten. SourceTargets extends only the Flux priority array with four real Settings leaves and the new header leaf; no generic helper, suffix filter or unrelated ID is changed.

Scoped format/lint and TypeScript syntax parsing are static checks only. Historical cold Settings evidence remains 7 pass / 4 clipboard-permission failures, followed by an actual-origin-only test fixture fix and one 4/4 affected rerun. It is not represented as one final all-green eleven-test run. The old immutable production assets remain unchanged and cannot validate these new headers.

## Required next validation

1. Root compatibility review of the two optional Pro APIs and narrow shared Shell/SourceTargets patches.
2. A new original main build with the exact final runtime and existing configs, preserving all later Root commits. No new dependency is required.
3. Original Settings eleven tests once, with the actual-origin clipboard fixture and all fixed Frame/row/footer/action measurements retained.
4. Monitor at 1440 and 390: native Popover dimensions and placement; four real chart DOMs; six memory rows; actual collapse/reopen; Escape and focus restoration; no generic execution trace; no console/page errors. Confirm real chart sizes/labels and theme tokens.
5. Profile at both widths: native Dialog dimensions/scrolling, independent name/email/Owner seed, all five real tabs, real Select and upload validation, required-name/email validation, copied Save snapshot/name update, Cancel without parent save, Escape focus, saved fields across Settings paths/away/back. Record local-media lifetime and mounted-seed badge semantics honestly.
6. Default Pro callers: both default SystemMonitor routes and default AccountSettingsDialog launcher/form/three Role options, keyboard focus, original result/media flows and unchanged mobile geometry. Static AST equality is not runtime proof. Default routes are `/#/preview/application/app-shell/app-shell-7` (Environment Switcher), `/#/preview/application/app-shell/app-shell-8` (Inventory Admin, select Orders to mount its Live Metrics monitor), and `/#/preview/application/dialog/dialog-10` (Account Settings Modal). Inventory’s secondary Sidebar monitor is already hidden on mobile; this is an existing caller limitation. The existing `tests/settings-panel-controlled.spec.ts` has two default-dialog cases at 1440/390; there is no existing dedicated SystemMonitor popup/focus test, so those cases must be added.
7. From that final main only: actual Source order/content/copy/single-file/ZIP closure and notices; real exported project normal install/strict build; actual portable desktop/phone header interactions.

Remaining reference gaps include the full Role option list, broader Sidebar active pills/Runs/Quick links/footer identity/notification detail, purple focus-theme tokens, and header interactions on non-Settings screens. The failed readonly phase2 harness animation cancellation is retained as an audit failure, not presented as product failure or a passing complete reference audit. This batch does not claim complete Flux fidelity.
