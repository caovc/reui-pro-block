# Official free REUI reuse

The project now checks the official free registry and examples before implementing a Pro composition. Actual implementation reuse, visual comparison and runnable source exports are separate gates. Adding a dependency or changing an import label is not proof of a migrated page.

## Shared source and license

Official free registry: https://reui.io/r/radix-nova/{name}.json. Configuration is in `components.json`. Full upstream MIT notice: `src/components/reui/REUI-LICENSE.txt` (Copyright 2025 Keenthemes Inc). Source files retain provenance; local compatibility changes must be recorded. Free primitives are distinct from Pro block source, which is not included.

## Primary coordinator's concrete corrections

| Consumer | Actual free implementation reused | Replaced duplication / retained domain work |
| --- | --- | --- |
| Source viewer | `CodeBlock`, `CodeBlockHeader`, `CodeBlockCopyButton`, `CodeBlockDownloadButton`, `CodeBlockWrapToggle` | Replaces the custom Prism line renderer and custom clipboard/download/wrap state. Retains catalog-specific source dependency traversal and file selection. Upstream source was installed by the parallel planning coordinator; only its unused `foldable` destructuring was removed for the project's strict TypeScript configuration. |
| Auth 1–4 | Official `Alert`; Auth4 `Frame` with direct `FramePanel` | Confirmation UI uses the actual semantic alert variants. The framed login uses upstream concentric radius/border variables and panel implementation, replacing a manually layered Card frame. Branding, independently drawn artwork and local login/reset/account demo state are application composition; the free catalog has no complete authentication service. Stock Button/Input/Field/Dialog remain upstream shadcn dependencies, not falsely described as REUI implementations. |
| Whiteboard 1–2 | Official `NumberField` / `NumberFieldGroup` / `NumberFieldInput` / decrement/increment | Replaces handwritten zoom increment/decrement and input boundary handling. Uses upstream locale-aware percent parsing, stepping and clamping. The free registry has no whiteboard drawing/scene-graph primitive; the SVG scene renderer, pan, drawing history and SVG exports remain custom. The free Kanban primitive controls DOM sortable lists, whereas these notes/cards are movable shapes in the same SVG world; its existence is not ignored or described as missing. |
| Card1–15 | Actual `Frame`/`FramePanel`/headers/footers, `IconTile`, `Badge` | Replaces the custom Frame/IconTile surface wrappers. Exact inverse and stacked variants are exercised; application records, decorative geometry and local business actions remain composed content. See the application ledger for each entry's free reuse and remaining visual differences. |
| Downloaded starters | Recursive free-component source collection plus the upstream MIT notice | `source.ts` now includes ReUI nested TS/TSX/CSS and shared hooks; the ZIP includes `REUI-LICENSE.txt` and asset notices. Renaming imports without including their implementation would fail this gate. |

The next integrated milestone reuses actual free `Rating`, `Frame`, `NumberField` and `Badge` in Product Card1–10, Product Detail1–6 and Product Grid1–6. It replaces duplicated rating, frame and quantity controls. Gallery/review rails still need the available free Carousel composition; their remaining migration is explicitly recorded rather than described as a missing library feature.

Charts reuse the official free c-chart1/2/3/8/12/19–22/25 patterns with actual Recharts Bar, Rectangle, Pie, Sector, Label and RadialBar implementations, plus free Frame/Badge chrome. These replace handwritten bar/pie/radial geometry where the free library supplies the corresponding behavior. Domain-specific rose radii, slope/Sankey paths, liquidity clock and brush/log annotations remain custom extensions; the data ledger identifies these gaps and geometry differences. The combined frozen production candidate passed 192 tests. Real Product Detail4 and Product Grid6 ZIPs include nested photos, component sources and notices, and build independently.

Other coordinators own DataGrid, shell, template, schedule and pricing migrations. Their per-entry ledgers must identify actual consumers; this document does not certify those unfinished batches.

## Verification of this consumer milestone

The isolated production build passes. 32 focused tests cover Card1–15 at two widths and its business actions, auth1–4, the existing whiteboard editing/panning regressions, CodeBlock file selection/copy/download/wrap, NumberField input/clamping/reset, and website controls. Two real exported starters (Auth4 and Whiteboard1, 88 files each) include the upstream MIT notice, build independently, retain 14px shared body styling, and render at 1440px and 390px with no runtime errors, broken images or document overflow. Dependencies were reused from the installed lockfile environment.

The earlier 148-test candidate passed before these source-reuse corrections. It is baseline coverage, not a substitute for the focused migration verification or per-entry visual fidelity.

## Next consumer milestone

Card16–35 now consume the existing official free Frame/IconTile/Badge/Alert/NumberField implementations and upstream Item/AspectRatio rather than the generic family fallback. Dialog, menu, practice-trade quantity, local edit/removal/Undo and clipboard actions are composed around those implementations; the two card ledgers enumerate per-entry differences. Auth5/7 use actual Frame/FramePanel, Alert and Badge with stock REUI-listed Field/InputGroup. Their gradients, blueprint construction marks, independently written marketing text and local authentication demo states remain composition; exact brand wordmarks are still pending.

The next bar migration replaces HourColumns and Transit manual bars with the actual free c-chart1/2/3/4/12 BarChart/Bar/Rectangle primitives, retaining domain-specific selection/annotation overlays. Checkout1–7 and Cart1–7 use the actual official Stepper/NumberField/Frame/Badge/Alert/IconTile sources and the official free Breadcrumb composition. Payment, coupon, account and fulfillment data remain local demo behavior; no payment or authentication service is implied. See the checkout/cart ledgers for documented photo and rounding differences.

Final integration: production TypeScript/Vite build and 98 browser tests passed. Actual UI-downloaded Auth7/Card24/Checkout5 starters (175/175/104 files) independently built and rendered at 1440/390px without errors, broken images or overflow. The preceding deployed Commerce/Charts batch additionally passed all 37 dedicated tests on GitHub Pages.
