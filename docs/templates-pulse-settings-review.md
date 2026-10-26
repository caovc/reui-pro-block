# Pulse Settings fidelity review

Reviewed 2026-10-26 against <https://pulse-helpdesk.reui.io/settings>. This is an independent Bricklane implementation using public browser-visible behavior; no paid source or original premium media is bundled.

## Reference and scope

The flow reviewed is Pulse → Settings → edit desk details, regional defaults, allowed domains and workspace preferences → save → leave and return → change a draft → reset to saved values. The reference was loaded through `networkidle` in Chromium at 1440×1000 and 390×844. The Add allowed domain dialog was also opened directly.

Private reference screenshots and DOM/control evidence live in `/tmp/bricklane-templates-round3/pulse-settings-qa/reference-*`. They are QA evidence, not distributed assets. Browser plugin/skill was not available in this agent's session; the explicitly authorized independent headless Playwright fallback was used without occupying another agent's foreground browser.

## Actual reuse

- Official free ReUI `Frame`, `FrameHeader`, `FramePanel`, `Badge` and `Alert` provide the settings surface and feedback.
- Official free `ColorPicker` / `ColorPickerSwatches` provide controlled selection, keyboard support, accessible names and selected state. The reproduction adds a scoped selected ring matching the reference.
- The existing `SmallTabs` Pro Block composition provides the date-format choices using the shared button dependency. Reusing an existing Pro Block is explicitly permitted by this task; this is not counted as a newly imported official ReUI component.
- The existing shared `Input`, `Button`, `Select`, `Switch` and `Modal` retain their primitive behavior. These are stock primitive dependencies used beneath the ReUI composition; they are not relabelled or counted as official ReUI implementations.
- Official free `useFileUpload` handles file acceptance, size limits and input behavior for allowed-domain imports.
- `useSettingsDraft` is custom local demonstration state: the free registry does not provide this template's desk settings persistence or domain-import rules. The parser validates the full input before adding normalized, unique domains.

## Corrections in this batch

| Browser-visible difference                                                       | Correction                                                                                                                                                      |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reset and Save were outside the card; reference places them in its muted footer. | Added an optional footer slot to the existing settings composition and placed Pulse actions inside the same free Frame. Existing callers retain their behavior. |
| The card header was taller.                                                      | Pulse-only header padding now uses 8px.                                                                                                                         |
| Region and Language omitted their reference icons.                               | Added local Lucide Globe and Languages icons without replacing the free Select.                                                                                 |
| Date buttons were 28px rather than 32px.                                         | Pulse-only CSS uses 32px buttons and 14px text.                                                                                                                 |
| Selected color lacked the visible outer ring.                                    | Scoped CSS styles the free swatch's actual `aria-selected` state.                                                                                               |
| Add-domain dialog description and example differed.                              | Matched the public visible dialog wording and example.                                                                                                          |

No global vendor, Filters, DataGrid, Roster controller or navigation implementation was changed. Pulse-specific refinements live in `pulse-settings.css`; the shared settings CSS was preserved from the original m4 freeze.

## Validation

- Independent candidate: current committed `8362e2c` archived, then the original six-file m4 freeze overlaid. No unrelated shared workspace work was included.
- `npm run build` passed with TypeScript checking enabled, before and after the corrections.
- `tests/templates-collaboration-round3.spec.ts`: **9/9 passed**, including seven previous family cases plus invalid-domain/import deduplication and mobile regional/domain/save coverage. Output: `pulse-settings-qa/tests-final`; no shared Playwright output directory was used.
- Scoped `format:check` and `oxlint` passed with zero errors.
- The actual Pulse template detail UI downloaded `pulse-m4.zip` (**167 files**). The six settings/runtime modules and styles match the candidate bytes exactly. `source-ui.json` also verifies the source modal and clipboard copy against the actual settings implementation.
- The ZIP includes the actual ColorPicker, upload hook and Pro Block dependencies, REUI MIT notice, project LICENSE, Inter/Archivo OFL notices and third-party provenance. Its generated Example includes `useGlobalTheme` and `useLayoutEffect(() => applyTheme(...))`.
- The downloaded ZIP was extracted without source reconstruction and passed its own strict `tsc --noEmit && vite build`.
- That exported application passed actual 1440×1000 light and 390×844 dark browser flows: upload unique domains, select a color/date format, change a preference, save, reset an unsaved name and navigate away/back. Both retained the saved values; root scroll width equalled the viewport and there were zero page/console errors. The mobile dark check verified the real `html.dark` and computed `color-scheme`.
- Export screenshots wait for finite toast feedback to disappear. Evidence: `pulse-settings-qa/export-{1440,390}.png`, `export-verify.json`, `download.json`, `build-final.log` and `export-build.log`.

## Deliberate differences and remaining limits

- Bricklane uses its original mark, local original portraits and decorative panel, and `help.bricklane.example`. Original reference logos, avatars and premium illustrations remain excluded from the app and ZIP.
- The reference's Upgrade to Pro badge is omitted because these demonstration controls are available locally; no payment gate is implied.
- Save retains values during navigation in the running local demonstration. Server persistence, email-domain enforcement and portal deployment are outside this template preview.
- The settings color is a saved desk branding preference; it does not replace the site's separate global appearance setting. The exported site's global theme application is preserved and tested independently.
- Shared shell font, breadcrumb and sidebar differences are outside this narrow Settings batch. The result is closer to the reference, not a claim of pixel-identical reproduction.
- Browser validation covers Chromium and the two viewports above; other engines and server-backed settings were not tested.
