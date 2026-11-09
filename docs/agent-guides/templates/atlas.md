# Atlas — agent pattern guide

> Catalog ID: `atlas` · Family: `business` · Category: `Dashboard` · Verified against local source: 2026-11-09 (`base-nova`)

Reference: [Atlas admin preview](https://atlas-admin.reui.io/)

## Purpose

Use Atlas as a reference for a multi-section admin workspace: a persistent application shell, compact dashboard metrics, data-heavy sections, nested user navigation, and account settings that keep their route state.

Use this guide to locate and understand the current implementation. The live code and catalog are authoritative if they change.

## Find it in the catalog and renderer

Atlas is a **full template**, not an entry in the block catalog:

1. `src/templates/catalog.ts` defines its ID, name, family, features, and reference URL.
2. `src/templates/renderer.tsx` wraps templates in a loading boundary and dispatches by family.
3. `src/templates/business/app.tsx` maps `id === "atlas"` to `Atlas`.
4. `src/templates/business/atlas.tsx` composes Atlas navigation and page content.

Search `src/data/catalog.json` for individual reusable blocks. Its IDs and categories do not define the Atlas template's internal routes.

## Page structure

`Atlas` supplies a shared `Shell` with a sidebar, account control, breadcrumb, page actions, and footer navigation. The main content switches among these regions:

| Section                          | Owner                        | Composition pattern                                                                                                   |
| -------------------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Dashboard / Reports              | `atlas.tsx`                  | Four compact metric cards, two chart panels, a wide node-load panel with an active-lanes list, and a timesheet table. |
| Deals / Products / Billing       | `atlas.tsx`                  | Focused `Panel` with a `DataTable`; row selection or export stays local to the demo.                                  |
| Users                            | `atlas-users.tsx`            | Members/invitations tabs, search, a data grid, and add/invite dialogs.                                                |
| Roles, Access Control, Audit Log | `atlas-access.tsx`           | Separate focused surfaces backed by local React state.                                                                |
| Profile, Security, Preferences   | `atlas-account-settings.tsx` | Settings navigation and forms backed by the account settings model.                                                   |

The shell delegates shared sidebar behavior and common surfaces to `src/templates/business/shared.tsx`. Atlas-specific shell details live in `atlas-shell-chrome.tsx` and `atlas-shell-chrome.css`; settings geometry is in `atlas-account-layout.css` and `atlas-account-settings.css`. The shared business theme is in `business.css`.

## Patterns worth adapting

- **One shell, many sections.** Keep the sidebar, account menu, breadcrumb, and content frame stable while changing the active section. `Shell` is a composition point; do not recreate its sidebar or mobile sheet inside a page.
- **Separate navigation state from section state.** `atlas.tsx` owns the active page. `atlas-account-route.ts` and `atlas-account-route-model.ts` preserve profile/security/preferences in the current hash route and keep links inside the template mount.
- **Split dense dashboard content by task.** A short metric row precedes paired charts; a wide operational panel and table follow. Each `Panel` owns its heading, supporting text, action, and body.
- **Keep related controls with their section.** Users, role permissions, access rules, and audit records have separate implementations and state owners instead of one giant conditional form.
- **Respect responsive shell ownership.** The shared `Shell` and installed ReUI sidebar own desktop collapse and mobile navigation. Atlas-specific CSS adjusts only the shell placement and content geometry.

## Source map

| File                                                                                                                      | Read it for                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| `src/templates/business/atlas.tsx`                                                                                        | Active section routing, page composition, demo dashboard, and page-level actions.                        |
| `src/templates/business/shared.tsx`                                                                                       | Shared business shell, ReUI sidebar composition, header, and common `Panel`/`Card`/`DataTable` surfaces. |
| `src/templates/business/atlas-shell-chrome.tsx`                                                                           | Account dropdown and footer navigation.                                                                  |
| `src/templates/business/atlas-users.tsx`                                                                                  | Member and invitation layout and local interactions.                                                     |
| `src/templates/business/atlas-access.tsx`                                                                                 | Role, access, and audit interfaces and their state hooks.                                                |
| `src/templates/business/atlas-account-settings.tsx`                                                                       | Settings sections and forms.                                                                             |
| `src/templates/business/atlas-account-settings-model.ts`                                                                  | Draft/saved profile state, validation, preferences, avatar lifecycle, and callbacks.                     |
| `src/templates/business/atlas-account-route-model.ts`                                                                     | Pure hash parsing and href composition for settings sections.                                            |
| `src/templates/business/atlas-account-route.ts`                                                                           | Browser subscription to hash/popstate and settings navigation.                                           |
| `src/templates/business/atlas-account-layout.css`, `atlas-account-settings.css`, `atlas-shell-chrome.css`, `business.css` | Atlas-specific geometry and shared business-theme styling.                                               |

Follow imports from these files only as needed for the task; do not copy the whole business template family to reuse a single pattern.

## Demo boundaries

Atlas is a visual/local demo. The following are not production contracts:

- Dashboard values, rows, member names, invitations, permission scopes, role grants, audit events, billing rows, and product data are fixture data.
- User, role, access, and settings changes are local React state. They do not authorize a user, call a backend, persist to an account, or enforce access control.
- CSV export and feedback toasts demonstrate local interactions; they do not prove a remote export or a persisted operation.
- `atlas-account-settings-model.ts` owns drafts and validation in the example. Its profile/settings callbacks are extension seams, not evidence of a server API.

When adapting Atlas to an application, source records and actions from that application's contracts. Enforce authorization in the backend and represent loading, empty, and error states for each real data region.

## Adaptation sequence

1. Find the Atlas record in `src/templates/catalog.ts`; confirm the relevant page in `atlas.tsx`.
2. Read the owning source file from the map above and follow only the components it needs.
3. Keep the useful structure (shell, section boundaries, content hierarchy); bind real routes, data, permissions, and actions from the host application.
4. In Start Next, use `base-vega` components and tokens. Atlas uses `base-nova` and its Bricklane business styles; do not copy its `bt-*` classes as host styling.
5. Preserve mobile navigation and keyboard behavior through the host's installed sidebar/menu components.
6. Check loading, error/retry, empty/action, permission-denied, and populated states for every real data region; verify at narrow and wide viewports and in both themes.

## Related local records

- Template metadata: `src/templates/catalog.ts` (`atlas`).
- Existing Atlas and business-shell audits under `docs/` are dated implementation evidence. Read them only when their scope matches the current change; verify every claim against current source.
- For a block pattern, return to `src/data/catalog.json` and the block-specific source tree instead of treating this template guide as a component API.
