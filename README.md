# REUI Blocks

An independent, interactive block collection built with React, TypeScript, Tailwind CSS and shadcn/ui. The public REUI catalog snapshot is used as the development checklist: **662 entries, 78 categories, 7 groups**.

> This is an independent recreation using shared layout families. Catalog coverage is not a claim of 662 pixel-identical copies. No REUI Pro source or premium assets are distributed. See [provenance](THIRD_PARTY_NOTICES.md) and the implementation notes in `docs/`.

## Explore

- Category gallery with actual rendered component thumbnails
- Name/category search and Cmd/Ctrl+K quick search
- Interactive previews with desktop, tablet and phone viewports
- Actual TypeScript source with syntax highlighting, file selection, copy and download
- Source bundle download including the entry wrapper and local dependencies
- Light/dark theme, preview accent and radius customization
- Persistent favorites and hash deep links compatible with GitHub Pages
- Stateful local demo interactions (no paid APIs or backend required)

## Development

Requires Node.js 24+ and npm.

```sh
npm ci
npm run dev
npm run build
npm run lint
npm run test:site
npm run test:catalog
```

Browser tests require Chromium (`npx playwright install chromium`). `PREVIEW_URL` can target an already running local or deployed server. Catalog smoke tests exercise all 662 individual preview routes; site tests exercise navigation, search, responsive controls, theme persistence, favorites, source view and downloads.

## Project layout

- `src/data/catalog.json`: exact reference snapshot with titles, ids and URLs
- `src/blocks/application`: application layout families
- `src/blocks/data`: data grids, charts, AI and solution layouts
- `src/blocks/commerce`: commerce and marketing layout families
- `src/components/ui`: shadcn component source generated through its CLI
- `src/components/site`: source viewer and collection interface
- `docs/CATALOG.md`: full reference checklist
- `docs/plans/2026-10-22-reui-blocks-design.md`: development and release plan

## Reusing a block

Open a block, choose **Code**, and select its wrapper or implementation file. **Download source** saves a runnable ZIP starter with the wrapper, local dependencies, demo images, theme and Vite configuration. Extract it, run `npm install`, then `npm run dev`. The entry is `src/Example.tsx`. Local demo state should be replaced with your application data and services.

## Deployment

The GitHub Actions workflow builds `dist` and publishes through GitHub Pages. The Vite relative base and hash routing support repository subpaths and direct preview links. In repository Settings → Pages, use **GitHub Actions** as the build source.

## References and licenses

- [REUI public blocks](https://reui.io/blocks)
- [shadcn/ui](https://ui.shadcn.com)
- [REUI free vs paid materials](https://reui.io/legal/license)

Independent code is MIT licensed. Retain the third-party notices when redistributing.
