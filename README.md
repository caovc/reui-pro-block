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

Scoped validation passed 64 affected site cases, 14 Mesh cases, 14 source/export cases and 2 Pricing cases. Seven actual downloaded projects passed their original strict builds and 27 native cases; an additional Mesh font case checked the real font response and loaded text. The [follow-up record](docs/catalog-followup-plan-2026-10-26.md) preserves the original failures, environment preparation and export-theme limits. This is scoped validation, not a claim that all 673 blocks are pixel-identical. The Store source correction also passed 11 necessary checks on the original product input and 7 checks on this candidate with 3 workers. The new source suite passed 14 cases with 3 workers. See the [local acceptance record](docs/fidelity-navigation-tabs-release-2026-11-02.json). These changes subsequently passed the full CI on `4490ce2`, which was deployed to GitHub Pages on 2026-11-02. See the dated records for the earlier failed runs.

Surge and Manifest notification preferences now compose the actual free ReUI DataGrid, native ScrollArea and table. Natural columns fit the phone viewport; the existing Checkbox stays centered and retains keyboard focus through state changes. Four enhanced site cases and two actual downloaded projects passed (original strict builds and 31 native cases), with source/copy/file/ZIP verification. See the [merchant notification acceptance record](docs/commerce-notification-datagrid-release-2026-11-02.json). Its complete CI and exact GitHub Pages deployment succeeded on `4490ce2` (2026-11-02). Later milestones retain separate CI and deployment gates.

Document Editor now composes the actual free ReUI Frame and ColorPicker with native Tiptap formatting, links, task checkboxes, read-only mode and live counts. Explicit native history boundaries keep heading/alignment Undo separate from typing. Two actual downloaded projects passed their original strict builds and 18 native cases; a separate Mesh case verified real font responses. Source view, copy, single-file download and fresh ZIP closure were checked. See the [editor foundation acceptance record](docs/editor-foundation-release-2026-11-02.json). Advanced tracked review, collaboration synchronization, Wiki contextual controls and the Assistant review dock remain unfinished; this milestone does not claim all five editors are complete. Its full CI and GitHub Pages deployment subsequently succeeded on `129c17d` (2026-11-02).

AppShell1 collapsed navigation uses the actual free ReUI sidebar menu at 192px, retaining native keyboard selection, Inter typography and focus return. Shell2 keeps its default 128px menu. Both site cases, three source/copy/download checks and one unmodified downloaded starter (strict build plus its native Shell1 case) passed. See the [collapsed-menu acceptance record](docs/appshell-collapsed-menu-release-2026-11-02.json). New full CI and Pages deployment remain separate gates.

API Request Logs now keeps first, reverse and cancelled touch drags on a stable native chart target. Existing free ReUI chart/Tooltip behavior, mouse drag, keyboard controls and exact request filtering remain. Four site cases, two source/export cases and seven native cases in an unchanged downloaded starter passed, along with both strict builds. See the [Base9 touch acceptance record](docs/grid-base9-touch-release-2026-11-02.json) for the retained failed candidates and input-contract correction. New full CI and Pages deployment remain separate gates.

Surge and Manifest now share the existing project Account view, composed with official free ReUI Frame/upload and supporting native controls, with Profile/Preferences/Security navigation, actual photo upload, theme, local sign-out/default-view handoff and tooltip/motion preferences. Both unchanged downloaded projects passed original strict builds. Their first native run was33 passed/1 failed; after fixing native mount readiness in the test, the necessary original case passed, completing incremental coverage of34 distinct scenarios. See the [Account acceptance record](docs/commerce-account-release-2026-11-02.json) for source/download verification, retained failures and four still-unconsumed preferences. The preceding chart commit `0b57980` passed all 2017 CI cases and exact Pages deployment; this new Account milestone awaits its own CI and deployment.

The first Account full CI passed2089 of2093 cases, including all76 new Account cases; Pages was skipped after four older source/layout checks failed. Retail source verification now uses independent complete file lifecycles and natural download readiness. Mobile layout checks follow the intentional merchant no-close header while retaining existing navigation/focus behavior. All nine necessary cases passed on the unchanged production build. See the [CI source/layout correction record](docs/ci-account-source-layout-release-2026-11-02.json); a new exact-commit full CI and Pages deployment remain pending.

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
