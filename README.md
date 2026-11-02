# Bricklane

Independent recreations of **ReUI Pro Blocks and Templates**, built with React, TypeScript, Tailwind CSS and official open-source ReUI components. Bricklane uses an original logo, name, and locally authored demo illustrations. The local development checklist contains **673 entries, 79 categories, 7 groups**, plus **18 template workspaces**. The 2026-11-02 public audit verified all **672 official block IDs** against the sitemap, full public metadata and all 79 category pages. All 672 short display titles match the local catalog; the only extra local entry is retained legacy `solution-dev-ops-7` (Deploy Board). See the [public catalog audit](docs/public-catalog-audit-2026-11-02.md) and [dated response evidence](docs/public-catalog-audit-2026-11-02.json). Metadata coverage does not establish visual or interaction fidelity.

> This is an independent recreation using shared layout families. Catalog coverage is not a claim of 673 pixel-identical copies. No REUI Pro source or premium assets are distributed. See [provenance](THIRD_PARTY_NOTICES.md) and the implementation notes in `docs/`.

## Explore

- Category gallery with actual rendered component thumbnails
- Name/category search and Cmd/Ctrl+K quick search
- Interactive previews with desktop, tablet and phone viewports
- Actual TypeScript source with syntax highlighting, file selection, copy and download
- Source bundle download including the entry wrapper and local dependencies
- Light/dark theme, preview accent and radius customization
- Persistent favorites and hash deep links compatible with GitHub Pages
- Stateful local demo interactions (no paid APIs or backend required)
- **Templates**: 18 distinct full-page demo workspaces, with category filters, search, live thumbnails, and direct routes at `#/templates/:id`
- Template source viewer and runnable ZIP exports, including the selected template family's local dependencies

## Templates

Open `#/templates` from the top navigation or sidebar. The collection covers Mesh, Flowly, Echo, Verve, Limelight, Manifest, Lucent, Overture, Atlas, Tempo, Miro, Cohort, Filespace, Roster, Pulse, Surge, Filebox, and Flux. Each template opens outside the block browser in its own workspace; the slim preview toolbar provides a return link, source view, theme switch, and original preview link.

These are independent React implementations based on the public previews. They preserve the main visual structure and provide local demo interactions. They are not the original premium projects or complete replacements for their server-side features: authentication, AI responses, invitations, email delivery, and production data services require your own backend. Laravel/Next.js/TanStack server architecture is not reproduced.

Surge and Manifest include store settings, team, payments, notifications, billing, locations, and suppliers. Miro includes profile, clinic configuration, billing, and notification preferences. Verve includes account, workspace, people, billing, integrations, API keys, and webhooks. These settings use actual free ReUI compositions with local validation and session state; source view and runnable exports include their implementations and licenses. See [settings implementation and verification](docs/templates-settings-release-2026-10-29.json). These local demos add plan changes, cancel/resume, saved payment-method selection and provider connections to Surge/Manifest; Verve adds member view/edit/delete, validated CSV import, plan/seat changes and calendar connection drafts. These actions use local demo state. The [catalog follow-up record](docs/catalog-followup-plan-2026-10-26.md) distinguishes site checks, actual downloaded-project acceptance and deployment status.

## Current fidelity checks

The current candidate forwards Tabs orientation to the native Radix primitive. Advanced 3 and 4 use the actual free ReUI `c-tabs-7` composition with Badge, preserving their existing grid actions and state. App Shell 2 uses the existing compact SearchForm, and App Shell 18 uses the existing Progress implementation. Mesh keeps document refresh separate from canvas state, and Pricing uses the actual ReUI Badge composition. These changes reuse the existing free implementations; domain state and demo data remain local.

Scoped validation passed 64 affected site cases, 14 Mesh cases, 14 source/export cases and 2 Pricing cases. Seven actual downloaded projects passed their original strict builds and 27 native cases; an additional Mesh font case checked the real font response and loaded text. The [follow-up record](docs/catalog-followup-plan-2026-10-26.md) preserves the original failures, environment preparation and export-theme limits. This is scoped validation, not a claim that all 673 blocks are pixel-identical. The Store source correction also passed 11 necessary checks on the original product input and 7 checks on this candidate with 3 workers. The new source suite passed 14 cases with 3 workers. See the [local acceptance record](docs/fidelity-navigation-tabs-release-2026-11-02.json). The next full CI and Pages deployment remain pending.

## Development

Requires Node.js 24+ and npm.

```sh
npm ci
npm run dev
npm run build
npm run lint
npm run test:site
npm run test:catalog
npx playwright test tests/templates.spec.ts tests/template-interactions.spec.ts
```

Browser tests require Chromium (`npx playwright install chromium`). `PREVIEW_URL` can target an already running local or deployed server. Catalog smoke tests exercise all 673 individual preview routes; site tests exercise navigation, search, responsive controls, theme persistence, favorites, source view and downloads.

## Project layout

- `src/data/catalog.json`: local implementations and the verified 2026-11-02 public metadata, plus one retained legacy example
- `src/blocks/application`: application layout families
- `src/blocks/data`: data grids, charts, AI and solution layouts
- `src/blocks/commerce`: commerce and marketing layout families
- `src/components/ui`: shadcn component source generated through its CLI
- `src/components/site`: source viewer and collection interface
- `src/templates`: template catalog, preview routing, source export, and three implementation families
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
