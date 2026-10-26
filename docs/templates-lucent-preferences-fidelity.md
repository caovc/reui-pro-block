# Lucent General and notification preferences

Status: private warm-browser review complete; production TypeScript/build, Source UI/archive and release gates remain Root-scheduled. No new server, install, build, working-tree edit or Git write was performed by the template agent. The implementation base is e5f76f05b190b14a2e4d2b8fa614f16fd4d62113. Root integrated only the eight owned files into the existing6350 candidate at /tmp/bricklane-templates-layout/drive-native-candidate. Copy only the final manifest files, never the entire checkout or older static snapshot.

## Problem and resulting behavior

Official reference https://lucent-devops.reui.io/settings contains General Settings followed by Notification rules on the same document. The previous local Settings branch was a generic Atlas name/email form. It now renders eight General rows and nine notification controls. Security and Integrations remain separate entries with their original models byte-identical to the fixed base; infrastructure and other routes are not changed.

General includes project name, API endpoint with Required badge and prefix, seven week starts, origins, six color swatches, compound region/currency, date format and four interface switches. Original Bricklane example domains replace reference domains. Save validates required local values and records a preference/origin snapshot, with a native output announcing the local record. Reset restores defaults and clears the saved record, matching the measured reference behavior even after Save; it does not reset immediate notification values. Leaving/reentering the Settings branch resets both child models, as observed in the official demo. Existing parent-owned Security state remains intact across these route changes, verified at both widths.

Notification controls cover delivery channel, digest, quiet hours, critical paging, grouping, watching scope, environment, flag changes and certificate expiry. Each group uses an independent native Collapsible, initially open, preserving values when collapsed. The notification rows use the same actual free Item composition observed in the reference, including its description clamp and transparent border. No Save/Cancel is invented for immediate rules.

## Actual reuse and corrected duplication

- Official free ReUI Frame/Header/Title/Description/Panel/Footer and ColorPicker/ColorPickerSwatches provide the actual rendered behavior. Badge, Alert and useFileUpload are real imports.
- Existing extracted Pro SettingsPanel SettingsRow, SettingsFields and SettingsChoice handle General field presentation, labels, input groups, controlled selects and values. Compound rows use actual Row children. A free FieldGroup/FieldSeparator supplies the reference's real divider spacing.
- Notification rows directly reuse actual free Item/ItemContent/ItemTitle/ItemDescription/ItemActions plus Separator, rather than forcing the General Row layout and compensating with typography. The frame uses native Collapsible wrappers that preserve both free Frame and Panel data slots. Initial asChild composition overwrote those slots; that real composition error was corrected.
- Existing native free Dialog, Item, Field, Input, Switch and ToggleGroup provide actual portal, focus and keyboard semantics. No free primitive, shared helper, parent Shell, globalCSS, Tabs, source collector or SourceTargets is edited.
- The 450px origins Dialog uses existing Item rows, actual add/remove and native Escape/Done focus return. Minimal local HTTP(S) origin validation and duplicate prevention are intentional local safeguards; exact official invalid-origin behavior was not established and is not claimed.
- Whole SettingsPanel is not forced: its required Save/navigation rail do not match this page and the immediate notification groups. No no-op Save is introduced.
- useFileUpload opens a genuine chooser, validates the selected file and truthfully identifies it; an unused preview URL is revoked in the consumer callback. Shared hook remains unchanged.

Explicit read-only dependency: settings-panel.tsx SHA256 2c7efa78e45954ea419c8ccd8b7fcf22442837d7a68ff7548ab84f641821e397 and companion settings.tsx SHA256 8dfa95b57226ebf1ee08403026d1098d98dad996d353cf60e4ccfd2e36eee73e, the immutable SettingsPanel4 snapshot. Existing Root-approved controls d705f0 and warm candidate shared baseline are dependencies, not owned changes.

## Measured layout and actual interaction

Chromium, DPR1, zoom100%, light, direct app entry /#/template-preview/lucent → Settings against official /settings. Both widths use the same default values and scroll state for the final private pairs. All three Frame rectangles match the reference measurements exactly:

| Viewport  | General x/y/w/h    | Alert delivery x/y/w/h  | Subscriptions x/y/w/h |
| --------- | ------------------ | ----------------------- | --------------------- |
| 1440×1000 | 272/64/1152/937.25 | 272/1091.25/1152/375.25 | 272/1486.5/1152/308   |
| 390×844   | 16/64/358/1365.25  | 16/1539.25/358/480.25   | 16/2039.5/358/411.25  |

General's eight row positions/heights also match. The measured fixes were actual FieldSeparator spacing, label19.25px/description16px line heights, compound field gap8, interface Field composition and genuine Item notification rows. No hard-coded Frame height or parent Header hiding is used. Original branding/avatars and existing parent-shell differences are intentional or separately tracked; matching these rectangles does not claim every template pixel is identical.

At390 the date group genuinely overflows horizontally: client330/scroll348, client/scroll height34. It retains native keyboard/touch scrolling and visible focus; no global scrollbar suppression is added. An additional focus probe found native roving focus could leave an offscreen target below the phone viewport. Consumer-only onFocusCapture schedules nearest scroll after native focus and only for the still-active radio, with local scroll margin for its native ring. The final End target is fully visible at x247.906/y812.25/w108.953/h28 inside390×844; no primitive or outline override was introduced.

The origins Dialog measures450px desktop and358px phone, has no horizontal overflow and restores focus to the genuine Add origin trigger after Done/Escape. Actual Customize → Default/Serif/Mono/Reset reaches General Select portal, origins Dialog and its input as Inter/Georgia/monospace/Inter at both widths. Existing reference.css is actually imported; there is no local font-family patch.

## Explicit remaining gaps

- Reference file import contents were not established. The genuine local chooser selects/validates a file, then states that content import is unavailable and directs the user to manual origin entry. No fake import-success message or external ingestion is claimed.
- Quiet-hours Custom window is selectable as a local preference, with an explicit message that custom-window editing is unavailable. No guessed editor or backend is built.
- Local settings do not provide real authentication, email delivery, notification dispatch or server persistence. Interface preference controls store settings; this milestone does not introduce new global shortcut/spellcheck/animation infrastructure.
- Parent Header retains its current behavior. Official Bell feed, member and Invite differences remain separate coordinated shell work; no fake feed or parent-shell CSS hiding is added here.
- Mobile document bottom padding differs by4px because of the existing parent layout. Frame geometry is unchanged and document horizontal overflow is zero; parent layout remains out of scope.

## Verification and provenance

QA root: /tmp/bricklane-templates-round3/lucent-settings-static-qa/. Official screenshots stay private audit material and must not be packaged or published. Runtime and test hashes are recorded in the final freeze manifest; the Source/archive gate is pending Root coordination.

- Scoped oxfmt check and oxlint pass on owned files.
- Original eight-test exploration: six failures and two passes, retained in ui-first-8 with traces. The original failure set identified badge-accessible names, Select keyboard synchronization and the approved controls' native radio semantics; later states in that exploration may have seen an early owned HMR fix, so it is explicitly not a gate. Source changes were subsequently kept outside active test runs.
- Fixed-source ten-case run: final-10.log, **10/10 PASS in33.0s**, with final-gate-inputs.json byte record. Covers SaveReset/notification independence, route reset and retained Security state, real origin validation/add/remove/focus, actual file chooser and truthful import gap, native Select and collapse keys, free ColorPicker/region/date values, plus both-width Customize fonts across16 portal states.
- Later focus-only consumer fix: focus-final-2-v2.log, **2/2 affected cases PASS in5.5s**, with starting page scroll reset to0, positive radio focus, full viewport intersection and explicit target rect assertion. The ten-case run preceded this narrow fix; do not describe it as one final ten-case run on the later bytes. Other behavior/font code is unchanged.
- visual-after-slot-fix.json: final default Frame measurements at both widths, zero page/console errors and document horizontal overflow.
- final-states.json and final-*.png:14 additional state screenshots including actual offscreen-to-visible date focus, origin input error, chosen file, honest Custom window gap and independent collapse. Both error arrays empty and document widths equal390/1440.
- final-10/ contains the actual Customize font portal screenshots. final-reference-pair-390.json and final-reference-pair-partial.json identify the final matching entry/defaults/scroll state; pair-official/local-general/notifications-{1440,390}.png provide private reference/local pairs. A transient reference tunnel failure interrupted the combined pair run; the isolated390 retry succeeded, without changing system proxy settings.
- Original audit, computed Field/Item structures and before metrics remain under lucent-settings-audit-next/ and reference-row-measure.json, reference-row-parents.json, notification-ancestors.json, visual-before-slot-fix.json. Private official imagery is not a preview asset.

No TypeScript/build, actual Source project download/archive byte-license check, standalone archive build, Git commit/push or deployed success is claimed here. Root owns the release window, SourceTargets, collector and Git. Suggested narrow secondary module additions are lucent-general-settings, lucent-notification-rules and lucent-origins-dialog; data.ts and CSS are real transitive imports. Preserve the infrastructure module mappings.
