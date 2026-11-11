# Component library and style implementation plan

Bricklane's global Customize panel lets visitors select a component library and a style. Preview, shared presets, source view, copying, individual source downloads, and runnable ZIPs reflect the same selection. Existing previews and presets default to Radix Nova.

## Builds and configuration

- Put the two library identifiers and supported ReUI style identifiers in `src/lib/ui-foundation.ts`. Keep the current `components.json` as the Radix Nova registry configuration for repository development.
- Compile the same block and template routes twice. The root serves Radix and `base/` serves Base UI. `vite.config.ts` resolves alternate foundation modules in the Base UI build. Global Customize switches library by opening the same hash route in the matching build. Style changes apply without opening another build.
- Store `primitive` and `style` in the existing global theme preset. Keep extra URL parameters when switching builds. Older presets load with their existing color and layout choices.

## Component implementations

- Use the official free ReUI variants wherever they supply the component. For foundation components supplied by shadcn/ui, use its Base UI implementation and retain the existing consumer API. PR #1 is a reference for migration and regression cases.
- Add alternate foundation modules under `src/foundations/base/ui/`. Preserve the existing slots, semantic states, focus and dismissal, reduced motion, and controlled and uncontrolled values. Update shared ReUI modules that directly consume Radix Slot so both builds can keep the same block and template code.
- Derive style CSS from the public Nova, Vega, Maia, Lyra, Mira, Luma, Sera, and Rhea styles. Apply the same CSS in the preview and the downloaded project and preserve existing custom color, font, and radius settings.

## Source and export

- `src/lib/source.ts` and `src/templates/source.ts` select alternate modules using the active library before walking dependencies. The alternate modules use their logical source paths in the source viewer and ZIP. The same contents back the editor, clipboard, and single-file download.
- `src/lib/bundle.ts` and `src/templates/source.ts` emit the selected style and its registry configuration along with its stylesheet and dependency manifest. Keep MIT notices and the repository's original preview assets.

## Verification and release

- Run `npm run format:check`, `npm run lint`, `npm run test:tooling`, and `npm run build`. Check both entry points in the production build and select both libraries from the regular Customize panel.
- Exercise library and style selection, reload, and shareable presets in block and template previews. Recheck menu actions, labels, checkbox toggling, keyboard tabs, focus, and reduced motion against the regressions identified in PR #1.
- Download representative block and template ZIPs under each library and a non-Nova style. Verify source and dependency closure, build the extracted projects, and confirm the chosen style appears in the rendered output.
- Integrate reviewed commits from the participating worktrees. Push validated milestones and check the GitHub Actions and Pages results for the pushed commit.
