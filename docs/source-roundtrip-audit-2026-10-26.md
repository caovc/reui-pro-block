# Source round-trip audit and copy feedback

Audited on 2026-10-26. The user-facing goal is to show the complete actual block implementation by default and make viewing, copying, single-file download and the runnable archive agree.

## Findings and narrow changes

1. After copying one source file, changing the Source file selection left the new document's button labelled “Copied” for the old button's acknowledgement interval. The clipboard correctly still contained the previous file. Reproduced with Navbar 11's `design.tsx` → `data.ts`; this is misleading feedback, not evidence that the new file had been copied.
2. The same issue occurred for Theme CSS when another same-origin tab changed the global accent: the displayed CSS and preview changed to Rose while the button still acknowledged the previous CSS.

`CodeViewer` now gives the actual free `CodeBlockCopyButton` the selected filename as its React identity. `SourcePanel` computes `themeCode` once and uses that same string for the actual CodeBlock document and the copy button's identity. Only acknowledgement/error state resets when the copied document changes. Wrap preferences, file selection, syntax rendering, clipboard writes and downloads retain their existing implementations. Changing selection or theme never writes to the clipboard without a copy action.

## Actual free component reuse

The site already consumes the vendored, MIT-licensed official ReUI Code Block implementation, including `CodeBlockHeader`, `CodeBlockCopyButton`, `CodeBlockDownloadButton` and `CodeBlockWrapToggle`. Those implementations remain in use and are not edited or replaced. Existing Select, Sheet, Dialog and Button primitives continue to provide the compositions and accessibility behavior. The only custom behavior is the host's knowledge of which file or CSS document is current; a generic code block cannot infer the file selector or the cross-tab theme store identity. No duplicate copy, download, highlight or focus implementation is introduced.

## Source matrix

The clean production baseline is `3f7d0246c3d7bea010b6b0994db7565f5b763ec0`, extracted from Git rather than the shared working tree. Changes through `9e75a42` were inspected and belong to separate Activity, Comparison, routing and audit batches. The two owned surfaces have no concurrent changes from those batches.

Each row checks the actual default selected implementation, every rendered source line, the entire clipboard string, the downloaded file and the exact source bytes inside the browser-downloaded ZIP. The audit then selects a supporting TypeScript file and repeats clipboard/download/ZIP equality. File lengths and archive counts describe this tested baseline, not future archive sizes.

| Block           | Default actual implementation                                        | Lines | UTF-8 bytes | ZIP files |
| --------------- | -------------------------------------------------------------------- | ----: | ----------: | --------: |
| ai-chat-4       | `src/blocks/data/ai-chat-quote-sidebar.tsx`                          |   423 |       14792 |       245 |
| ai-chat-5       | `src/blocks/data/ai-chat-connected-apps.tsx`                         |   383 |       15365 |       245 |
| ai-chat-6       | `src/blocks/data/ai-chat-task-panel.tsx`                             |   542 |       20919 |       245 |
| navbar-10       | `src/blocks/application/navbar-variants/developer/api.tsx`           |   150 |        5775 |       371 |
| navbar-11       | `src/blocks/application/navbar-variants/developer/design.tsx`        |    55 |        2086 |       371 |
| navbar-12       | `src/blocks/application/navbar-variants/final-bars/marketing.tsx`    |    56 |        2077 |       371 |
| navbar-13       | `src/blocks/application/navbar-variants/final-bars/editor.tsx`       |   106 |        4506 |       371 |
| category-card-4 | `src/blocks/commerce/category-card-variants/featured-department.tsx` |   147 |        6652 |       200 |
| category-card-5 | `src/blocks/commerce/category-card-variants/collection-guides.tsx`   |   125 |        5716 |       200 |
| category-card-6 | `src/blocks/commerce/category-card-variants/seasonal-categories.tsx` |    92 |        4489 |       200 |

All ten rows passed before and after the filename acknowledgement fix. The source panel emitted no page errors. The first selected files are actual implementation modules rather than generated usage stubs or family dispatchers. Complete original content, including imports and local data, is preserved.

The first online probe returned older `ai.tsx`, `workspace.tsx` and `catalog.tsx` defaults because Pages was still serving an earlier successful deployment (`56229f5`), while newer batches were awaiting CI/deployment. That result is retained as deployment evidence; it is not treated as a regression in the newer source mappings, and no mapping was changed by this batch.

## Archive dependencies, licenses and real builds

The eleven actual archives (ten matrix rows plus Auth 20 for the theme probe) were walked from `src/main.tsx` and `vite.config.ts` using the TypeScript AST, with local CSS imports and URLs also followed. All local transitive dependencies resolved in the archives; imported external packages were present in their package manifests. Reachable file counts were 189, 236 or 356 according to the family. All eleven retain the ReUI MIT notice, repository license, third-party notices and the Inter OFL notice alongside the bundled Inter font.

Three representative real browser downloads were extracted and independently built using their unmodified generated sources/configuration; only the existing installed dependencies were linked:

- AI Chat 6: 245 files; TypeScript + Vite build passed.
- Navbar 13: 371 files; TypeScript + Vite build passed.
- Category Card 6: 200 files; TypeScript + Vite build passed.

The audited Category Card 4–6 images are generated by the actual local `wishlistArtwork` → `svgImage` helpers; those source helpers and their collection data are included in the downloaded archive. The audited AI Chat and Navbar leaves use local text/icon compositions rather than downloaded ReUI reference imagery. This checks the relevant original-artwork paths and dependency/license packaging; it does not certify per-entry visual fidelity or every unrelated decorative asset included by a family-wide bundle. This batch adds no assets, packages, component routes or source-target mappings.

## Theme artifact contract

The current design exports the starter and current custom theme as separate artifacts. `SourcePanel` explicitly instructs the user to append the downloaded theme CSS after the starter theme and to apply the `dark` class for dark mode. The generic starter deliberately starts with its original appearance; this batch does not silently change that design.

The actual probe used Emerald, square corners, Serif body text, Mono headings and dark mode. The CSS download matched the live `#preview-preset` string byte-for-byte. The original starter rendered its default neutral palette, 0.625rem corners, light mode and Geist body. After applying the exact downloaded CSS and the documented root `dark` class, its computed primary (`#047857`), radius (`0rem`), dark class and body font (`Georgia, serif`) matched the preview. Both standalone renders had no page errors. Native browser color-scheme behavior and every other font/mode combination were not exhaustively compared.

## Regression evidence

Browser plugin not available; the repository's Playwright/Chromium workflow was used. The two new cases use the existing 30-second test window and existing assertion defaults. No timeout, retry or old assertion was increased or weakened. Both new cases failed on their respective unfixed surface because the immediate label was “Copied”; they do not poll until the old acknowledgement expires.

- Before the CSS follow-up, the filename fix passed 20 production cases: new source-copy regression, `source-preview`, `refined-source-default`, `source-navigation` and `docs-preview`.
- After the CSS follow-up, both final production regressions passed (2/2, 4.7s). The filename case proves immediate label reset, unchanged previous clipboard until explicit new copy, retained wrap preference, complete rendered content and exact source/ZIP bytes. The cross-tab theme case proves immediate CSS acknowledgement reset plus exact current CSS copy/download equality. The earlier 19 compatibility cases were not repeated after this final CSS-only acknowledgement change.
- The catalog-wide source selection checks passed 2/2 Node tests.
- Scoped oxfmt and oxlint passed. Final strict candidate build status is recorded in the handoff manifest.

Original before-fix failures and traces remain under `/tmp/bricklane-source-copy-feedback-before/` and `/tmp/bricklane-theme-copy-feedback-before/`. The successful source matrix and SHA-256s are `/tmp/bricklane-source-audit-candidate/results.json` and `/tmp/bricklane-source-audit-after/results.json`; archive dependency/build records are in `/tmp/bricklane-source-audit-candidate/`. The documented theme comparison is under `/tmp/bricklane-source-roundtrip-audit/`. Screenshots, downloads, logs and temporary scripts remain outside the repository.

Root owns the serial Git publication window. This batch is handed off as two surface files, one dedicated regression test file and this audit; CI/Pages success and online checks remain separate release steps.
