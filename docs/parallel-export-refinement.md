# Standalone source export refinement

Date: 2026-10-22. Standalone source export audit.

## Defect and change

`src/lib/source.ts` cut the exported theme before the shared `html` rule. This omitted the body baseline and interaction/focus styles. A downloaded starter built successfully but rendered its body at 16px, while the isolated website preview used 14px.

The extraction boundary now starts at `.brand`, after the shared element rules and before the site chrome. This retains the 14px body baseline, font smoothing, touch behavior and focus styles. `bundle.ts` and `download.ts` did not need changes.

## Evidence

The agent used the real Download source action for application `auth-20`, commerce `product-card-8` and data `chart-16`, before and after the correction. All three extracted starters passed `npm run build`; after the fix, all three reported a computed body font size of 14px. Their extracted `theme.css` excludes `.brand` and `.site-shell`.

Standalone browser checks at 1440×900 and 390×844 found no document overflow, page errors or failed images. Auth password visibility changed the input to `type=text`; the chart's 2D control reached its selected state. The commerce starter also included the new pricing refinement helper and built successfully.

Temporary reproducibility scripts: `/tmp/reui-parallel-check-export.mjs` and `/tmp/reui-parallel-render-export.mjs`. Build validation reused installed dependency versions rather than making a fresh network installation. Temporary artifacts are evidence from this session, not committed fixtures.

This verifies the sampled exports and shared style defect. It does not establish per-entry visual fidelity across the entire catalog, and is limited to the shared style correction and these sampled starters.

The release coordinator independently repeated all three actual ZIP downloads against the isolated production build: 56/58/58 source files, successful builds, 14px body text, no runtime errors, no failed images, and no document overflow at 1440px or 390px. Dependencies were reused from the installed lockfile environment.
