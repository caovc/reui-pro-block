# badge

2026-11-08, Base Nova registry plus transformation engine; migrated to Base UI while preserving Nova classes, Bricklane tokens, and existing consumer contracts.

## Changed

- `src/components/ui/badge.tsx`: replaced Radix primitives with Base UI parts and adapted props/semantics while retaining visual classes.
- Consumers across `src/blocks/`, `src/templates/`, and `src/components/reui/`: translated Radix `asChild` usage to Base UI `render` and adapted family-specific values/callbacks.
- `src/components/ui/badge.tsx` leftover scan: no `radix-ui` or `@radix-ui` imports.

## Left alone

- `src/components/ui/command.tsx` (cmdk) and `src/components/ui/drawer.tsx` (Vaul) remain on their original libraries; neither is a Radix wrapper.
- ReUI custom headless widgets stay custom and now use Base UI `useRender` through `src/components/ui/render-slot.tsx` where composition is needed.

## Behavior changes

- Base UI interaction semantics differ in some details from Radix: focus restoration/auto-focus callbacks are bridged where callers depended on them; menu dismissal, collision handling, and activation behavior should receive manual confirmation.
- Reduced-motion overrides previously applied by select Radix wrappers were not fully restored in the Base Nova registry wrappers; confirm reduced-motion behavior before release.

## Verify by hand

- Open/close with keyboard and pointer; confirm focus returns to the invoking control.
- Check disabled, selected, and expanded states retain the Bricklane/Nova visual tokens.
- Check narrow viewport placement, collisions, and reduced-motion behavior for overlay components.
