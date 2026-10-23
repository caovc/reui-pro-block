# REUI Blocks implementation plan

Reference snapshot: https://reui.io/blocks, 2026-10-22. Public navigation reports 662 blocks, 78 categories, seven groups. The generated catalog records every public block title, id and reference URL.

## Scope and provenance

Rebuild public preview layouts independently using shadcn/ui and MIT ReUI primitives only. Do not obtain or redistribute Pro source, premium icons or premium assets. Keep the site explicitly independent, with a reference link for comparison. MIT notices accompany installed code. The public catalog is a checklist, not proof of pixel fidelity; record implementation and fidelity honestly.

## Architecture

React + TypeScript + Vite + Tailwind v4; shadcn Radix primitives, Lucide icons. Hash routes work on GitHub Pages without server rewrites. Site shell follows REUI's neutral palette, compact navigation, pill filters, miniature category previews, and generous preview canvases. Individual views offer live preview, actual source, copy/download, desktop/tablet/mobile width, reset, favorites and dark mode. Local state handles all demo actions. No credentials or backend required.

## Workstreams

1. Foundation/site (primary): install shadcn, generate public metadata, registry, responsive preview browser, source viewer, search/favorites/theme, documentation and Pages deployment.
2. Application (agent): all 23 application categories, 305 public entries; authentication, shells, forms, cards, calendars, boards, dialogs and settings.
3. Data/AI/solutions (agent): data grid, charts, AI & agents, solutions; tables with sorting/filtering/editing, chart variants, chat and industry surfaces.
4. Marketing/commerce (agent): all marketing and ecommerce categories; real product/cart/filter/form/pricing/FAQ interactions.

## Sequence

- [x] Inspect empty checkout and official public catalog/license.
- [x] Install foundation and commit this plan.
- [x] Generate exact category and block checklist.
- [x] Parallel implementation with file ownership and shared interfaces.
- [x] Integrate every public entry; expose source dependencies.
- [x] Validate types/build/lint and catalog coverage.
- [ ] Browser QA: search, category navigation, every category renders, theme, mobile, favorites, code copy and demo actions.
- [ ] Fix visual/runtime issues, document fidelity limitations.
- [ ] Create public repository under authenticated GitHub account; deploy GitHub Pages via Actions; verify live URL.

## Acceptance

No dead routes, no premium code/assets, no decorative non-working primary actions. Every entry has a reference, working preview and real implementation source. Coverage totals come from generated metadata. Responsive site at 390px and 1440px; theme persists; filters/favorites survive intended navigation; deep links load on Pages. Browser checks include representative interactions plus exhaustive route render smoke checks. Report layout-family reuse and remaining reference differences plainly.

## Fidelity gate

Full completion additionally requires per-entry functional and visual comparison with public previews. Working family dispatch is an intermediate milestone. Track the remaining scope in docs/FIDELITY.md; keep the goal active while those checks or material gaps remain.
