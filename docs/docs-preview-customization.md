# Documentation preview customization and source panel

Implemented 2026-10-22. Reference: the user’s screenshots of ReUI’s Customize sidebar and Installation / Code drawer.

Every block detail page exposes **Customize** in its toolbar. The panel changes base color, accent (including the official color picker), chart palette, heading/body font, corner radius and preview mode. Settings persist locally; Copy preset link produces a portable URL, while Copy theme CSS and the source panel’s CSS download export the current preset. Shuffle and Reset operate on the live settings. The library (Radix UI), style (Nova) and icons (Lucide) describe the implementation; they are not simulated library switches.

The panel is a left rail on desktop and a two-column section above the canvas below 900px. Changes are sent to the existing isolated iframe through same-origin, parent-validated messages, preserving interactive demo state. Enum values and custom HEX colors are validated before generating CSS. Standalone previews accept the existing theme/radius/accent links as well as new preset links. Theme styles are removed when leaving an isolated preview.

**View code** opens a right-hand drawer with installation commands and the existing multi-file source viewer. The **Code** tab exposes the same content inline. Installation tabs cover pnpm/npm/yarn/bun and copy real commands for the downloaded runnable ZIP. This repository has no published Pro registry endpoint, so the UI directs readers to download/extract the starter before installing dependencies. Custom CSS is exported separately and is applied after the starter’s existing theme; starters continue to use the shared download pipeline.

## Official free component reuse

- [ReUI Frame](https://reui.io/docs/components/radix/frame): sidebar framing, header and panel.
- [ReUI Color Picker](https://reui.io/docs/components/radix/color-picker): actual HEX editing, saturation, hue slider, keyboard controls and swatch trigger. No replacement color editor was written.
- [ReUI Code Block](https://reui.io/docs/components/radix/code-block): installation shell snippets and theme CSS, with official copy/download controls. The existing `CodeViewer` (owned by the main release coordinator) supplies syntax highlighting, line numbers, file selection, wrap/copy/download.
- ReUI Badge replaces the extracted toolbar’s former stock badge.
- Existing stock Select, Tabs, Sheet, ToggleGroup and Tooltip remain the project’s primitive controls; these are the primitives used by the corresponding ReUI registry compositions.

The site-specific parts are preset persistence/validation, theme token generation, iframe synchronization, and arrangement of the documentation sidebar/drawer. No matching free ReUI preset coordinator exists in the components already installed; these glue existing components to this site’s routes and source exports. No premium implementation source was retrieved.

## Verification

`tests/docs-preview.spec.ts` checks persisted theme settings and preserved form input, portable presets, invalid values, real clipboard contents, file selection, actual ZIP downloads, Escape/focus restoration, 390px overflow, official Color Picker HEX changes and system color-scheme updates. Existing site and responsive suites also cover navigation, favorites, preview sizing and dark mode. Verification targets an isolated production snapshot so unfinished changes from other chats do not enter this release. Browser plugin unavailable; validation uses the project’s Playwright workflow. Evidence screenshots are saved outside the repository.

Release validation: the isolated production snapshot passed TypeScript/Vite build, lint for the new site files, all 140 baseline-and-feature Playwright tests, and all 16 focused documentation/site/phone-family checks. The production desktop evidence at 1600×1100 reported the expected page identity, no runtime/console errors, and no document overflow; the phone drawer was checked at 390×844. Screenshots: `/tmp/reui-doc-preview-desktop.png`, `/tmp/reui-doc-preview-code.png`, `/tmp/reui-doc-preview-mobile.png`. Tested with Chromium; no claim of every block’s custom chart/font tokens is implied.

Font compatibility follow-up: Default preserves each composition’s original typography, including locally scoped Inter. Explicit font selections also override the `.reui-reference` font tokens. A real Category Tabs FAQ regression verifies original Inter → Serif body + Mono heading → Reset to Inter. All 17 focused production tests (6 preview, 4 site, 7 responsive families) pass after this correction, and its isolated production build passes.

Default token preservation (2026-10-23): Accent, Base and Radius now default to a genuine Default option that emits no overriding tokens. This preserves the original primary/ring/sidebar colors, muted text and component radius in both light and dark previews. Explicit colors, custom HEX, base palettes and radii remain configurable. Storage v2 migrates v1’s automatically saved blue/neutral/0.625 defaults while preserving other legacy choices; explicit preset URLs and newly selected Blue remain valid. This corrects the preview layer instead of hardcoding neutral colors in individual blocks.

Default-theme release validation: isolated TypeScript/Vite build, lint and all 19 focused production tests passed. The Schedule owner independently compared the candidate with a real downloaded Schedule 8 starter: primary/foreground, ring, muted text, border/input, radius, Inter font and selected-date color matched exactly. Its 14 renders across seven pages and two widths had no page errors, overflow or missing images. This verifies default token preservation as well as explicit Blue, reset, persistence and old-storage migration.
