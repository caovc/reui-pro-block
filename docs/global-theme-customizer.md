# Global theme customizer

Implemented on 2026-10-23 for the user’s request to make the preview customizer closer to ReUI and apply globally.

## Visible behavior

The global Customize button is available in the site header and template toolbar. A compact, full-height left rail replaces the category sidebar on desktop; phones use the existing modal Sheet, including focus containment and Escape/trigger focus restoration. The panel follows the public ReUI reference’s small labels, selected values, right-side icons/swatches, pop-out options and pinned preset actions. It uses Bricklane’s original branding and loads no ReUI reference media.

Settings apply to site chrome, catalog miniatures, component iframes, template workspaces and template thumbnail iframes. A shared React store keeps routes consistent, while storage events synchronize other open same-origin tabs and frames. Changing appearance does not remount interactive block previews. Explicit preset links apply the shared theme; Open preset also accepts a copied link or theme JSON and validates it before application. Reset preserves the original component tokens through genuine Default options.

Controls cover base palette, accent and custom HEX, chart palette, heading/body fonts, radius, menu appearance, menu accent, and light/dark/system modes. Inter is loaded from the existing local, OFL-licensed font asset. Menu appearance targets the host navigation and official sidebar menu buttons. Explicit global fonts also override the template/reference font scope; explicit theme colors bridge Limelight’s local accent token. Decorative artwork and chart series with fixed, nonsemantic colors retain those colors.

Radix UI, Nova and Lucide identify the installed foundations. They are not presented as fake switches to unimplemented primitive libraries, alternate component styles or icon sets.

## Actual reuse and project glue

- Official free ReUI Frame / FrameHeader / FramePanel organize the customizer.
- Official free ReUI Color Picker provides the actual HEX, hue, saturation and keyboard color editing behavior.
- Existing Select, Sheet, Dialog, Input and Button primitives supply the same building blocks used by ReUI’s free registry compositions. No substitute select, color editor or focus trap was written.
- The former preview-only settings state, duplicate dark preference handling and inline customizer layout have been removed. The host store, theme token generation, preset import and cross-document synchronization are site-specific glue.
- SourcePanel still receives the same current `PreviewTheme` and uses `themeCSS(theme)` for its displayed/copied/downloaded CSS. Component implementation/source-target mappings are unaffected by the host-only modules.

## Verification

The test flow is: open Customize → change settings → navigate among catalog, block and template pages → confirm all surfaces retain the same theme; open another same-origin tab → confirm live synchronization without losing input; import a preset and reject invalid input; close the mobile Sheet and restore focus.

`tests/global-theme.spec.ts` covers these shared-state flows, active menu styling and the mobile keyboard interaction. Existing documentation, site, source navigation and all 18 template tests cover compatibility, including original default fonts and standalone geometry. Browser plugin unavailable; validation uses the repository’s Playwright/Chromium workflow. Screenshots and temporary comparison scripts remain outside the repository.

The frozen production snapshot passes TypeScript/Vite build, the complete format check (755 files), and lint with no errors. A real Download starter action produced an auth-20 ZIP with 285 files; the extracted starter independently passed its production build using installed dependencies. The separately downloaded theme CSS contains the active Emerald theme. Desktop 1440×1000 and phone 390×844 evidence has no page/console errors or document overflow.

The production direct-scope first run completed 40/41 cases; its phone-source case exceeded the existing five-second source-load assertion. The broader 758-case first run completed with 754 passed, three failed and one not run: Dialog 6/7 exceeded source-load assertions, and the Data sparkline downloaded-starter build failed; the serial Application auth starter case consequently did not run. The starter test retained only `Command failed: npm run build`, so its cause is unresolved. Resource contention is a hypothesis, not an established cause. No timeout, retry or assertion was changed.

The phone-source case and both dialog-source cases passed a separate single-worker recheck (3/3). That recheck does not replace the original failures or certify the full suite as passing. All four new global-state cases passed, including the template-local accent bridge and mobile focus return. Original logs, traces, error contexts and screenshots extracted from the traces are retained at `/tmp/reui-global-theme-diagnostics/index.html`; the complete suite log is `/tmp/reui-global-theme-production-tests.log`.

## GitHub link icon follow-up

The user's follow-up replaces the misleading `GitFork as Github` alias with the official MIT-licensed Octicons GitHub mark in the host header/footer, Overture's Source link and the Contact community tile. The shared `src/components/icons/github-mark.tsx` retains the full upstream notice. Its foreground follows the surrounding light/dark text. The block source collector includes the new helper directory; source-target mappings are unchanged. Actual browser-downloaded Contact 6 (161 files) and Overture (103 files) archives both contain the helper and MIT notice. Desktop/mobile and settled dark foreground checks pass with no page errors. Scoped format and lint pass; this small follow-up has not rerun the production build or full suite and awaits Root's integrated candidate checks.
