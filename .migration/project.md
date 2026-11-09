# Base UI project migration

2026-11-08, whole-project migration using the Base Nova registry and transformation engine.

## Changed

- `components.json`: switched shadcn style to `base-nova`, retaining Nova design tokens/classes.
- `src/components/ui/`: migrated the shared shadcn/ReUI wrapper families and removed all direct Radix primitive imports.
- `src/components/reui/`, `src/blocks/`, `src/templates/`: migrated consumers, including Base `render` composition, select/accordion/toggle/checkbox/slider value adapters, and focus callback compatibility.
- `src/components/ui/render-slot.tsx`, `src/lib/base-ui-compat.ts`: added Base UI compatibility helpers for custom ReUI composition and legacy focus handlers.
- `package.json` and `package-lock.json`: removed direct `radix-ui`, `@radix-ui/react-dismissable-layer`, and `@radix-ui/react-focus-scope` dependencies. Direct source imports remaining: 0. (Radix transitive dependencies may remain under third-party packages.)
- Build: `npm run build` passed (TypeScript and Vite production bundle). Lint: `npm run lint` passed with existing warnings.

## Left alone

- Vaul Drawer, cmdk Command, Sonner, React Day Picker, and other non-Radix libraries were not migrated.
- Original Bricklane theme, typography, spacing, class names, and catalog structure remain in place.

## Behavior changes

- Focus callbacks are mapped to Base `initialFocus`/`finalFocus`; edge cases may differ.
- Radix reduced-motion overrides were not fully restored on every migrated overlay wrapper. Verify using the OS reduced-motion setting.
- Base UI popup collision and dismissal semantics can differ; manual review is required for menus, selects, tooltips, and dialogs.

## Verify by hand

- Open catalog screens covering dialog/sheet, select, dropdown/context menu, popover, tooltip, accordion, radio, slider, and sidebar.
- Verify keyboard navigation, focus return, outside/Escape dismissal, typeahead, selection, and mobile behavior.
- Compare representative template screenshots at desktop/mobile widths and with reduced motion enabled to the existing Bricklane presentation.
